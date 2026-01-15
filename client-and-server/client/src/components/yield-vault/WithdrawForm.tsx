'use client';

import { useState } from 'react';
import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import { useAccount } from 'wagmi';
import { AmountInput } from '@/components/ui/AmountInput';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { formatEther } from 'viem';

export function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState<string>('');
  const { withdraw, isPending, isConfirming, isConfirmed, error, userBalance, refetchBalance } = useYieldVault();
  const { isConnected } = useAccount();

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setWithdrawError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    const vaultBalance = userBalance ? parseFloat(formatEther(userBalance)) : 0;
    
    if (parseFloat(amount) > vaultBalance) {
      setWithdrawError('Insufficient vault balance');
      return;
    }

    try {
      console.log('Starting withdrawal of', amount, 'MNT');
      await withdraw(amount);
      setAmount('');
      
      // Refetch balance after confirmation
      if (isConfirmed) {
        await refetchBalance();
      }
    } catch (err: any) {
      console.error('Withdraw error:', err);
      
      // Extract user-friendly error message
      let errorMessage = 'Withdrawal failed. Please try again.';
      
      if (err?.message) {
        if (err.message.includes('user rejected') || err.message.includes('User rejected') || err.message.includes('user cancel')) {
          errorMessage = 'Transaction was rejected. Please approve the transaction in your wallet to proceed.';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to complete the transaction (including gas fees).';
        } else if (err.message.includes('gas')) {
          errorMessage = 'Gas estimation failed. The transaction might revert. Please check your balance and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setWithdrawError(errorMessage);
    }
  };

  if (!isConnected) {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
        <span>⚠️</span>
        <span>Please connect your wallet to withdraw</span>
      </div>
    );
  }

  const maxBalance = userBalance ? parseFloat(formatEther(userBalance)) : 0;
  
  const isAmountValid = amount && parseFloat(amount) > 0;
  const isAmountTooHigh = amount && parseFloat(amount) > maxBalance;

  return (
    <SimpleCard title="Withdraw from Yield Vault">
      <form onSubmit={handleWithdraw} className="d-flex flex-column gap-3">
        {/* Display vault balance */}
        <div className="p-3 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted" style={{fontSize: '0.75rem'}}>Your Vault Balance:</span>
            <span className="fw-bold" style={{fontSize: '0.875rem'}}>
              {maxBalance.toFixed(6)} MNT
            </span>
          </div>
        </div>

        <AmountInput
          value={amount}
          onChange={setAmount}
          label="Withdraw Amount"
          suffix="MNT"
          max={maxBalance.toString()}
          placeholder="0.0"
          disabled={isPending || isConfirming || maxBalance === 0}
          error={error?.message}
          showMaxButton={true}
        />

        {isAmountTooHigh && (
          <div className="alert alert-warning d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
            <span>⚠️</span>
            <span>Amount exceeds your available vault balance</span>
          </div>
        )}

        {withdrawError && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{withdrawError}</span>
          </div>
        )}

        {isAmountValid && !isAmountTooHigh && (
          <div className="alert alert-info d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem', padding: '0.5rem'}}>
            <span>ℹ️</span>
            <span>Your wallet may show "ETH" but you're withdrawing MNT (Mantle's native token)</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending || isConfirming || !isAmountValid || isAmountTooHigh || maxBalance === 0}
          className="btn btn-primary-custom w-100"
          title={!isAmountValid ? 'Please enter an amount greater than 0' : isAmountTooHigh ? 'Insufficient vault balance' : ''}
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : !isAmountValid ? 'Enter Amount to Withdraw' : 'Withdraw'}
        </button>

        {isConfirmed && (
          <div className="alert alert-success" role="alert" style={{fontSize: '0.75rem'}}>
            <p className="mb-0 fw-medium">✓ Withdrawal successful!</p>
          </div>
        )}

        {maxBalance === 0 && (
          <div className="alert alert-info" role="alert" style={{fontSize: '0.75rem'}}>
            <p className="mb-0">You don&apos;t have any funds in the vault to withdraw.</p>
          </div>
        )}
      </form>
    </SimpleCard>
  );
}
