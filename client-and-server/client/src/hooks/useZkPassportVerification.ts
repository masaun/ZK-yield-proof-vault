import { useState } from 'react';
import { useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { parseAbiItem } from 'viem';
import { useRarimoRelayer } from './useRarimoRelayer';

const ZK_KYC_RARIMO_ABI = [
  parseAbiItem('function verifyZkPassport(bytes32 registrationRoot, bytes32 nullifier, bytes proof) external'),
  parseAbiItem('function isVerified(address user) external view returns (bool)'),
  parseAbiItem('function verifiedNullifiers(bytes32 nullifier) external view returns (bool)'),
] as const;

interface UseZkPassportVerificationProps {
  zkKycAddress: `0x${string}`;
  replicatorAddress: `0x${string}`;
  relayerApiUrl: string;
}

interface VerificationParams {
  registrationRoot: string;
  nullifier: string;
  proof: string;
}

export function useZkPassportVerification({
  zkKycAddress,
  replicatorAddress,
  relayerApiUrl,
}: UseZkPassportVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relayer = useRarimoRelayer({ replicatorAddress, relayerApiUrl });

  const { write: verifyPassport, data: txData } = useContractWrite({
    address: zkKycAddress,
    abi: ZK_KYC_RARIMO_ABI,
    functionName: 'verifyZkPassport',
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: txData?.hash,
  });

  /**
   * Check if a user is verified
   */
  const { data: isUserVerified, refetch: checkVerification } = useContractRead({
    address: zkKycAddress,
    abi: ZK_KYC_RARIMO_ABI,
    functionName: 'isVerified',
  });

  /**
   * Verify ZK Passport
   * This function:
   * 1. Ensures the registration root is transitioned on-chain
   * 2. Submits the verification transaction
   */
  const verify = async ({ registrationRoot, nullifier, proof }: VerificationParams) => {
    setIsVerifying(true);
    setError(null);

    try {
      // Step 1: Ensure the root is transitioned on-chain
      console.log('Submitting state transition for root:', registrationRoot);
      await relayer.submitStateTransition(registrationRoot);

      // Wait a bit for the transaction to be mined
      // In production, you'd want to wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: Submit the verification transaction
      console.log('Submitting verification transaction...');
      verifyPassport({
        args: [
          registrationRoot as `0x${string}`,
          nullifier as `0x${string}`,
          proof as `0x${string}`,
        ],
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify ZK Passport';
      setError(errorMessage);
      console.error('Error verifying ZK Passport:', err);
      setIsVerifying(false);
    }
  };

  return {
    verify,
    isVerifying: isVerifying || isConfirming,
    isSuccess,
    isUserVerified,
    error,
    txHash: txData?.hash,
    checkVerification,
  };
}
