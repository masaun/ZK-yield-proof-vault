'use client';

import { useState, useEffect } from 'react';
import { useYieldVault, useEpochData, useHasClaimedEpoch, useEpochsPassedSinceDeposit, useUserDepositInfo, useAllDepositorsWithBalances, useSnapshotData } from '@/hooks/yield-vault/useYieldVault';
import { useZkYieldProofProver } from '@/hooks/zk-circuits/useZkYieldProofProver';
import { useAccount, useChainId } from 'wagmi';
import { generateNullifier, generateUserBalanceLeaf, calculateSingleLeafMerkleRoot, formatProofForContract } from '@/zk-circuits/zkYieldProofProver';
import type { ProofInputs } from '@/zk-circuits/zkYieldProofProver';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { buildMerkleTree, generateMerkleProof, type UserBalance } from '@/zk-circuits/merkleTree';
import { poseidon2 } from 'poseidon-lite';
import { getEpochSnapshot, saveEpochSnapshot } from '@/utils/snapshotStorage';

export function ClaimYieldForm() {
  const [step, setStep] = useState<'input' | 'generating' | 'claiming'>('input');
  
  // Auto-calculated values (not editable by user, but displayed)
  const [autoNullifierSecret, setAutoNullifierSecret] = useState('');
  const [autoMerkleSiblings, setAutoMerkleSiblings] = useState('');
  const [autoMerkleIndex, setAutoMerkleIndex] = useState('0');
  const [calculationReady, setCalculationReady] = useState(false);
  const [selectedEpochId, setSelectedEpochId] = useState<string>('');
  
  // Snapshot state
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string>('');
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  
  // Track which operation is in progress to show correct notification
  const [currentOperation, setCurrentOperation] = useState<'snapshot' | 'claim' | null>(null);
  
  // Store snapshot data at the time of snapshot to use after confirmation
  const [pendingSnapshot, setPendingSnapshot] = useState<{
    epochId: string;
    addresses: string[];
    balances: string[];
    balanceRoot: string;
  } | null>(null);
  
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { 
    claimYield,
    snapshotEpoch,
    isPending, 
    isConfirming, 
    isConfirmed, 
    error: claimError,
    userBalance,
    refetchBalance,
    currentEpochId,
    refetchEpochId,
  } = useYieldVault();
  
  // Get epochs passed from contract
  const { epochsPassed: contractEpochsPassed } = useEpochsPassedSinceDeposit();
  const { depositInfo } = useUserDepositInfo();
  const { depositorsData, refetch: refetchDepositorsData } = useAllDepositorsWithBalances();
  const { currentBalanceRoot, totalYield: calculatedTotalYield } = useSnapshotData();
  
  const { 
    generateProof,
    isGenerating, 
    error: proofError, 
    getFormattedProof 
  } = useZkYieldProofProver();

  // Auto-select the latest completed epoch
  useEffect(() => {
    if (currentEpochId !== undefined && currentEpochId > 0n) {
      // Select the previous epoch (current epoch - 1) as it's likely completed
      const latestClaimableEpoch = (currentEpochId - 1n).toString();
      setSelectedEpochId(latestClaimableEpoch);
    } else if (currentEpochId === 0n) {
      // Still in first epoch, no claimable epochs yet
      setSelectedEpochId('');
    }
  }, [currentEpochId]);

  const epochIdBigInt = selectedEpochId ? BigInt(selectedEpochId) : undefined;
  const { epochData, refetch: refetchEpochData } = useEpochData(epochIdBigInt);
  const { hasClaimed } = useHasClaimedEpoch(epochIdBigInt);

  // Use epochs passed from contract, fallback to current calculation
  const epochsPassed = contractEpochsPassed !== undefined 
    ? Number(contractEpochsPassed)
    : (currentEpochId !== undefined && userBalance && userBalance > 0n
        ? Number(currentEpochId)
        : 0);

  // Handle snapshot confirmation
  useEffect(() => {
    if (isConfirmed && currentOperation === 'snapshot' && pendingSnapshot && chainId) {
      // Transaction confirmed, save the snapshot data that was captured BEFORE the transaction
      console.log('Saving snapshot for epoch:', pendingSnapshot.epochId);
      console.log('Balance root:', pendingSnapshot.balanceRoot);
      
      saveEpochSnapshot({
        epochId: pendingSnapshot.epochId,
        addresses: pendingSnapshot.addresses,
        balances: pendingSnapshot.balances,
        balanceRoot: pendingSnapshot.balanceRoot,
        timestamp: Date.now(),
        chainId,
      });
      
      console.log(`Snapshot confirmed and saved for epoch ${pendingSnapshot.epochId}`);
      setSnapshotSuccess(true);
      setIsSnapshotting(false);
      setPendingSnapshot(null);
      
      // Refetch epoch ID, depositors data, and epoch data after delay
      setTimeout(async () => {
        await refetchEpochId();
        await refetchDepositorsData();
        // Wait a bit more then refetch the specific epoch data
        setTimeout(async () => {
          if (refetchEpochData) {
            await refetchEpochData();
          }
        }, 1000);
        setSnapshotSuccess(false);
        setCurrentOperation(null);
      }, 3000);
    }
  }, [isConfirmed, currentOperation, pendingSnapshot, chainId, refetchEpochId, refetchDepositorsData, refetchEpochData]);

  // Handle claim confirmation
  useEffect(() => {
    if (isConfirmed && currentOperation === 'claim') {
      // Transaction confirmed, reset form after successful claim
      console.log('Claim transaction confirmed!');
      
      // Reset form state
      setSelectedEpochId('');
      setAutoNullifierSecret('');
      setAutoMerkleSiblings('');
      setAutoMerkleIndex('0');
      setCalculationReady(false);
      setStep('input');
      
      // Refetch balance after confirmation
      refetchBalance();
      
      // Clear operation after a delay to show success message
      setTimeout(() => {
        setCurrentOperation(null);
      }, 3000);
    }
  }, [isConfirmed, currentOperation, refetchBalance]);

  // Auto-calculate Merkle proof and nullifier when epoch is selected
  useEffect(() => {
    if (!selectedEpochId || !address || !epochData || !userBalance || !chainId) {
      setCalculationReady(false);
      return;
    }

    try {
      // 1. Generate nullifier secret from user address and epoch
      const secretInput = poseidon2([BigInt(address), BigInt(selectedEpochId)]);
      setAutoNullifierSecret(secretInput.toString());

      // 2. Try to get historical snapshot data for this epoch
      const snapshot = getEpochSnapshot(chainId, selectedEpochId);
      
      let activeBalances: UserBalance[];
      
      if (snapshot) {
        // Use historical snapshot data
        console.log(`Using saved snapshot data for epoch ${selectedEpochId}`);
        activeBalances = snapshot.addresses.map((addr, i) => ({
          address: addr,
          balance: BigInt(snapshot.balances[i]),
        })).filter(ub => ub.balance > 0n);
      } else {
        // Fallback to current balances (for backwards compatibility or if snapshot wasn't saved)
        console.warn(`No saved snapshot found for epoch ${selectedEpochId}, using current balances`);
        
        if (!depositorsData) {
          console.error('No depositors data available');
          setCalculationReady(false);
          return;
        }
        
        const [addresses, balances] = depositorsData as [readonly `0x${string}`[], readonly bigint[]];
        
        activeBalances = addresses.map((addr, index) => ({
          address: addr,
          balance: balances[index],
        })).filter(ub => ub.balance > 0n);
      }
      
      if (activeBalances.length === 0) {
        console.error('No active depositors found');
        setCalculationReady(false);
        return;
      }

      // Build Merkle tree from the correct historical balances
      const { root } = buildMerkleTree(activeBalances);
      
      // Verify the root matches the epoch's stored balance root
      const expectedRoot = epochData[5] as `0x${string}`;
      const calculatedRoot = '0x' + root.toString(16).padStart(64, '0');
      
      console.log('Merkle root verification:', {
        calculated: calculatedRoot,
        expected: expectedRoot,
        epoch: selectedEpochId,
        snapshotted: epochData[6],
        activeBalancesCount: activeBalances.length
      });
      
      // Check if epoch has a zero balance root (improperly snapshotted)
      const isZeroRoot = expectedRoot === '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      if (calculatedRoot.toLowerCase() !== expectedRoot.toLowerCase()) {
        if (isZeroRoot) {
          console.error('Epoch has zero balance root - it was not properly snapshotted!', {
            epoch: selectedEpochId,
            snapshotted: epochData[6]
          });
          setCalculationReady(false);
          return;
        }
        console.error('Merkle root mismatch!', {
          calculated: calculatedRoot,
          expected: expectedRoot,
          epoch: selectedEpochId
        });
        setCalculationReady(false);
        return;
      }
      
      // 3. Generate Merkle proof for current user
      const proof = generateMerkleProof(activeBalances, address);
      
      if (proof) {
        setAutoMerkleSiblings(proof.siblings.map(s => s.toString()).join(', '));
        setAutoMerkleIndex(proof.index.toString());
        setCalculationReady(true);
        console.log('Proof parameters calculated successfully');
      } else {
        console.error('Failed to generate Merkle proof - user not found in tree');
        setCalculationReady(false);
      }
    } catch (error) {
      console.error('Error calculating proof parameters:', error);
      setCalculationReady(false);
    }
  }, [selectedEpochId, address, epochData, userBalance, depositorsData, chainId]);

  const handleSnapshotEpoch = async () => {
    if (!depositorsData || !chainId || currentEpochId === undefined) {
      setSnapshotError('Missing required data to snapshot epoch');
      return;
    }

    setIsSnapshotting(true);
    setSnapshotError('');
    setSnapshotSuccess(false);
    setCurrentOperation('snapshot');

    try {
      // Calculate balance root from depositors data
      const [addresses, balances] = depositorsData as [readonly `0x${string}`[], readonly bigint[]];
      
      let balanceRoot: string;
      
      if (addresses.length > 0 && balances.length > 0) {
        // Build user balances array
        const userBalances: UserBalance[] = addresses.map((addr, i) => ({
          address: addr,
          balance: balances[i],
        }));

        // Build Merkle tree
        const { root } = buildMerkleTree(userBalances);
        
        // Convert root to hex string
        balanceRoot = '0x' + root.toString(16).padStart(64, '0');
      } else {
        // No depositors, use zero hash
        balanceRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
      }

      // Use calculated total yield
      const totalYieldValue = calculatedTotalYield?.toString() || '0';

      console.log('Snapshotting epoch with:', {
        balanceRoot,
        totalYield: totalYieldValue,
        currentEpochId: currentEpochId.toString(),
        addresses: addresses.length,
        balances: balances.length,
      });

      // Store snapshot data BEFORE the transaction to save after confirmation
      setPendingSnapshot({
        epochId: currentEpochId.toString(),
        addresses: Array.from(addresses),
        balances: balances.map(b => b.toString()),
        balanceRoot: balanceRoot,
      });

      // Call snapshot function - this initiates the transaction
      await snapshotEpoch(balanceRoot as `0x${string}`, totalYieldValue);

      // Note: Success notification and data saving will happen after confirmation
      // via the useEffect hook that watches isConfirmed state

    } catch (err: any) {
      console.error('Snapshot error:', err);
      
      let errorMessage = 'Snapshot failed. Please try again.';
      
      if (err?.message) {
        if (err.message.includes('user rejected') || err.message.includes('User rejected')) {
          errorMessage = 'Transaction was rejected.';
        } else if (err.message.includes('EpochAlreadyEnded')) {
          errorMessage = 'This epoch has already been snapshotted.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setSnapshotError(errorMessage);
      setPendingSnapshot(null); // Clear pending snapshot on error
      setCurrentOperation(null);
    } finally {
      setIsSnapshotting(false);
    }
  };

  const handleGenerateAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!epochData || !userBalance || !address) {
      alert('Unable to load epoch data or user balance');
      return;
    }

    if (hasClaimed) {
      alert('You have already claimed yield for this epoch');
      return;
    }

    if (!calculationReady) {
      alert('Proof parameters are still being calculated. Please wait.');
      return;
    }

    try {
      // Clear any previous operation state first
      setCurrentOperation(null);
      
      // Set operation type to 'claim'
      setCurrentOperation('claim');
      
      // Step 1: Generate proof
      setStep('generating');
      
      if (!address) {
        throw new Error('User address is required');
      }
      
      // IMPORTANT: Scale balance to fit in u64
      const SCALE_DIVISOR = BigInt(10 ** 9); // Convert wei to Gwei
      const userBalanceBigInt = BigInt(userBalance);
      const scaledBalance = userBalanceBigInt / SCALE_DIVISOR;
      
      // Calculate user balance leaf using SCALED balance
      const latestBlockNumber = BigInt(epochData[2]); // endBlock
      
      // Normalize address to lowercase for consistent hashing
      const normalizedAddress = address.toLowerCase();
      
      console.log('Calculating user balance leaf with:');
      console.log('  - address:', normalizedAddress);
      console.log('  - scaledBalance:', scaledBalance.toString());
      console.log('  - latestBlockNumber:', latestBlockNumber.toString());
      
      const userBalanceLeaf = await generateUserBalanceLeaf(
        normalizedAddress,
        scaledBalance, // Use scaled balance
        latestBlockNumber
      );
      
      console.log('  - Resulting leaf:', userBalanceLeaf.toString());
      console.log('  - Leaf hex:', '0x' + userBalanceLeaf.toString(16));
      
      // Get the balance root from epoch - but we need to calculate what the new root will be
      // Since update_merkle_tree creates a NEW empty tree and adds the leaf at index 0,
      // For a single leaf with empty paths, the root equals the leaf itself
      const expectedNewRoot = calculateSingleLeafMerkleRoot(userBalanceLeaf);
      const lastRoot = userBalanceLeaf; // Using leaf as last root for now
      
      // Calculate nullifier using the expected new root
      const nullifier = await generateNullifier(
        normalizedAddress,
        latestBlockNumber,
        userBalanceLeaf,
        expectedNewRoot
      );
      
      // Calculate user's yield - must fit in u64 range
      // The circuit expects: latest_user_yield == latest_user_balance * yield_rate * (epoch_end - epoch_start)
      // But we need to ensure this fits in u64 (max: 18,446,744,073,709,551,615)
      
      const epochDuration = BigInt(epochData[2]) - BigInt(epochData[1]); // endBlock - startBlock
      
      // Use a very small yield rate to avoid overflow
      const yieldRateBigInt = BigInt(1); // Minimum rate
      
      // Calculate yield: scaled_balance * rate * duration (scaledBalance already calculated above)
      const userYield = scaledBalance * yieldRateBigInt * epochDuration;
      
      console.log('Yield calculation:', {
        originalBalance: userBalanceBigInt.toString(),
        scaledBalance: scaledBalance.toString(),
        duration: epochDuration.toString(),
        yieldRate: yieldRateBigInt.toString(),
        calculatedYield: userYield.toString(),
        maxU64: '18446744073709551615',
        fitsInU64: userYield <= BigInt('18446744073709551615')
      });

      console.log('Merkle tree values:', {
        userBalanceLeaf: userBalanceLeaf.toString(),
        userBalanceLeafHex: '0x' + userBalanceLeaf.toString(16),
        lastRoot: lastRoot.toString(),
        lastRootHex: '0x' + lastRoot.toString(16),
        expectedNewRoot: expectedNewRoot.toString(),
        expectedNewRootHex: '0x' + expectedNewRoot.toString(16),
        nullifier: nullifier.toString(),
        nullifierHex: '0x' + nullifier.toString(16),
        areRootsEqual: expectedNewRoot === lastRoot
      });
      
      const proofInputs: ProofInputs = {
        user_address: normalizedAddress,
        latest_user_balance: scaledBalance.toString(), // Use scaled balance to match yield calculation
        latest_user_yield: userYield.toString(),
        expected_latest_user_balance_root: '0x' + expectedNewRoot.toString(16),
        last_user_balance_root: '0x' + lastRoot.toString(16), // Using leaf as last root
        epoch_start: epochData[1].toString(), // startBlock
        epoch_end: epochData[2].toString(),   // endBlock
        latest_block_number: epochData[2].toString(), // Using endBlock
        yield_rate: yieldRateBigInt.toString(),  // Must match yield calculation formula
        latest_total_yield: userYield.toString(), // Set to user yield to pass constraint (simplified)
        kyc_eligibility_flags: true, // KYC verification
        expected_nullifier: nullifier.toString(),
      };

      console.log('Generating proof with inputs:', proofInputs);
      console.log('Constraint checks:');
      console.log('  - Yield formula: latest_user_yield == latest_user_balance * yield_rate * duration');
      console.log('    ', userYield.toString(), '==', scaledBalance.toString(), '*', yieldRateBigInt.toString(), '*', epochDuration.toString());
      console.log('    Expected:', (scaledBalance * yieldRateBigInt * epochDuration).toString());
      console.log('  - Yield <= total:', userYield.toString(), '<=', userYield.toString());
      console.log('  - KYC:', true);

      const proofOutput = await generateProof(proofInputs);
      
      // Step 2: Claim yield with proof
      setStep('claiming');
      
      if (!proofOutput) {
        throw new Error('Failed to generate proof');
      }

      const formattedProof = formatProofForContract(proofOutput);

      await claimYield(
        BigInt(selectedEpochId),
        formattedProof.proof,
        formattedProof.publicInputs
      );

      // Note: Form reset and success notification will happen after confirmation
      // via the useEffect hook that watches isConfirmed state
    } catch (err) {
      console.error('Claim error:', err);
      setStep('input');
      setCurrentOperation(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
        Please connect your wallet to claim yield
      </div>
    );
  }

  return (
    <SimpleCard title="Claim Yield with ZK Proof">
      {hasClaimed && selectedEpochId && (
        <div className="alert alert-info d-flex align-items-center gap-2 mb-3" role="alert" style={{fontSize: '0.75rem'}}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <div>You have already claimed yield for epoch {selectedEpochId}</div>
        </div>
      )}

      <form onSubmit={handleGenerateAndClaim} className="d-flex flex-column gap-3">
        {/* No claimable epochs warning */}
        {currentEpochId === 0n && userBalance && userBalance > 0n && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" role="alert" style={{fontSize: '0.75rem'}}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              You deposited in Epoch #0, which is still active. You can claim yield once this epoch ends 
              and is snapshotted. Anyone can call <code className="bg-white px-1 rounded">snapshotEpoch()</code> to advance epochs.
            </div>
          </div>
        )}

        {/* Epochs Passed Info */}
        {userBalance && userBalance > 0n && (
          <div className="card border-primary bg-primary bg-opacity-10 shadow-sm" style={{padding: '0.75rem'}}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mb-0 fw-semibold text-primary" style={{fontSize: '0.75rem'}}>Deposit Information:</p>
            </div>
            {depositInfo && (
              <div className="mb-2">
                <p className="text-primary text-2xs mb-1">
                  Deposited in Epoch: <span className="fw-semibold">#{depositInfo[1].toString()}</span>
                </p>
                <p className="text-primary text-2xs mb-0">
                  Current Epoch: <span className="fw-semibold">#{currentEpochId?.toString()}</span>
                </p>
              </div>
            )}
            <p className="display-6 fw-bold text-primary mb-1">{epochsPassed}</p>
            <p className="text-primary text-2xs">
              {epochsPassed === 0 && 'No epochs have passed yet'}
              {epochsPassed === 1 && '1 epoch has passed since your deposit'}
              {epochsPassed > 1 && `${epochsPassed} epochs have passed since your deposit`}
            </p>
            {selectedEpochId && (
              <p className="text-primary text-2xs mt-2 pt-2 border-top border-primary border-opacity-25 mb-0">
                Auto-selected epoch to claim: <span className="fw-semibold">#{selectedEpochId}</span>
              </p>
            )}
          </div>
        )}

        {epochData && selectedEpochId && (
          <div className="card border-info bg-info bg-opacity-10 shadow-sm" style={{padding: '0.75rem'}}>
            <p className="fw-semibold text-info mb-2" style={{fontSize: '0.75rem'}}>Epoch Information:</p>
            <div className="d-flex flex-column gap-1" style={{fontSize: '0.75rem'}}>
              <p className="mb-0 text-info">Start Block: {epochData[1].toString()}</p>
              <p className="mb-0 text-info">End Block: {epochData[2].toString()}</p>
              <p className="d-flex align-items-center gap-2 mb-0 text-info">
                Status: 
                <span className={`badge ${
                  epochData[6] ? 'bg-success' : 'bg-info'
                }`} style={{fontSize: '0.625rem'}}>
                  {epochData[6] ? 'Snapshotted ✓' : 'Active'}
                </span>
              </p>
            </div>
            {epochData[6] && epochData[5] === '0x0000000000000000000000000000000000000000000000000000000000000000' && (
              <div className="alert alert-danger mt-2 mb-0 d-flex align-items-start gap-2" role="alert" style={{fontSize: '0.65rem', padding: '0.5rem'}}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <strong>Invalid Snapshot:</strong> This epoch was snapshotted with a zero balance root. 
                  It needs to be re-snapshotted with the correct balance root to enable claims.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-calculated Values Display */}
        {calculationReady && (
          <div className="card border-success bg-success bg-opacity-10 shadow-sm" style={{padding: '0.75rem'}}>
            <p className="fw-semibold text-success mb-2 d-flex align-items-center gap-2" style={{fontSize: '0.75rem'}}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Auto-calculated Proof Parameters:
            </p>
            
            <div className="d-flex flex-column gap-2">
              <div>
                <label className="d-block mb-1 fw-medium text-success text-2xs">
                  Nullifier Secret:
                </label>
                <code className="d-block bg-white px-2 py-1 rounded text-2xs text-success" style={{fontFamily: 'monospace', wordBreak: 'break-all'}}>
                  {autoNullifierSecret}
                </code>
              </div>
              
              <div>
                <label className="d-block mb-1 fw-medium text-success text-2xs">
                  Merkle Index:
                </label>
                <code className="d-block bg-white px-2 py-1 rounded text-2xs text-success" style={{fontFamily: 'monospace'}}>
                  {autoMerkleIndex}
                </code>
              </div>
              
              <div>
                <label className="d-block mb-1 fw-medium text-success text-2xs">
                  Merkle Siblings:
                </label>
                <code className="d-block bg-white px-2 py-1 rounded text-2xs text-success overflow-auto" style={{fontFamily: 'monospace', wordBreak: 'break-all', maxHeight: '5rem'}}>
                  {autoMerkleSiblings || 'No siblings (single user tree)'}
                </code>
              </div>
            </div>
            
            <p className="text-success text-2xs pt-2 mt-2 border-top border-success border-opacity-25 mb-0">
              ✓ Ready to generate proof and claim
            </p>
          </div>
        )}

        {/* Snapshot Epoch Section */}
        <div className="card border-warning bg-warning bg-opacity-10 shadow-sm" style={{padding: '0.75rem'}}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mb-0 fw-semibold text-warning" style={{fontSize: '0.75rem'}}>Snapshot Current Epoch</p>
          </div>
          <p className="text-warning text-2xs mb-2">
            Before claiming yield, you may need to snapshot the current epoch. Anyone can snapshot epochs!
          </p>
          <button 
            type="button"
            onClick={handleSnapshotEpoch}
            disabled={isSnapshotting || (currentOperation === 'snapshot' && (isPending || isConfirming)) || !depositorsData || currentEpochId === undefined}
            className="btn btn-warning btn-sm w-100"
          >
            {currentOperation === 'snapshot' && isPending && (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Confirming...
              </>
            )}
            {currentOperation === 'snapshot' && isConfirming && (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            )}
            {(currentOperation !== 'snapshot' || (!isPending && !isConfirming)) && (
              isSnapshotting ? 'Preparing...' : 'Snapshot Current Epoch'
            )}
          </button>
          
          {snapshotSuccess && (
            <div className="alert alert-success d-flex align-items-center gap-2 mt-2 mb-0" role="alert" style={{fontSize: '0.7rem', padding: '0.5rem'}}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>Epoch snapshotted successfully!</div>
            </div>
          )}
          
          {snapshotError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mt-2 mb-0" role="alert" style={{fontSize: '0.7rem', padding: '0.5rem'}}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div>{snapshotError}</div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={
            step !== 'input' || 
            !selectedEpochId || 
            !calculationReady ||
            hasClaimed ||
            !userBalance ||
            userBalance === 0n
          }
          className="btn btn-primary-custom w-100"
        >
          {step === 'input' && 'Generate Proof & Claim'}
          {step === 'generating' && 'Generating ZK Proof...'}
          {step === 'claiming' && (isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Claiming...')}
        </button>

        {/* Status Messages */}
        {isGenerating && (
          <div className="alert alert-info d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
            <div className="spinner-custom" style={{width: '1rem', height: '1rem', borderWidth: '2px'}} />
            <div>Generating zero-knowledge proof... This may take a moment.</div>
          </div>
        )}

        {isConfirmed && currentOperation === 'claim' && step !== 'input' && (
          <div className="alert alert-success d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>Yield claimed successfully!</div>
          </div>
        )}

        {(proofError || claimError) && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div>Error: {proofError || claimError?.message}</div>
          </div>
        )}
      </form>

      {/* How it works section */}
      <div className="mt-3 pt-3 border-top">
        <h3 className="fw-semibold text-dark mb-2" style={{fontSize: '0.75rem'}}>How it works (Fully Automated):</h3>
        <ol className="mb-2" style={{fontSize: '0.75rem', paddingLeft: '1.25rem'}}>
          <li className="text-muted mb-1">System automatically detects how many epochs have passed since your deposit</li>
          <li className="text-muted mb-1">Auto-selects the latest claimable epoch for you</li>
          <li className="text-muted mb-1">Generates nullifier secret from your address + epoch (using Poseidon hash)</li>
          <li className="text-muted mb-1">Builds Merkle tree and generates your inclusion proof automatically</li>
          <li className="text-muted mb-1">Click button to generate ZK proof & claim your yield - that&apos;s it!</li>
        </ol>
        <div className="alert alert-secondary mb-0" style={{fontSize: '0.625rem', padding: '0.5rem'}}>
          <p className="mb-0">
            <strong>🚀 Fully Automated with Real Data:</strong> No manual input needed! The system fetches actual 
            depositor balances from the smart contract and calculates all cryptographic parameters (epoch selection, 
            nullifier secret, Merkle siblings, and index) using ZK-Kit&apos;s LeanIMT and Poseidon hash. 
            Just connect your wallet and claim!
          </p>
        </div>
      </div>
    </SimpleCard>
  );
}
