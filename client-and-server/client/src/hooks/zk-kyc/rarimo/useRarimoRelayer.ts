import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbiItem } from 'viem';

const REGISTRATION_SMT_REPLICATOR_ABI = [
  parseAbiItem('function transitionRootWithSignature(bytes32 newRoot, uint256 transitionTimestamp, bytes signature) external'),
  parseAbiItem('function isRootValid(bytes32 root) external view returns (bool)'),
  parseAbiItem('function latestRoot() external view returns (bytes32)'),
] as const;

interface SignedState {
  root: string;
  timestamp: number;
  signature: string;
}

interface UseRarimoRelayerProps {
  replicatorAddress: `0x${string}`;
  relayerApiUrl: string;
}

export function useRarimoRelayer({ replicatorAddress, relayerApiUrl }: UseRarimoRelayerProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  /**
   * Fetch signed state from the relayer API
   */
  const fetchSignedState = async (root: string): Promise<SignedState> => {
    const url = new URL(`${relayerApiUrl}/integrations/proof-verification-relayer/v2/state`);
    url.searchParams.set('filter[root]', root);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch signed state: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.attributes) {
      throw new Error('Invalid response format from relayer');
    }

    return {
      root: data.data.attributes.root,
      timestamp: data.data.attributes.timestamp,
      signature: data.data.attributes.signature,
    };
  };

  /**
   * Submit a state transition to the RegistrationSMTReplicator contract
   */
  const submitStateTransition = async (root: string) => {
    setIsTransitioning(true);
    setError(null);

    try {
      // Fetch signed state from relayer
      const signedState = await fetchSignedState(root);

      // Submit transaction
      writeContract({
        address: replicatorAddress,
        abi: REGISTRATION_SMT_REPLICATOR_ABI,
        functionName: 'transitionRootWithSignature',
        args: [
          signedState.root as `0x${string}`,
          BigInt(signedState.timestamp),
          signedState.signature as `0x${string}`,
        ],
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit state transition';
      setError(errorMessage);
      console.error('Error submitting state transition:', err);
    } finally {
      setIsTransitioning(false);
    }
  };

  return {
    submitStateTransition,
    isTransitioning: isTransitioning || isConfirming,
    isSuccess,
    error,
    txHash,
  };
}
