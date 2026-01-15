'use client';

import { useState, useEffect } from 'react';
import { useYieldVault, useEpochData, useHasClaimedEpoch, useEpochsPassedSinceDeposit, useUserDepositInfo, useAllDepositorsWithBalances } from '@/hooks/yield-vault/useYieldVault';
import { useZkYieldProofProver } from '@/hooks/zk-circuits/useZkYieldProofProver';
import { useAccount } from 'wagmi';
import { generateNullifier } from '@/zk-circuits/zkYieldProofProver';
import type { ProofInputs } from '@/zk-circuits/zkYieldProofProver';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { buildMerkleTree, generateMerkleProof, type UserBalance } from '@/zk-circuits/merkleTree';
import { poseidon1 } from 'poseidon-lite';

export function ClaimYieldForm() {
  const [step, setStep] = useState<'input' | 'generating' | 'claiming'>('input');
  
  // Auto-calculated values (not editable by user, but displayed)
  const [autoNullifierSecret, setAutoNullifierSecret] = useState('');
  const [autoMerkleSiblings, setAutoMerkleSiblings] = useState('');
  const [autoMerkleIndex, setAutoMerkleIndex] = useState('0');
  const [calculationReady, setCalculationReady] = useState(false);
  const [selectedEpochId, setSelectedEpochId] = useState<string>('');
  
  const { isConnected, address } = useAccount();
  const { 
    claimYield, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    error: claimError,
    userBalance,
    refetchBalance,
    currentEpochId 
  } = useYieldVault();
  
  // Get epochs passed from contract
  const { epochsPassed: contractEpochsPassed } = useEpochsPassedSinceDeposit();
  const { depositInfo } = useUserDepositInfo();
  const { depositorsData } = useAllDepositorsWithBalances();
  
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
  const { epochData } = useEpochData(epochIdBigInt);
  const { hasClaimed } = useHasClaimedEpoch(epochIdBigInt);

  // Use epochs passed from contract, fallback to current calculation
  const epochsPassed = contractEpochsPassed !== undefined 
    ? Number(contractEpochsPassed)
    : (currentEpochId !== undefined && userBalance && userBalance > 0n
        ? Number(currentEpochId)
        : 0);

  // Auto-calculate Merkle proof and nullifier when epoch is selected
  useEffect(() => {
    if (!selectedEpochId || !address || !epochData || !userBalance || !depositorsData) {
      setCalculationReady(false);
      return;
    }

    try {
      // 1. Generate nullifier secret from user address and epoch
      const secretInput = poseidon1([BigInt(address), BigInt(selectedEpochId)]);
      setAutoNullifierSecret(secretInput.toString());

      // 2. Build Merkle tree with ACTUAL user balances from contract
      const [addresses, balances] = depositorsData as [readonly `0x${string}`[], readonly bigint[]];
      
      const actualBalances: UserBalance[] = addresses.map((addr, index) => ({
        address: addr,
        balance: balances[index],
      }));

      // Filter out users with zero balance
      const activeBalances = actualBalances.filter(ub => ub.balance > 0n);
      
      if (activeBalances.length === 0) {
        console.error('No active depositors found');
        setCalculationReady(false);
        return;
      }

      // Build Merkle tree (tree is implicitly used in generateMerkleProof)
      buildMerkleTree(activeBalances);
      
      // 3. Generate Merkle proof for current user
      const proof = generateMerkleProof(activeBalances, address);
      
      if (proof) {
        setAutoMerkleSiblings(proof.siblings.map(s => s.toString()).join(', '));
        setAutoMerkleIndex(proof.index.toString());
        setCalculationReady(true);
      } else {
        console.error('Failed to generate Merkle proof');
        setCalculationReady(false);
      }
    } catch (error) {
      console.error('Error calculating proof parameters:', error);
      setCalculationReady(false);
    }
  }, [selectedEpochId, address, epochData, userBalance, depositorsData]);

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
      // Step 1: Generate proof
      setStep('generating');
      
      // Parse Merkle siblings
      const siblingsArray = autoMerkleSiblings
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Generate nullifier from auto-calculated secret
      const nullifier = generateNullifier(autoNullifierSecret);

      const proofInputs: ProofInputs = {
        user_balance: userBalance.toString(),
        user_balance_merkle_path: siblingsArray,
        user_balance_merkle_index: autoMerkleIndex,
        epoch_start: epochData[1].toString(), // startBlock
        epoch_end: epochData[2].toString(),   // endBlock
        latest_block_number: epochData[2].toString(), // Using endBlock as latest
        yield_rate: epochData[4].toString(),  // totalYield (using as rate for now)
        expected_latest_user_balance_root: epochData[5], // balanceRoot
        latest_total_yield: epochData[4].toString(),
        nullifier_secret: nullifier.toString(),
      };

      await generateProof(proofInputs);
      
      // Step 2: Claim yield with proof
      setStep('claiming');
      const formattedProof = getFormattedProof();
      
      if (!formattedProof) {
        throw new Error('Failed to format proof');
      }

      await claimYield(
        BigInt(selectedEpochId),
        formattedProof.proof,
        formattedProof.publicInputs
      );

      // Reset form after successful claim
      if (isConfirmed) {
        setSelectedEpochId('');
        setAutoNullifierSecret('');
        setAutoMerkleSiblings('');
        setAutoMerkleIndex('0');
        setCalculationReady(false);
        setStep('input');
        await refetchBalance();
      }
    } catch (err) {
      console.error('Claim error:', err);
      setStep('input');
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
              and is snapshotted. The contract owner needs to call <code className="bg-white px-1 rounded">snapshotEpoch()</code> to advance epochs.
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

        {isConfirmed && (
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
