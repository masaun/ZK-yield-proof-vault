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
      <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
        Please connect your wallet to deposit
      </div>
    );
  }

  const maxBalance = balance ? parseFloat(balance.formatted) : 0;

  return (
    <SimpleCard title="Deposit to Yield Vault">
      <form onSubmit={handleDeposit} className="space-y-4">
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
          className="w-full bg-[#5792FF] text-sm text-white font-bold py-2 rounded-lg hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:active:scale-100 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Deposit'}
        </button>

        {isConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 font-medium text-xs">✓ Deposit successful!</p>
          </div>
        )}
      </form>
    </SimpleCard>
  );
}
