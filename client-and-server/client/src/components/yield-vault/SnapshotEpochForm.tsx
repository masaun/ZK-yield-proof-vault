'use client';

import { useState, useEffect } from 'react';
import { useYieldVault, useSnapshotData, useAllDepositorsWithBalances } from '@/hooks/yield-vault/useYieldVault';
import { useAccount } from 'wagmi';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { buildMerkleTree, type UserBalance } from '@/zk-circuits/merkleTree';

export function SnapshotEpochForm() {
  const [balanceRoot, setBalanceRoot] = useState('');
  const [totalYield, setTotalYield] = useState('');
  const [snapshotError, setSnapshotError] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { snapshotEpoch, isPending, isConfirming, isConfirmed, error, isOwner, refetchEpochId } = useYieldVault();
  const { currentBalanceRoot, totalYield: calculatedTotalYield } = useSnapshotData();
  const { depositorsData } = useAllDepositorsWithBalances();
  const { isConnected, address } = useAccount();

  // Automatically calculate and populate balance root and total yield
  useEffect(() => {
    const calculateSnapshotData = async () => {
      setIsCalculating(true);
      try {
        // Calculate balance root from depositors data
        if (depositorsData && depositorsData.length > 0) {
          const [addresses, balances] = depositorsData as [readonly string[], readonly bigint[]];
          
          if (addresses.length > 0 && balances.length > 0) {
            // Build user balances array
            const userBalances: UserBalance[] = addresses.map((addr, i) => ({
              address: addr,
              balance: balances[i],
            }));

            // Build Merkle tree
            const { root } = buildMerkleTree(userBalances);
            
            // Convert root to hex string
            const rootHex = '0x' + root.toString(16).padStart(64, '0');
            setBalanceRoot(rootHex);
          } else {
            // No depositors, use zero hash
            setBalanceRoot('0x0000000000000000000000000000000000000000000000000000000000000000');
          }
        } else if (currentBalanceRoot) {
          // Fallback to current balance root from contract
          setBalanceRoot(currentBalanceRoot);
        }

        // Set calculated total yield
        if (calculatedTotalYield !== undefined) {
          setTotalYield(calculatedTotalYield.toString());
        }
      } catch (err) {
        console.error('Error calculating snapshot data:', err);
        setSnapshotError('Failed to calculate snapshot data. Please refresh the page.');
      } finally {
        setIsCalculating(false);
      }
    };

    if (isConnected && isOwner) {
      calculateSnapshotData();
    }
  }, [depositorsData, currentBalanceRoot, calculatedTotalYield, isConnected, isOwner]);

  const handleSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setSnapshotError('');
    
    // Validation
    if (!balanceRoot || balanceRoot.trim() === '') {
      setSnapshotError('Balance root is not calculated. Please wait or refresh the page.');
      return;
    }

    if (!totalYield) {
      setSnapshotError('Total yield is not calculated. Please wait or refresh the page.');
      return;
    }

    // Validate balance root format (should be 0x followed by 64 hex characters)
    const balanceRootRegex = /^0x[0-9a-fA-F]{64}$/;
    if (!balanceRootRegex.test(balanceRoot)) {
      setSnapshotError('Balance root is invalid. Please refresh the page and try again.');
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
        {/* Info message about auto-calculation */}
        <div className="alert alert-info d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Balance root and total yield are automatically calculated from on-chain data</span>
        </div>

        {/* Balance Root Input */}
        <div>
          <label htmlFor="balanceRoot" className="form-label" style={{fontSize: '0.75rem', fontWeight: 500}}>
            Balance Root (bytes32) {isCalculating && <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>}
          </label>
          <input
            type="text"
            className="form-control"
            id="balanceRoot"
            value={balanceRoot}
            readOnly
            placeholder="Calculating..."
            style={{fontSize: '0.875rem', backgroundColor: '#f8f9fa'}}
          />
          <div className="form-text" style={{fontSize: '0.7rem'}}>
            The Merkle root of all user balances (auto-calculated from depositors)
          </div>
        </div>

        {/* Total Yield Input */}
        <div>
          <label htmlFor="totalYield" className="form-label" style={{fontSize: '0.75rem', fontWeight: 500}}>
            Total Yield (uint64) {isCalculating && <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>}
          </label>
          <input
            type="text"
            className="form-control"
            id="totalYield"
            value={totalYield}
            readOnly
            placeholder="Calculating..."
            style={{fontSize: '0.875rem', backgroundColor: '#f8f9fa'}}
          />
          <div className="form-text" style={{fontSize: '0.7rem'}}>
            The total yield generated in the current epoch in wei (auto-calculated)
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
          disabled={isPending || isConfirming || isCalculating || !balanceRoot || !totalYield}
          style={{fontSize: '0.875rem'}}
        >
          {isPending || isConfirming ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {isPending ? 'Confirming...' : 'Processing...'}
            </>
          ) : isCalculating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Calculating...
            </>
          ) : (
            'Snapshot Epoch'
          )}
        </button>
      </form>
    </SimpleCard>
  );
}
