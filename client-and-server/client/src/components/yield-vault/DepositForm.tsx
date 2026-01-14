'use client';

import { useState } from 'react';
import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import { useAccount, useBalance } from 'wagmi';
import { AmountInput } from '@/components/ui/AmountInput';
import { SimpleCard } from '@/components/ui/SimpleCard';

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const [depositError, setDepositError] = useState<string>('');
  const { deposit, isPending, isConfirming, isConfirmed, error, refetchBalance } = useYieldVault();
  const { isConnected, address } = useAccount();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setDepositError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setDepositError('Please enter a valid amount');
      return;
    }

    try {
      console.log('Starting deposit of', amount, 'MNT');
      await deposit(amount);
      setAmount('');
      
      // Refetch balance after confirmation
      if (isConfirmed) {
        await refetchBalance();
      }
    } catch (err: any) {
      console.error('Deposit error:', err);
      
      // Extract user-friendly error message
      let errorMessage = 'Deposit failed. Please try again.';
      
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
      
      setDepositError(errorMessage);
    }
  };

  if (!isConnected) {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
        <span>⚠️</span>
        <span>Please connect your wallet to deposit</span>
      </div>
    );
  }

  const maxBalance = balance ? parseFloat(balance.formatted) : 0;

  const isAmountValid = amount && parseFloat(amount) > 0;
  const isAmountTooHigh = amount && parseFloat(amount) > maxBalance;

  return (
    <SimpleCard title="Deposit to Yield Vault">
      <form onSubmit={handleDeposit} className="d-flex flex-column gap-3">
        <AmountInput
          value={amount}
          onChange={setAmount}
          label="Deposit Amount"
          suffix="MNT"
          max={maxBalance.toString()}
          placeholder="0.0"
          disabled={isPending || isConfirming}
          error={error?.message}
          showMaxButton={true}
        />

        {isAmountTooHigh && (
          <div className="alert alert-warning d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
            <span>⚠️</span>
            <span>Amount exceeds your available balance</span>
          </div>
        )}

        {depositError && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{depositError}</span>
          </div>
        )}

        {isAmountValid && !isAmountTooHigh && (
          <div className="alert alert-info d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem', padding: '0.5rem'}}>
            <span>ℹ️</span>
            <span>Your wallet may show "ETH" but you're depositing MNT (Mantle's native token)</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending || isConfirming || !isAmountValid || isAmountTooHigh}
          className="btn btn-primary-custom w-100"
          title={!isAmountValid ? 'Please enter an amount greater than 0' : isAmountTooHigh ? 'Insufficient balance' : ''}
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : !isAmountValid ? 'Enter Amount to Deposit' : 'Deposit'}
        </button>

        {isConfirmed && (
          <div className="alert alert-success" role="alert" style={{fontSize: '0.75rem'}}>
            <p className="mb-0 fw-medium">✓ Deposit successful!</p>
          </div>
        )}
      </form>
    </SimpleCard>
  );
}
