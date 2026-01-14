'use client';

import { ClaimYieldForm } from "@/components/yield-vault/ClaimYieldForm";
import { EpochList } from "@/components/yield-vault/EpochList";
import { MerkleTreeHelper } from "@/components/zk-circuits/MerkleTreeHelper";
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function ClaimPage() {
  const { isConnected } = useAccount();

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Yield</h1>
          <p className="text-sm text-gray-600">
            Claim your yield privately using zero-knowledge proofs
          </p>
        </div>

        {!isConnected ? (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            Please connect your wallet to claim yield
          </div>
      ) : (
        <>
          {/* Epoch List */}
          <div className="mb-6">
            <EpochList />
          </div>

          {/* Claim Form */}
          <div className="mb-6">
            <ClaimYieldForm />
          </div>

          {/* Merkle Tree Helper */}
          <div className="mb-6">
            <MerkleTreeHelper />
          </div>

          {/* Info Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1.5">
              <span>🔐</span> Privacy-Preserving Claims
            </h3>
            <div className="space-y-2 text-xs text-purple-800">
              <p>
                Our zero-knowledge proof system ensures that you can claim your yield without revealing:
              </p>
              <ul className="space-y-1.5 ml-4">
                <li className="flex items-start">
                  <svg className="h-3 w-3 text-purple-500 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Your deposit balance to other users</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-3 w-3 text-purple-500 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Your yield amount</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-3 w-3 text-purple-500 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Your position in the Merkle tree</span>
                </li>
              </ul>
              <p className="mt-2 pt-2 border-t border-purple-200">
                <strong>How it works:</strong> The ZK proof verifies you have a valid claim in the epoch&apos;s Merkle tree 
                without revealing which leaf is yours. The contract verifies the proof and prevents double-claiming using nullifiers.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/deposit"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Make a Deposit
              <svg className="ml-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View Dashboard
              <svg className="ml-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
