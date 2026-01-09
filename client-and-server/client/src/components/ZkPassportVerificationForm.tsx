import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useZkPassportVerification } from '../hooks/useZkPassportVerification';

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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">ZK Passport Verification</h2>

      {!address && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">Please connect your wallet to continue</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Root
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={registrationRoot}
            onChange={(e) => setRegistrationRoot(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isVerifying}
          />
          <p className="text-xs text-gray-500 mt-1">
            The 11th public signal from your ZK proof
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nullifier
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={nullifier}
            onChange={(e) => setNullifier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isVerifying}
          />
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier derived from your passport
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZK Proof
          </label>
          <textarea
            placeholder="0x..."
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            disabled={isVerifying}
          />
          <p className="text-xs text-gray-500 mt-1">
            Your ZK passport proof data
          </p>
        </div>

        <button
          type="submit"
          disabled={!address || isVerifying}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isVerifying ? 'Verifying...' : 'Verify ZK Passport'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-medium">Verification Successful! ✅</p>
          {txHash && (
            <p className="text-sm text-green-700 mt-2">
              Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Verification Status</p>
            <p className="text-xs text-gray-500 mt-1">
              {address ? `Address: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isUserVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isUserVerified ? 'Verified ✓' : 'Not Verified'}
            </span>
            <button
              onClick={handleCheckVerification}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Generate a ZK proof using Rarimo's verificator service</li>
          <li>Extract the registration root (11th public signal)</li>
          <li>The frontend fetches signed state from the relayer</li>
          <li>State is transitioned on-chain to RegistrationSMTReplicator</li>
          <li>Your ZK proof is verified without revealing personal data</li>
        </ol>
      </div>
    </div>
  );
}
