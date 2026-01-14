'use client';

import { useState } from 'react';
import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import { useAccount } from 'wagmi';
import { AmountInput } from '@/components/ui/AmountInput';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { formatEther } from 'viem';

export function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const { withdraw, isPending, isConfirming, isConfirmed, error, userBalance, refetchBalance } = useYieldVault();
  const { isConnected } = useAccount();

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const vaultBalance = userBalance ? parseFloat(formatEther(userBalance)) : 0;
    
    if (parseFloat(amount) > vaultBalance) {
      alert('Insufficient vault balance');
      return;
    }

    try {
      await withdraw(amount);
      setAmount('');
      
      // Refetch balance after confirmation
      if (isConfirmed) {
        await refetchBalance();
      }
    } catch (err) {
      console.error('Withdraw error:', err);
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

        <button 
          type="submit" 
          disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0 || maxBalance === 0}
          className="btn btn-primary-custom w-100"
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Withdraw'}
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
