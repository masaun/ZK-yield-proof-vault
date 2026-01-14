'use client';

import { VaultStats } from "@/components/yield-vault/VaultStats";
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

          {/* Withdraw Form - Coming Soon */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-xs text-gray-600 mb-4">
                Withdrawal functionality is currently under development. You will be able to withdraw your deposited funds here soon.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">Planned Features:</h4>
                <ul className="space-y-1 text-xs text-blue-800">
                  <li className="flex items-start">
                    <svg className="h-3 w-3 text-blue-500 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Flexible withdrawal amounts</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-3 w-3 text-blue-500 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>View available balance</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-3 w-3 text-blue-500 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Instant withdrawal processing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
