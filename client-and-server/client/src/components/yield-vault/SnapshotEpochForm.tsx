'use client';

import { useState } from 'react';
import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import { useAccount } from 'wagmi';
import { SimpleCard } from '@/components/ui/SimpleCard';

export function SnapshotEpochForm() {
  const [balanceRoot, setBalanceRoot] = useState('');
  const [totalYield, setTotalYield] = useState('');
  const [snapshotError, setSnapshotError] = useState<string>('');
  const { snapshotEpoch, isPending, isConfirming, isConfirmed, error, isOwner, refetchEpochId } = useYieldVault();
  const { isConnected, address } = useAccount();

  const handleSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setSnapshotError('');
    
    // Validation
    if (!balanceRoot || balanceRoot.trim() === '') {
      setSnapshotError('Please enter a valid balance root (32 bytes hex string)');
      return;
    }

    if (!totalYield || parseFloat(totalYield) < 0) {
      setSnapshotError('Please enter a valid total yield amount');
      return;
    }

    // Validate balance root format (should be 0x followed by 64 hex characters)
    const balanceRootRegex = /^0x[0-9a-fA-F]{64}$/;
    if (!balanceRootRegex.test(balanceRoot)) {
      setSnapshotError('Balance root must be a valid bytes32 hex string (0x followed by 64 hex characters)');
      return;
    }

    try {
      console.log('Starting epoch snapshot with:', {
        balanceRoot,
        totalYield,
      });
      
      await snapshotEpoch(balanceRoot as `0x${string}`, totalYield);
      
      // Clear form on success
      setBalanceRoot('');
      setTotalYield('');
      
      // Refetch epoch ID after confirmation
      if (isConfirmed) {
        await refetchEpochId();
      }
    } catch (err: any) {
      console.error('Snapshot error:', err);
      
      // Extract user-friendly error message
      let errorMessage = 'Snapshot failed. Please try again.';
      
      if (err?.message) {
        if (err.message.includes('user rejected') || err.message.includes('User rejected') || err.message.includes('user cancel')) {
          errorMessage = 'Transaction was rejected. Please approve the transaction in your wallet to proceed.';
        } else if (err.message.includes('Unauthorized') || err.message.includes('unauthorized')) {
          errorMessage = 'Only the contract owner can snapshot epochs.';
        } else if (err.message.includes('EpochAlreadyEnded')) {
          errorMessage = 'This epoch has already been snapshotted.';
        } else if (err.message.includes('gas')) {
          errorMessage = 'Gas estimation failed. The transaction might revert. Please check your inputs and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setSnapshotError(errorMessage);
    }
  };

  if (!isConnected) {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <span>Please connect your wallet to snapshot epochs</span>
      </div>
    );
  }

  if (isOwner === false) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>Access denied. Only the contract owner can snapshot epochs. Connected address: {address}</span>
      </div>
    );
  }

  return (
    <SimpleCard title="Snapshot Current Epoch">
      <form onSubmit={handleSnapshot} className="d-flex flex-column gap-3">
        {/* Balance Root Input */}
        <div>
          <label htmlFor="balanceRoot" className="form-label" style={{fontSize: '0.75rem', fontWeight: 500}}>
            Balance Root (bytes32)
          </label>
          <input
            type="text"
            className="form-control"
            id="balanceRoot"
            value={balanceRoot}
            onChange={(e) => setBalanceRoot(e.target.value)}
            placeholder="0x0000000000000000000000000000000000000000000000000000000000000000"
            disabled={isPending || isConfirming}
            style={{fontSize: '0.875rem'}}
          />
          <div className="form-text" style={{fontSize: '0.7rem'}}>
            The Merkle root of all user balances at the snapshot
          </div>
        </div>

        {/* Total Yield Input */}
        <div>
          <label htmlFor="totalYield" className="form-label" style={{fontSize: '0.75rem', fontWeight: 500}}>
            Total Yield (uint64)
          </label>
          <input
            type="number"
            className="form-control"
            id="totalYield"
            value={totalYield}
            onChange={(e) => setTotalYield(e.target.value)}
            placeholder="0"
            min="0"
            step="1"
            disabled={isPending || isConfirming}
            style={{fontSize: '0.875rem'}}
          />
          <div className="form-text" style={{fontSize: '0.7rem'}}>
            The total yield generated in the current epoch (in wei)
          </div>
        </div>

        {/* Error Display */}
        {(snapshotError || error) && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert" style={{fontSize: '0.75rem'}}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{snapshotError || error?.message}</span>
          </div>
        )}

        {/* Success Display */}
        {isConfirmed && !snapshotError && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-0" role="alert" style={{fontSize: '0.75rem'}}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Epoch snapshot successful! New epoch has been started.</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isPending || isConfirming || !balanceRoot || !totalYield}
          style={{fontSize: '0.875rem'}}
        >
          {isPending || isConfirming ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {isPending ? 'Confirming...' : 'Processing...'}
            </>
          ) : (
            'Snapshot Epoch'
          )}
        </button>
      </form>
    </SimpleCard>
  );
}
