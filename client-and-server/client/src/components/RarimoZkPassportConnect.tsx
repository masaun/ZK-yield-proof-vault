'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAccount, useChainId } from 'wagmi';
import { getRarimoConfig } from '@/config/rarimo';
import { mantle, mantleSepolia } from '@/config';
import type { Chain } from 'viem';
import { ProofRequestStatuses } from '@rarimo/zk-passport-react';
import type { ZkProof } from '@rarimo/zk-passport';

// Dynamically import the ZkPassportQrCode component with no SSR
const ZkPassportQrCode = dynamic(
  () => import('@rarimo/zk-passport-react'),
  { ssr: false }
);

export function RarimoZkPassportConnect() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isOpen, setIsOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle');
  const [verificationProof, setVerificationProof] = useState<ZkProof | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentChain, setCurrentChain] = useState<Chain | null>(null);

  // Determine the current network
  useEffect(() => {
    if (chainId === 5000) {
      setCurrentChain(mantle);
    } else if (chainId === 5003) {
      setCurrentChain(mantleSepolia);
    } else {
      setCurrentChain(null);
    }
  }, [chainId]);

  const network = chainId === 5000 ? 'mainnet' : 'testnet';

  // Get Rarimo configuration based on network
  let rarimoConfig;
  try {
    rarimoConfig = getRarimoConfig(network);
  } catch (error) {
    console.error('Failed to get Rarimo config:', error);
  }

  const handleOpenQrCode = () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    if (!currentChain) {
      alert('Please switch to Mantle Mainnet or Mantle Sepolia Testnet');
      return;
    }
    setIsOpen(true);
    setVerificationStatus('idle');
    setErrorMessage('');
  };

  const handleStatusChange = (status: ProofRequestStatuses) => {
    console.log('ZK Passport status changed:', status);
    
    // Map the status from the component to our internal status
    if (status === ProofRequestStatuses.RequestInitiated || status === ProofRequestStatuses.VerificationRequested) {
      setVerificationStatus('pending');
    } else if (status === ProofRequestStatuses.Error) {
      setVerificationStatus('error');
    } else if (status === ProofRequestStatuses.Verified) {
      setVerificationStatus('success');
    }
  };

  const handleSuccess = (proof: ZkProof) => {
    console.log('ZK Passport verification successful:', proof);
    setVerificationStatus('success');
    setVerificationProof(proof);
    
    // Close modal after a short delay
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  const handleError = (error: Error) => {
    console.error('ZK Passport verification error:', error);
    setVerificationStatus('error');
    setErrorMessage(error.message || 'Verification failed');
  };

  if (!rarimoConfig) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">
          ⚠️ Rarimo configuration not available for this network. Please set up the environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🛂 ZK Passport Verification
            </h2>
            <p className="text-gray-600 text-sm">
              Verify your identity privately using Rarimo ZK Passport
            </p>
          </div>
          {verificationProof && (
            <div className="bg-green-100 rounded-full px-4 py-2">
              <span className="text-green-800 font-semibold">✓ Verified</span>
            </div>
          )}
        </div>

        {/* Network Info */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Network:</span>
              <span className="ml-2 font-medium">
                {currentChain?.name || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Chain ID:</span>
              <span className="ml-2 font-medium">{chainId}</span>
            </div>
            <div>
              <span className="text-gray-500">Contract:</span>
              <span className="ml-2 font-mono text-xs">
                {rarimoConfig.zkKycAddress.slice(0, 6)}...
                {rarimoConfig.zkKycAddress.slice(-4)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium capitalize">
                {verificationStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={handleOpenQrCode}
          disabled={!address || !currentChain || verificationStatus === 'pending'}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
            !address || !currentChain
              ? 'bg-gray-400 cursor-not-allowed'
              : verificationStatus === 'pending'
              ? 'bg-blue-400 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {!address
            ? 'Connect Wallet First'
            : !currentChain
            ? 'Switch to Mantle Network'
            : verificationStatus === 'pending'
            ? 'Verifying...'
            : verificationProof
            ? 'Verify Again'
            : '🔐 Connect Rarimo ZK Passport'}
        </button>

        {/* Verification Status Messages */}
        {verificationStatus === 'error' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              ❌ {errorMessage || 'Verification failed. Please try again.'}
            </p>
          </div>
        )}

        {verificationStatus === 'success' && verificationProof && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-semibold mb-2">
              ✅ ZK Passport Verified Successfully!
            </p>
            <p className="text-green-700 text-xs">
              Your identity has been verified on {currentChain?.name}
            </p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {isOpen && address && currentChain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Scan with Rarimo App
            </h3>
            
            <div className="flex justify-center mb-4">
              <ZkPassportQrCode
                apiUrl={rarimoConfig.verificatorUrl}
                requestId={`rarimo-zkp-${address}-${Date.now()}`}
                verificationOptions={{
                  contractAddress: rarimoConfig.zkKycAddress,
                  receiverAddress: address,
                  chain: currentChain,
                }}
                qrProps={{
                  size: 300,
                }}
                onStatusChange={handleStatusChange}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>

            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">
                1. Open the Rarimo app on your phone
              </p>
              <p className="mb-2">
                2. Scan this QR code
              </p>
              <p>
                3. Complete the verification process
              </p>
            </div>

            {verificationStatus === 'pending' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-blue-800 text-sm font-medium">
                    Verifying your ZK Passport...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
