'use client';

import { useState } from 'react';
import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import { useAccount, useBalance } from 'wagmi';
import { AmountInput } from '@/components/ui/AmountInput';
import { SimpleCard } from '@/components/ui/SimpleCard';

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const { deposit, isPending, isConfirming, isConfirmed, error, refetchBalance } = useYieldVault();
  const { isConnected, address } = useAccount();
  
  const { data: balance } = useBalance({
    address: address,
  });

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
      <div className="alert alert-warning d-flex align-items-center gap-2" role="alert" style={{fontSize: '0.75rem'}}>
        <span>⚠️</span>
        <span>Please connect your wallet to deposit</span>
      </div>
    );
  }

  const maxBalance = balance ? parseFloat(balance.formatted) : 0;

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

        <button 
          type="submit" 
          disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
          className="btn btn-primary-custom w-100"
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Deposit'}
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
