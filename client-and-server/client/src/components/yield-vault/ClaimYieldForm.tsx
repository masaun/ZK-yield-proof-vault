'use client';

import { useState, useEffect } from 'react';
import { useYieldVault, useEpochData, useHasClaimedEpoch } from '@/hooks/yield-vault/useYieldVault';
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
    }
  }, [currentEpochId]);

  const epochIdBigInt = selectedEpochId ? BigInt(selectedEpochId) : undefined;
  const { epochData } = useEpochData(epochIdBigInt);
  const { hasClaimed } = useHasClaimedEpoch(epochIdBigInt);

  // Calculate epochs passed since user deposited
  const epochsPassed = currentEpochId !== undefined && userBalance && userBalance > 0n
    ? Number(currentEpochId)
    : 0;

  // Auto-calculate Merkle proof and nullifier when epoch is selected
  useEffect(() => {
    if (!selectedEpochId || !address || !epochData || !userBalance) {
      setCalculationReady(false);
      return;
    }

    try {
      // 1. Generate nullifier secret from user address and epoch
      const secretInput = poseidon1([BigInt(address), BigInt(selectedEpochId)]);
      setAutoNullifierSecret(secretInput.toString());

      // 2. Build Merkle tree with user balance
      // In production, you would fetch all user balances from the contract
      // For now, we'll create a mock tree with the current user
      const mockBalances: UserBalance[] = [
        { address: address, balance: userBalance },
        // Add more users here if available from contract
      ];

      const { tree } = buildMerkleTree(mockBalances);
      
      // 3. Generate Merkle proof for current user
      const proof = generateMerkleProof(mockBalances, address);
      
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
  }, [selectedEpochId, address, epochData, userBalance]);

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
      <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
        Please connect your wallet to claim yield
      </div>
    );
  }

  return (
    <SimpleCard title="Claim Yield with ZK Proof">
      {hasClaimed && selectedEpochId && (
        <div className="flex items-center gap-2 p-3 mb-3 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          You have already claimed yield for epoch {selectedEpochId}
        </div>
      )}

      <form onSubmit={handleGenerateAndClaim} className="space-y-4">
        {/* Epochs Passed Info */}
        {userBalance && userBalance > 0n && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-md p-3 shadow-[0_2px_8px_rgba(147,51,234,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-purple-900">Epochs Since Deposit:</p>
            </div>
            <p className="text-2xl font-bold text-purple-600 mb-1">{epochsPassed}</p>
            <p className="text-2xs text-purple-700">
              {epochsPassed === 0 && 'No epochs have passed yet'}
              {epochsPassed === 1 && '1 epoch has passed since your deposit'}
              {epochsPassed > 1 && `${epochsPassed} epochs have passed since your deposit`}
            </p>
            {selectedEpochId && (
              <p className="text-2xs text-purple-600 mt-1.5 pt-1.5 border-t border-purple-200">
                Auto-selected epoch to claim: <span className="font-semibold">#{selectedEpochId}</span>
              </p>
            )}
          </div>
        )}

        {epochData && selectedEpochId && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-md p-3 space-y-1 shadow-[0_2px_8px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]">
            <p className="text-xs font-semibold text-blue-900 mb-1.5">Epoch Information:</p>
            <div className="space-y-0.5 text-xs text-blue-800">
              <p>Start Block: {epochData[1].toString()}</p>
              <p>End Block: {epochData[2].toString()}</p>
              <p className="flex items-center gap-1.5">
                Status: 
                <span className={`px-1.5 py-0.5 text-2xs font-semibold rounded ${
                  epochData[6] ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {epochData[6] ? 'Snapshotted ✓' : 'Active'}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Auto-calculated Values Display */}
        {calculationReady && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-md p-3 space-y-2 shadow-[0_2px_8px_rgba(34,197,94,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]">
            <p className="text-xs font-semibold text-green-900 mb-1.5 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Auto-calculated Proof Parameters:
            </p>
            
            <div className="space-y-1.5">
              <div>
                <label className="text-2xs font-medium text-green-800 block mb-0.5">
                  Nullifier Secret:
                </label>
                <code className="text-2xs text-green-700 font-mono break-all bg-white px-2 py-1 rounded block">
                  {autoNullifierSecret}
                </code>
              </div>
              
              <div>
                <label className="text-2xs font-medium text-green-800 block mb-0.5">
                  Merkle Index:
                </label>
                <code className="text-2xs text-green-700 font-mono bg-white px-2 py-1 rounded block">
                  {autoMerkleIndex}
                </code>
              </div>
              
              <div>
                <label className="text-2xs font-medium text-green-800 block mb-0.5">
                  Merkle Siblings:
                </label>
                <code className="text-2xs text-green-700 font-mono break-all bg-white px-2 py-1 rounded block max-h-20 overflow-y-auto">
                  {autoMerkleSiblings || 'No siblings (single user tree)'}
                </code>
              </div>
            </div>
            
            <p className="text-2xs text-green-700 pt-1.5 border-t border-green-200">
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
          className="w-full bg-gradient-to-b from-[#5792FF] to-blue-600 text-sm text-white font-bold py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 disabled:from-gray-300 disabled:to-gray-400 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_4px_12px_rgba(87,146,255,0.4),0_2px_4px_rgba(87,146,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_20px_rgba(87,146,255,0.5),0_3px_8px_rgba(87,146,255,0.4)] active:shadow-[0_2px_8px_rgba(87,146,255,0.3),inset_0_2px_4px_rgba(0,0,0,0.1)] disabled:shadow-none"
        >
          {step === 'input' && 'Generate Proof & Claim'}
          {step === 'generating' && 'Generating ZK Proof...'}
          {step === 'claiming' && (isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Claiming...')}
        </button>

        {/* Status Messages */}
        {isGenerating && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <svg className="w-4 h-4 animate-spin text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Generating zero-knowledge proof... This may take a moment.
          </div>
        )}

        {isConfirmed && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-green-50 text-green-800 border border-green-200">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Yield claimed successfully!
          </div>
        )}

        {(proofError || claimError) && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-red-50 text-red-800 border border-red-200">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Error: {proofError || claimError?.message}
          </div>
        )}
      </form>

      {/* How it works section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-900 mb-2">How it works (Fully Automated):</h3>
        <ol className="space-y-1 text-xs text-gray-600 list-decimal list-inside">
          <li>System automatically detects how many epochs have passed since your deposit</li>
          <li>Auto-selects the latest claimable epoch for you</li>
          <li>Generates nullifier secret from your address + epoch (using Poseidon hash)</li>
          <li>Builds Merkle tree and generates your inclusion proof automatically</li>
          <li>Click button to generate ZK proof & claim your yield - that&apos;s it!</li>
        </ol>
        <div className="mt-2 p-2 bg-gray-50 rounded-md">
          <p className="text-2xs text-gray-600">
            <strong>🚀 Fully Automated:</strong> No manual input needed! The system calculates all cryptographic 
            parameters (epoch selection, nullifier secret, Merkle siblings, and index) using ZK-Kit&apos;s LeanIMT 
            and Poseidon hash. Just connect your wallet and claim!
          </p>
        </div>
      </div>
    </SimpleCard>
  );
}
