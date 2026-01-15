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
    if (!address) throw new Error('Wallet not connected');
    
    try {
      const value = parseEther(amount);
      console.log('Preparing deposit:', {
        vaultAddress,
        amount,
        value: value.toString(),
        from: address,
      });
      
      // Let the wallet handle gas estimation automatically
      // Manual gas estimation on Mantle can sometimes cause issues
      return writeContract({
        address: vaultAddress,
        abi: YieldVaultABI,
        functionName: 'deposit',
        value: value,
      });
    } catch (err) {
      console.error('Deposit error:', err);
      throw err;
    }
  };

  const withdraw = async (amount: string) => {
    if (!vaultAddress) throw new Error('Vault address not found for this network');
    if (!address) throw new Error('Wallet not connected');
    
    try {
      const amountInWei = parseEther(amount);
      console.log('Preparing withdrawal:', {
        vaultAddress,
        amount,
        amountInWei: amountInWei.toString(),
        from: address,
      });
      
      // Let the wallet handle gas estimation automatically
      // Manual gas estimation on Mantle can sometimes cause issues
      return writeContract({
        address: vaultAddress,
        abi: YieldVaultABI,
        functionName: 'withdraw',
        args: [amountInWei],
      });
    } catch (err) {
      console.error('Withdraw error:', err);
      throw err;
    }
  };

  const claimYield = async(
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
      gas: 500000n, // Higher gas limit for ZK proof verification
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
    withdraw,
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

export function useUserDepositInfo() {
  const chainId = useChainId();
  const { address } = useAccount();
  const vaultAddress = getContractAddresses(chainId)?.vault;

  // Get user balance
  const { data: balance } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'getUserBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!vaultAddress,
    },
  });

  // Get current epoch to simulate depositEpoch
  const { data: currentEpochId } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'currentEpochId',
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Since getUserDepositInfo doesn't exist in the contract anymore,
  // we return the data in a compatible format
  // Format: [balance, depositEpoch, epochsPassed, lastDepositBlock]
  const depositInfo = (balance !== undefined && currentEpochId !== undefined) 
    ? [balance, 0n, currentEpochId, 0n] as const 
    : undefined;

  return {
    depositInfo,
    refetch: () => {},
  };
}

export function useEpochsPassedSinceDeposit() {
  const chainId = useChainId();
  const vaultAddress = getContractAddresses(chainId)?.vault;

  // Get current epoch ID as a proxy for epochs passed
  const { data: currentEpochId } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'currentEpochId',
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Since getEpochsPassedSinceDeposit doesn't exist anymore,
  // we return current epoch ID as epochs passed
  const epochsPassed = currentEpochId;

  return {
    epochsPassed,
    refetch: () => {},
  };
}

export function useAllDepositorsWithBalances() {
  const chainId = useChainId();
  const vaultAddress = getContractAddresses(chainId)?.vault;

  const { data: depositorsData, refetch } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'getAllDepositorsWithBalances',
    query: {
      enabled: !!vaultAddress,
    },
  });

  return {
    depositorsData,
    refetch,
  };
}
