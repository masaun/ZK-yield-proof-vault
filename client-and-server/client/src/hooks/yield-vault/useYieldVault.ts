'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { YieldVaultABI } from '@/contracts/abis/YieldVault.abi';
import { getContractAddresses } from '@/contracts/contract-addresses/addresses';
import { parseEther } from 'viem';

export function useYieldVault() {
  const chainId = useChainId();
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const vaultAddress = getContractAddresses(chainId)?.vault;

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  // Read functions
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'getUserBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!vaultAddress,
    },
  });

  const { data: totalDeposits } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'totalDeposits',
    query: {
      enabled: !!vaultAddress,
    },
  });

  const { data: currentEpochId, refetch: refetchEpochId } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'currentEpochId',
    query: {
      enabled: !!vaultAddress,
    },
  });

  const { data: yieldRate } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'yieldRate',
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Write functions
  const deposit = async (amount: string) => {
    if (!vaultAddress) throw new Error('Vault address not found for this network');
    
    return writeContract({
      address: vaultAddress,
      abi: YieldVaultABI,
      functionName: 'deposit',
      value: parseEther(amount),
    });
  };

  const claimYield = async (
    epochId: bigint,
    proof: `0x${string}`,
    publicInputs: `0x${string}`[]
  ) => {
    if (!vaultAddress) throw new Error('Vault address not found for this network');
    
    return writeContract({
      address: vaultAddress,
      abi: YieldVaultABI,
      functionName: 'claimYield',
      args: [epochId, proof, publicInputs],
    });
  };

  return {
    // Contract address
    vaultAddress,
    
    // Read data
    userBalance,
    totalDeposits,
    currentEpochId,
    yieldRate,
    
    // Write functions
    deposit,
    claimYield,
    
    // Transaction state
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    
    // Refetch functions
    refetchBalance,
    refetchEpochId,
  };
}

export function useEpochData(epochId?: bigint) {
  const chainId = useChainId();
  const vaultAddress = getContractAddresses(chainId)?.vault;

  const { data: epochData, refetch } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'getEpoch',
    args: epochId !== undefined ? [epochId] : undefined,
    query: {
      enabled: !!vaultAddress && epochId !== undefined,
    },
  });

  return {
    epochData,
    refetch,
  };
}

export function useHasClaimedEpoch(epochId?: bigint) {
  const chainId = useChainId();
  const { address } = useAccount();
  const vaultAddress = getContractAddresses(chainId)?.vault;

  const { data: hasClaimed, refetch } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'hasClaimedEpoch',
    args: address && epochId !== undefined ? [address, epochId] : undefined,
    query: {
      enabled: !!address && !!vaultAddress && epochId !== undefined,
    },
  });

  return {
    hasClaimed,
    refetch,
  };
}
