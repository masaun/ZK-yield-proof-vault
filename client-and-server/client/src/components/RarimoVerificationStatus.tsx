'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useChainId, useContractRead } from 'wagmi';
import { parseAbiItem } from 'viem';
import { getRarimoConfig } from '@/config/rarimo';
import { useRarimoRelayer } from '@/hooks/useRarimoRelayer';

const ZK_KYC_RARIMO_ABI = [
  parseAbiItem('function isVerified(address user) external view returns (bool)'),
  parseAbiItem('function verifiedNullifiers(bytes32 nullifier) external view returns (bool)'),
  parseAbiItem('function verificationTimestamp(address user) external view returns (uint256)'),
] as const;

const REGISTRATION_SMT_REPLICATOR_ABI = [
  parseAbiItem('function isRootValid(bytes32 root) external view returns (bool)'),
  parseAbiItem('function latestRoot() external view returns (bytes32)'),
  parseAbiItem('function getRoot(uint256 index) external view returns (bytes32)'),
  parseAbiItem('function getRootsLength() external view returns (uint256)'),
] as const;

export function RarimoVerificationStatus() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [rootToCheck, setRootToCheck] = useState<string>('');
  const [isCheckingRoot, setIsCheckingRoot] = useState(false);
  const [rootCheckResult, setRootCheckResult] = useState<{
    isValid: boolean;
    checked: boolean;
  }>({ isValid: false, checked: false });

  const network = chainId === 5000 ? 'mainnet' : 'testnet';

  // Get Rarimo configuration
  let rarimoConfig: ReturnType<typeof getRarimoConfig> | undefined;
  try {
    rarimoConfig = getRarimoConfig(network);
  } catch (error) {
    console.error('Failed to get Rarimo config:', error);
  }

  // Check if user is verified
  const { data: isVerified, refetch: refetchVerification } = useContractRead({
    address: rarimoConfig?.zkKycAddress,
    abi: ZK_KYC_RARIMO_ABI,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
  });

  // Get latest root from replicator
  const { data: latestRoot, refetch: refetchLatestRoot } = useContractRead({
    address: rarimoConfig?.replicatorAddress,
    abi: REGISTRATION_SMT_REPLICATOR_ABI,
    functionName: 'latestRoot',
  });

  // Get total roots count
  const { data: rootsLength } = useContractRead({
    address: rarimoConfig?.replicatorAddress,
    abi: REGISTRATION_SMT_REPLICATOR_ABI,
    functionName: 'getRootsLength',
  });

  // Initialize relayer hook
  const relayer = rarimoConfig
    ? useRarimoRelayer({
        replicatorAddress: rarimoConfig.replicatorAddress,
        relayerApiUrl: rarimoConfig.relayerApiUrl,
      })
    : null;

  // Auto-refresh verification status
  useEffect(() => {
    const interval = setInterval(() => {
      refetchVerification();
      refetchLatestRoot();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [refetchVerification, refetchLatestRoot]);

  const handleCheckRoot = async () => {
    if (!rootToCheck || !rarimoConfig) return;

    setIsCheckingRoot(true);
    try {
      // Check if root is valid on the replicator contract
      const { data } = await useContractRead({
        address: rarimoConfig.replicatorAddress,
        abi: REGISTRATION_SMT_REPLICATOR_ABI,
        functionName: 'isRootValid',
        args: [rootToCheck as `0x${string}`],
      });

      setRootCheckResult({
        isValid: !!data,
        checked: true,
      });
    } catch (error) {
      console.error('Error checking root:', error);
      setRootCheckResult({
        isValid: false,
        checked: true,
      });
    } finally {
      setIsCheckingRoot(false);
    }
  };

  const handleSubmitStateTransition = async () => {
    if (!rootToCheck || !relayer) return;

    try {
      await relayer.submitStateTransition(rootToCheck);
      
      // Refresh after submission
      setTimeout(() => {
        refetchLatestRoot();
        handleCheckRoot();
      }, 3000);
    } catch (error) {
      console.error('Error submitting state transition:', error);
    }
  };

  if (!rarimoConfig) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📊 Verification Status Dashboard
        </h2>

        {/* User Verification Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Your Verification Status
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            {!address ? (
              <p className="text-gray-600 text-sm">
                Connect your wallet to see verification status
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Address:</span>
                  <span className="font-mono text-sm">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    Verification Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isVerified ? '✓ Verified' : '○ Not Verified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Network:</span>
                  <span className="text-gray-600 text-sm">
                    {network === 'mainnet' ? 'Mantle Mainnet' : 'Mantle Sepolia Testnet'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replicator Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            State Replication Status
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">
                  Replicator Contract:
                </span>
                <a
                  href={`${
                    chainId === 5000
                      ? 'https://explorer.mantle.xyz'
                      : 'https://sepolia.mantlescan.xyz'
                  }/address/${rarimoConfig.replicatorAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-600 hover:text-blue-800"
                >
                  {rarimoConfig.replicatorAddress.slice(0, 6)}...
                  {rarimoConfig.replicatorAddress.slice(-4)} ↗
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Latest Root:</span>
                <span className="font-mono text-xs text-gray-600">
                  {latestRoot
                    ? `${latestRoot.slice(0, 10)}...${latestRoot.slice(-8)}`
                    : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">
                  Total Roots Replicated:
                </span>
                <span className="text-gray-600 font-semibold">
                  {rootsLength?.toString() || '0'}
                </span>
              </div>
              {relayer && (
                <>
                  {relayer.isTransitioning && (
                    <div className="flex items-center text-blue-600 text-sm">
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
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
                      Submitting state transition...
                    </div>
                  )}
                  {relayer.isSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="text-green-800 text-sm">
                        ✓ State transition successful!
                      </p>
                      {relayer.txHash && (
                        <a
                          href={`${
                            chainId === 5000
                              ? 'https://explorer.mantle.xyz'
                              : 'https://sepolia.mantlescan.xyz'
                          }/tx/${relayer.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 text-xs hover:underline"
                        >
                          View transaction ↗
                        </a>
                      )}
                    </div>
                  )}
                  {relayer.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-red-800 text-sm">❌ {relayer.error}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Manual Root Check & State Transition */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Manual State Management
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              Check if a specific registration root has been replicated to this chain,
              or submit a new state transition.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Root (bytes32)
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={rootToCheck}
                  onChange={(e) => {
                    setRootToCheck(e.target.value);
                    setRootCheckResult({ isValid: false, checked: false });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCheckRoot}
                  disabled={!rootToCheck || isCheckingRoot}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isCheckingRoot ? 'Checking...' : 'Check Root'}
                </button>
                
                <button
                  onClick={handleSubmitStateTransition}
                  disabled={
                    !rootToCheck ||
                    !relayer ||
                    relayer.isTransitioning ||
                    (rootCheckResult.checked && rootCheckResult.isValid)
                  }
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {relayer?.isTransitioning
                    ? 'Submitting...'
                    : 'Submit State Transition'}
                </button>
              </div>

              {rootCheckResult.checked && (
                <div
                  className={`p-3 rounded-lg ${
                    rootCheckResult.isValid
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      rootCheckResult.isValid ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {rootCheckResult.isValid
                      ? '✓ Root is valid and replicated on this chain'
                      : '✗ Root not found on this chain - submit state transition first'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
