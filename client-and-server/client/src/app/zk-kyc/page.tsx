'use client';

import { OnChainZkPassportVerification } from "@/components/zk-kyc/rarimo/OnChainZkPassportVerification";
import { RarimoVerificationStatus } from "@/components/zk-kyc/rarimo/RarimoVerificationStatus";
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function ZkKycPage() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ZK-KYC Verification</h1>
        <p className="text-gray-600">
          Verify your identity using Rarimo ZK Passport without revealing personal data
        </p>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Wallet not connected
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Please connect your wallet to verify your identity
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Verification Status */}
          <div className="mb-8">
            <RarimoVerificationStatus />
          </div>

          {/* On-Chain Verification */}
          <div className="mb-8">
            <OnChainZkPassportVerification />
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3">🛡️ About ZK Passport</h3>
            <div className="space-y-3 text-sm text-indigo-800">
              <p>
                ZK Passport by Rarimo enables privacy-preserving identity verification using zero-knowledge proofs. 
                This allows you to prove you are a unique human without revealing any personal information.
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-indigo-200 mt-4">
                <h4 className="font-semibold text-indigo-900 mb-2">Key Features:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Privacy-First:</strong> Your personal information never leaves your device</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Sybil-Resistant:</strong> Prevents multiple accounts from the same identity</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>On-Chain Verification:</strong> Verification status is stored on blockchain</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Mobile App:</strong> Use the Rarimo mobile app to scan your passport</span>
                  </li>
                </ul>
              </div>

              <div className="bg-indigo-100 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-indigo-900 mb-2">📱 How to Verify:</h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-2 text-xs font-bold">1</span>
                    <span>Download the Rarimo app from your mobile app store</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-2 text-xs font-bold">2</span>
                    <span>Scan your biometric passport using NFC</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-2 text-xs font-bold">3</span>
                    <span>Click &quot;Verify&quot; above and scan the QR code with the app</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-2 text-xs font-bold">4</span>
                    <span>Confirm the verification on-chain from your mobile device</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://docs.rarimo.com/zk-passport/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View Documentation
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
