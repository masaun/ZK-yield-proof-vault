'use client';

import { DepositForm } from "@/components/yield-vault/DepositForm";
import { VaultStats } from "@/components/yield-vault/VaultStats";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function DepositPage() {
  const { isConnected } = useAccount();

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Deposit</h1>
          <p className="text-gray-600 text-xs">
            Deposit MNT to the Yield Vault to start earning yield
          </p>
        </div>

        {!isConnected ? (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            Wallet not connected. Please connect your wallet to deposit funds.
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Content - Deposit Form */}
            <div className="w-full lg:w-2/3">
              <DepositForm />

              {/* How It Works */}
              <SimpleCard 
                title="How Deposits Work" 
                collapsible={true}
                initialCollapsed={false}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">
                      Deposits are recorded in your balance and included in the next epoch snapshot
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">
                      Your deposits are included in the Merkle tree for privacy-preserving yield claims
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">
                      You can withdraw your funds at any time (subject to availability)
                    </span>
                  </li>
                </ul>

                {/* Quick Links */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  <Link
                    href="/claim"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-500 transition-all"
                  >
                    Claim Yield
                    <svg className="ml-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/withdraw"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-500 transition-all"
                  >
                    Withdraw Funds
                    <svg className="ml-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </SimpleCard>
            </div>

            {/* Sidebar - Vault Stats */}
            <div className="w-full lg:w-1/3">
              <VaultStats />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
