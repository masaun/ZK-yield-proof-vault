'use client';

import { VaultStats } from "@/components/yield-vault/VaultStats";
import { WithdrawForm } from "@/components/yield-vault/WithdrawForm";
import { useAccount } from 'wagmi';

export default function WithdrawPage() {
  const { isConnected } = useAccount();

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdraw</h1>
          <p className="text-sm text-gray-600">
            Withdraw your deposited funds from the Yield Vault
          </p>
        </div>

        {!isConnected ? (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            Please connect your wallet to withdraw funds
          </div>
      ) : (
        <>
          {/* Vault Stats */}
          <div className="mb-6">
            <VaultStats />
          </div>

          {/* Withdraw Form */}
          <WithdrawForm />
        </>
      )}
      </div>
    </div>
  );
}
