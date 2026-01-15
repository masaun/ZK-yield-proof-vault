'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, useBlockNumber, usePublicClient } from 'wagmi';
import { YieldVaultABI } from '@/contracts/abis/yield-vault/YieldVault.abi';
import { getContractAddresses } from '@/contracts/contract-addresses/addresses';
import { parseEther } from 'viem';

export function useYieldVault() {
  const chainId = useChainId();
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();
  
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

  const { data: owner } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'owner',
    query: {
      enabled: !!vaultAddress,
    },
  });

  const { data: currentBalanceRoot } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'currentBalanceRoot',
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Check if the current user is the owner
  const isOwner = address && owner ? (address.toLowerCase() === owner.toLowerCase()) : undefined;

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
    if (!address) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      // Estimate gas for the transaction
      const estimatedGas = await publicClient.estimateContractGas({
        address: vaultAddress,
        abi: YieldVaultABI,
        functionName: 'claimYield',
        args: [epochId, proof, publicInputs],
        account: address,
      });

      // Add 30% buffer to estimated gas for safety (ZK proofs can be variable)
      const gasWithBuffer = (estimatedGas * 130n) / 100n;
      
      console.log('Gas estimation for claimYield:', {
        estimated: estimatedGas.toString(),
        withBuffer: gasWithBuffer.toString(),
      });

      return writeContract({
        address: vaultAddress,
        abi: YieldVaultABI,
        functionName: 'claimYield',
        args: [epochId, proof, publicInputs],
        gas: gasWithBuffer,
      });
    } catch (estimateError) {
      console.error('Gas estimation failed, using fallback:', estimateError);
      // Fallback to a higher fixed gas limit if estimation fails
      return writeContract({
        address: vaultAddress,
        abi: YieldVaultABI,
        functionName: 'claimYield',
        args: [epochId, proof, publicInputs],
        gas: 2000000n, // Increased fallback gas limit for ZK proof verification
      });
    }
  };

  const snapshotEpoch = async (balanceRoot: `0x${string}`, totalYield: string) => {
    if (!vaultAddress) throw new Error('Vault address not found for this network');
    if (!address) throw new Error('Wallet not connected');
    
    try {
      const totalYieldBigInt = BigInt(totalYield);
      console.log('Preparing epoch snapshot:', {
        vaultAddress,
        balanceRoot,
        totalYield,
        totalYieldBigInt: totalYieldBigInt.toString(),
        from: address,
      });
      
      return writeContract({
        address: vaultAddress,
        abi: YieldVaultABI,
        functionName: 'snapshotEpoch',
        args: [balanceRoot, totalYieldBigInt],
      });
    } catch (err) {
      console.error('Snapshot epoch error:', err);
      throw err;
    }
  };

  return {
    // Contract address
    vaultAddress,
    
    // Read data
    userBalance,
    totalDeposits,
    currentEpochId,
    yieldRate,
    owner,
    isOwner,
    currentBalanceRoot,
    
    // Write functions
    deposit,
    withdraw,
    claimYield,
    snapshotEpoch,
    
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

export function useSnapshotData() {
  const chainId = useChainId();
  const vaultAddress = getContractAddresses(chainId)?.vault;

  // Get current block number from the blockchain
  const { data: currentBlockNumber } = useBlockNumber({
    watch: true,
  });

  // Get current balance root
  const { data: currentBalanceRoot, refetch: refetchBalanceRoot } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'currentBalanceRoot',
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Get yield rate
  const { data: yieldRate } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'yieldRate',
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Get current epoch data
  const { data: currentEpochId } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'currentEpochId',
    query: {
      enabled: !!vaultAddress,
    },
  });

  const { data: epochData } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'getEpoch',
    args: currentEpochId !== undefined ? [currentEpochId] : undefined,
    query: {
      enabled: !!vaultAddress && currentEpochId !== undefined,
    },
  });

  // Get total deposits
  const { data: totalDeposits } = useReadContract({
    address: vaultAddress,
    abi: YieldVaultABI,
    functionName: 'totalDeposits',
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Calculate total yield
  // Formula: totalDeposits * yieldRate * (currentBlock - epochStartBlock) / 1e18
  const calculateTotalYield = () => {
    if (!totalDeposits || !yieldRate || !epochData || !currentBlockNumber) {
      return 0n;
    }

    // epochData format: [epochId, startBlock, endBlock, totalDeposits, totalYield, balanceRoot, snapshotted]
    const startBlock = epochData[1] as bigint;
    const currentBlock = BigInt(currentBlockNumber);
    
    // Calculate blocks passed
    const blocksPassed = currentBlock > startBlock ? currentBlock - startBlock : 0n;
    
    // Calculate yield: totalDeposits * yieldRate * blocksPassed / 1e18
    const totalYield = (totalDeposits * yieldRate * blocksPassed) / BigInt(1e18);
    
    // Ensure the value fits in uint64 (max: 18,446,744,073,709,551,615)
    const MAX_UINT64 = 18446744073709551615n;
    if (totalYield > MAX_UINT64) {
      console.warn('Total yield exceeds uint64 max, capping at max value');
      return MAX_UINT64;
    }
    
    return totalYield;
  };

  const totalYield = calculateTotalYield();

  return {
    currentBalanceRoot: currentBalanceRoot as `0x${string}` | undefined,
    totalYield,
    yieldRate,
    epochData,
    currentBlockNumber,
    refetchBalanceRoot,
  };
}
