'use client';

import { useState } from 'react';
import { useYieldVault, useEpochData, useHasClaimedEpoch } from '@/hooks/yield-vault/useYieldVault';
import { useZkYieldProofProver } from '@/hooks/zk-circuits/useZkYieldProofProver';
import { useAccount } from 'wagmi';
import { generateNullifier } from '@/zk-circuits/zkYieldProofProver';
import type { ProofInputs } from '@/zk-circuits/zkYieldProofProver';

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
      <div className="claim-form">
        <p>Please connect your wallet to claim yield</p>
      </div>
    );
  }

  return (
    <div className="claim-form">
      <h2>Claim Yield with ZK Proof</h2>
      
      {hasClaimed && epochId && (
        <div className="info-message">
          ℹ️ You have already claimed yield for epoch {epochId}
        </div>
      )}

      <form onSubmit={handleGenerateAndClaim}>
        <div className="form-group">
          <label htmlFor="epochId">Epoch ID</label>
          <input
            id="epochId"
            type="number"
            min="0"
            value={epochId}
            onChange={(e) => setEpochId(e.target.value)}
            placeholder="0"
            disabled={step !== 'input'}
            required
          />
        </div>

        {epochData && epochId && (
          <div className="epoch-info">
            <p><strong>Epoch Info:</strong></p>
            <p>Start Block: {epochData[1].toString()}</p>
            <p>End Block: {epochData[2].toString()}</p>
            <p>Status: {epochData[6] ? 'Snapshotted ✓' : 'Active'}</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="nullifierSecret">Nullifier Secret</label>
          <input
            id="nullifierSecret"
            type="text"
            value={nullifierSecret}
            onChange={(e) => setNullifierSecret(e.target.value)}
            placeholder="Enter a unique secret"
            disabled={step !== 'input'}
            required
          />
          <small>This prevents double-claiming. Keep it secret!</small>
        </div>

        <div className="form-group">
          <label htmlFor="merkleSiblings">Merkle Siblings (comma-separated)</label>
          <textarea
            id="merkleSiblings"
            value={merkleSiblings}
            onChange={(e) => setMerkleSiblings(e.target.value)}
            placeholder="123456..., 789012..., 345678..."
            disabled={step !== 'input'}
            rows={3}
            required
          />
          <small>Enter the Merkle proof siblings from ZK-Kit (bigint values)</small>
        </div>

        <div className="form-group">
          <label htmlFor="merkleIndex">Merkle Index</label>
          <input
            id="merkleIndex"
            type="number"
            min="0"
            value={merkleIndex}
            onChange={(e) => setMerkleIndex(e.target.value)}
            disabled={step !== 'input'}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={
            step !== 'input' || 
            !epochId || 
            !nullifierSecret || 
            !merkleSiblings ||
            hasClaimed
          }
        >
          {step === 'input' && 'Generate Proof & Claim'}
          {step === 'generating' && 'Generating ZK Proof...'}
          {step === 'claiming' && (isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Claiming...')}
        </button>

        {isGenerating && (
          <div className="info-message">
            ⚙️ Generating zero-knowledge proof... This may take a moment.
          </div>
        )}

        {isConfirmed && (
          <div className="success-message">
            ✓ Yield claimed successfully!
          </div>
        )}

        {(proofError || claimError) && (
          <div className="error-message">
            Error: {proofError || claimError?.message}
          </div>
        )}
      </form>

      <div className="claim-info">
        <h3>How it works (using ZK-Kit):</h3>
        <ol>
          <li>Enter the epoch ID you want to claim yield for</li>
          <li>Provide a unique nullifier secret (hashed with Poseidon)</li>
          <li>Enter your Merkle proof siblings from ZK-Kit LeanIMT</li>
          <li>Click to generate ZK proof and claim your yield</li>
        </ol>
        <p className="note">
          <strong>ZK-Kit Integration:</strong> This app uses ZK-Kit&apos;s LeanIMT for Merkle tree operations 
          and Poseidon hash for ZK-friendly cryptography. The Merkle proof ensures your balance is included 
          in the epoch snapshot while maintaining privacy.
        </p>
      </div>
    </div>
  );
}
