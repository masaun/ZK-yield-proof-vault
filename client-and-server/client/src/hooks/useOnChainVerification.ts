/**
 * Hook for on-chain ZK Passport verification
 * Based on the Rarimo on-chain verification pattern
 */
'use client'

import { ZkProof } from '@rarimo/zk-passport'
import { useState } from 'react'
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useAccount 
} from 'wagmi'
import { Address, encodeAbiParameters, parseAbiParameters, toHex } from 'viem'
import { ZK_KYC_WITH_RARIMO_ABI } from '@/contracts/ZkKycWithRarimoAbi'

interface UseOnChainVerificationProps {
  contractAddress: Address
  enabled?: boolean
}

/**
 * Build arguments for the verifyZkPassport function call
 * This converts the ZK proof into the format expected by the contract
 */
function buildVerificationArguments(proof: ZkProof, address: string) {
  // Extract proof parameters
  const { pubSignals, proof: zkProof } = proof

  // The registration root should be in the public signals
  // This is the Merkle root of the registration SMT
  const registrationRoot = pubSignals[11] || '0x0'

  // The nullifier is a unique identifier to prevent double verification
  // It should also be in the public signals
  const nullifier = pubSignals[0] || '0x0'

  // Encode the proof data
  // The actual proof structure depends on the verifier being used
  // For Circom proofs, the structure is piA, piB, piC
  const proofData = encodeAbiParameters(
    parseAbiParameters('uint256[2] a, uint256[2][2] b, uint256[2] c'),
    [
      [BigInt(zkProof.piA[0]), BigInt(zkProof.piA[1])],
      [
        [BigInt(zkProof.piB[0][1]), BigInt(zkProof.piB[0][0])],
        [BigInt(zkProof.piB[1][1]), BigInt(zkProof.piB[1][0])],
      ],
      [BigInt(zkProof.piC[0]), BigInt(zkProof.piC[1])],
    ]
  )

  return {
    registrationRoot: toHex(BigInt(registrationRoot), { size: 32 }),
    nullifier: toHex(BigInt(nullifier), { size: 32 }),
    proof: proofData,
  }
}

export function useOnChainVerification({ 
  contractAddress,
  enabled = true 
}: UseOnChainVerificationProps) {
  const { address } = useAccount()
  const [isEstimating, setIsEstimating] = useState(false)

  // Check if the current user is already verified
  const { 
    data: isVerified, 
    refetch: refetchVerification 
  } = useReadContract({
    abi: ZK_KYC_WITH_RARIMO_ABI,
    address: contractAddress,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
    },
  })

  // Check if an address is verified
  const { 
    data: isAddressVerified,
    refetch: refetchAddressVerification
  } = useReadContract({
    abi: ZK_KYC_WITH_RARIMO_ABI,
    address: contractAddress,
    functionName: 'checkVerification',
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
    },
  })

  // Write contract for verification
  const { 
    writeContractAsync: verify, 
    data: txHash, 
    isPending: isVerifyPending 
  } = useWriteContract()

  // Wait for transaction receipt
  const {
    isLoading: isVerifying,
    isSuccess: isVerifySuccess,
    isError: isVerifyError,
    error: verifyError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  })

  /**
   * Estimate the verification transaction
   * Returns true if the transaction can be executed
   */
  const estimateVerification = async (proof: ZkProof): Promise<boolean> => {
    try {
      if (!address) {
        console.error('No wallet address found')
        return false
      }

      setIsEstimating(true)
      
      // Build the verification arguments
      const args = buildVerificationArguments(proof, address)

      // Try to estimate gas
      // This will throw if the transaction would fail
      // For now, we'll just return true if we get here
      // In production, you'd want to actually call estimateGas
      
      return true
    } catch (error) {
      console.error('Error estimating verification:', error)
      return false
    } finally {
      setIsEstimating(false)
    }
  }

  /**
   * Execute the on-chain verification
   */
  const executeVerification = async (proof: ZkProof) => {
    if (!address) {
      throw new Error('No wallet address')
    }

    const args = buildVerificationArguments(proof, address)

    await verify({
      abi: ZK_KYC_WITH_RARIMO_ABI,
      address: contractAddress,
      functionName: 'verifyZkPassport',
      args: [args.registrationRoot, args.nullifier, args.proof],
    })
  }

  return {
    // Verification status
    isVerified: isVerified ?? false,
    isAddressVerified: isAddressVerified ?? false,
    
    // Transaction states
    isEstimating,
    isVerifyPending,
    isVerifying,
    isVerifySuccess,
    isVerifyError,
    verifyError,
    txHash,
    
    // Actions
    estimateVerification,
    executeVerification,
    refetchVerification,
    refetchAddressVerification,
  }
}
