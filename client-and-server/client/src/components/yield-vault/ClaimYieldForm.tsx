'use client';

import { useState } from 'react';
import { useYieldVault, useEpochData, useHasClaimedEpoch } from '@/hooks/yield-vault/useYieldVault';
import { useZkYieldProofProver } from '@/hooks/zk-circuits/useZkYieldProofProver';
import { useAccount } from 'wagmi';
import { generateNullifier } from '@/zk-circuits/zkYieldProofProver';
import type { ProofInputs } from '@/zk-circuits/zkYieldProofProver';
import { SimpleCard } from '@/components/ui/SimpleCard';

export function ClaimYieldForm() {
  const [epochId, setEpochId] = useState('');
  const [nullifierSecret, setNullifierSecret] = useState('');
  const [merkleSiblings, setMerkleSiblings] = useState('');
  const [merkleIndex, setMerkleIndex] = useState('0');
  const [step, setStep] = useState<'input' | 'generating' | 'claiming'>('input');
  
  const { isConnected } = useAccount();
  const { 
    claimYield, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    error: claimError,
    userBalance,
    refetchBalance 
  } = useYieldVault();
  
  const { 
    generateProof, 
    isGenerating, 
    error: proofError, 
    getFormattedProof 
  } = useZkYieldProofProver();

  const epochIdBigInt = epochId ? BigInt(epochId) : undefined;
  const { epochData } = useEpochData(epochIdBigInt);
  const { hasClaimed } = useHasClaimedEpoch(epochIdBigInt);

  const handleGenerateAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!epochData || !userBalance) {
      alert('Unable to load epoch data or user balance');
      return;
    }

    if (hasClaimed) {
      alert('You have already claimed yield for this epoch');
      return;
    }

    try {
      // Step 1: Generate proof
      setStep('generating');
      
      // Parse Merkle siblings (ZK-Kit format)
      const siblingsArray = merkleSiblings
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Generate nullifier from secret using Poseidon
      const nullifier = generateNullifier(nullifierSecret);

      const proofInputs: ProofInputs = {
        user_balance: userBalance.toString(),
        user_balance_merkle_path: siblingsArray,
        user_balance_merkle_index: merkleIndex,
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
        BigInt(epochId),
        formattedProof.proof,
        formattedProof.publicInputs
      );

      // Reset form after successful claim
      if (isConfirmed) {
        setEpochId('');
        setNullifierSecret('');
        setMerkleSiblings('');
        setMerkleIndex('0');
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
      {hasClaimed && epochId && (
        <div className="flex items-center gap-2 p-3 mb-3 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          You have already claimed yield for epoch {epochId}
        </div>
      )}

      <form onSubmit={handleGenerateAndClaim} className="space-y-4">
        {/* Epoch ID */}
        <div className="flex flex-col gap-1">
          <label htmlFor="epochId" className="text-xs font-medium text-gray-700">
            Epoch ID
          </label>
          <input
            id="epochId"
            type="number"
            min="0"
            value={epochId}
            onChange={(e) => setEpochId(e.target.value)}
            placeholder="0"
            disabled={step !== 'input'}
            required
            className="w-full px-2 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
          />
        </div>

        {epochData && epochId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1">
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

        {/* Nullifier Secret */}
        <div className="flex flex-col gap-1">
          <label htmlFor="nullifierSecret" className="text-xs font-medium text-gray-700">
            Nullifier Secret
          </label>
          <input
            id="nullifierSecret"
            type="text"
            value={nullifierSecret}
            onChange={(e) => setNullifierSecret(e.target.value)}
            placeholder="Enter a unique secret"
            disabled={step !== 'input'}
            required
            className="w-full px-2 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
          />
          <p className="text-2xs text-gray-500">This prevents double-claiming. Keep it secret!</p>
        </div>

        {/* Merkle Siblings */}
        <div className="flex flex-col gap-1">
          <label htmlFor="merkleSiblings" className="text-xs font-medium text-gray-700">
            Merkle Siblings (comma-separated)
          </label>
          <textarea
            id="merkleSiblings"
            value={merkleSiblings}
            onChange={(e) => setMerkleSiblings(e.target.value)}
            placeholder="123456..., 789012..., 345678..."
            disabled={step !== 'input'}
            rows={3}
            required
            className="w-full px-2 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 resize-none"
          />
          <p className="text-2xs text-gray-500">Enter the Merkle proof siblings from ZK-Kit (bigint values)</p>
        </div>

        {/* Merkle Index */}
        <div className="flex flex-col gap-1">
          <label htmlFor="merkleIndex" className="text-xs font-medium text-gray-700">
            Merkle Index
          </label>
          <input
            id="merkleIndex"
            type="number"
            min="0"
            value={merkleIndex}
            onChange={(e) => setMerkleIndex(e.target.value)}
            disabled={step !== 'input'}
            required
            className="w-full px-2 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={
            step !== 'input' || 
            !epochId || 
            !nullifierSecret || 
            !merkleSiblings ||
            hasClaimed
          }
          className="w-full bg-[#5792FF] text-sm text-white font-bold py-2 rounded-lg hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
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
        <h3 className="text-xs font-semibold text-gray-900 mb-2">How it works (using ZK-Kit):</h3>
        <ol className="space-y-1 text-xs text-gray-600 list-decimal list-inside">
          <li>Enter the epoch ID you want to claim yield for</li>
          <li>Provide a unique nullifier secret (hashed with Poseidon)</li>
          <li>Enter your Merkle proof siblings from ZK-Kit LeanIMT</li>
          <li>Click to generate ZK proof and claim your yield</li>
        </ol>
        <div className="mt-2 p-2 bg-gray-50 rounded-md">
          <p className="text-2xs text-gray-600">
            <strong>ZK-Kit Integration:</strong> This app uses ZK-Kit&apos;s LeanIMT for Merkle tree operations 
            and Poseidon hash for ZK-friendly cryptography. The Merkle proof ensures your balance is included 
            in the epoch snapshot while maintaining privacy.
          </p>
        </div>
      </div>
    </SimpleCard>
  );
}
