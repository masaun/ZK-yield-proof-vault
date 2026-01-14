import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useZkPassportVerification } from '@/hooks/zk-kyc/rarimo/useZkPassportVerification';

interface ZkPassportVerificationFormProps {
  zkKycAddress: `0x${string}`;
  replicatorAddress: `0x${string}`;
  relayerApiUrl: string;
}

export function ZkPassportVerificationForm({
  zkKycAddress,
  replicatorAddress,
  relayerApiUrl,
}: ZkPassportVerificationFormProps) {
  const { address } = useAccount();
  const [registrationRoot, setRegistrationRoot] = useState('');
  const [nullifier, setNullifier] = useState('');
  const [proof, setProof] = useState('');

  const {
    verify,
    isVerifying,
    isSuccess,
    isUserVerified,
    error,
    txHash,
    checkVerification,
  } = useZkPassportVerification({
    zkKycAddress,
    replicatorAddress,
    relayerApiUrl,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registrationRoot || !nullifier || !proof) {
      alert('Please fill in all fields');
      return;
    }

    await verify({ registrationRoot, nullifier, proof });
  };

  const handleCheckVerification = () => {
    checkVerification();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">ZK Passport Verification</h2>

      {!address && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          Please connect your wallet to continue
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Registration Root
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={registrationRoot}
            onChange={(e) => setRegistrationRoot(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={isVerifying}
          />
          <p className="text-2xs text-gray-500 mt-0.5">
            The 11th public signal from your ZK proof
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nullifier
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={nullifier}
            onChange={(e) => setNullifier(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={isVerifying}
          />
          <p className="text-2xs text-gray-500 mt-0.5">
            Unique identifier derived from your passport
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            ZK Proof
          </label>
          <textarea
            placeholder="0x..."
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            rows={4}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 font-mono resize-none"
            disabled={isVerifying}
          />
          <p className="text-2xs text-gray-500 mt-0.5">
            Your ZK passport proof data
          </p>
        </div>

        <button
          type="submit"
          disabled={!address || isVerifying}
          className="w-full py-2 px-3 bg-[#5792FF] hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-md disabled:bg-gray-300 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {isVerifying ? 'Verifying...' : 'Verify ZK Passport'}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-green-800 font-semibold text-xs">Verification Successful! ✅</p>
            {txHash && (
              <p className="text-2xs text-green-700 mt-1">
                Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700">Verification Status</p>
            <p className="text-2xs text-gray-500 mt-0.5">
              {address ? `Address: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
              isUserVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isUserVerified ? 'Verified ✓' : 'Not Verified'}
            </span>
            <button
              onClick={handleCheckVerification}
              className="text-xs text-[#5792FF] hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-xs font-semibold text-blue-900 mb-2">How it works:</h3>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Generate a ZK proof using Rarimo&apos;s verificator service</li>
          <li>Extract the registration root (11th public signal)</li>
          <li>The frontend fetches signed state from the relayer</li>
          <li>State is transitioned on-chain to RegistrationSMTReplicator</li>
          <li>Your ZK proof is verified without revealing personal data</li>
        </ol>
      </div>
    </div>
  );
}
