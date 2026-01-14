'use client';

import { useState } from 'react';
import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import { useAccount } from 'wagmi';

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const { deposit, isPending, isConfirming, isConfirmed, error, refetchBalance } = useYieldVault();
  const { isConnected } = useAccount();

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await deposit(amount);
      setAmount('');
      
      // Refetch balance after confirmation
      if (isConfirmed) {
        await refetchBalance();
      }
    } catch (err) {
      console.error('Deposit error:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="deposit-form">
        <p>Please connect your wallet to deposit</p>
      </div>
    );
  }

  return (
    <div className="deposit-form">
      <h2>Deposit to Yield Vault</h2>
      <form onSubmit={handleDeposit}>
        <div className="form-group">
          <label htmlFor="amount">Amount (MNT)</label>
          <input
            id="amount"
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            disabled={isPending || isConfirming}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isPending || isConfirming || !amount}
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Deposit'}
        </button>

        {isConfirmed && (
          <div className="success-message">
            ✓ Deposit successful!
          </div>
        )}

        {error && (
          <div className="error-message">
            Error: {error.message}
          </div>
        )}
      </form>
    </div>
  );
}
