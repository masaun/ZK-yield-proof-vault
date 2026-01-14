'use client';

import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { SimpleCard } from '@/components/ui/SimpleCard';

export function VaultStats() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { 
    userBalance, 
    totalDeposits, 
    currentEpochId, 
    yieldRate,
    vaultAddress 
  } = useYieldVault();

  const getChainName = (id: number) => {
    switch (id) {
      case 5000: return 'Mantle Mainnet';
      case 5003: return 'Mantle Sepolia Testnet';
      case 7368: return 'Rarimo';
      default: return 'Unknown Network';
    }
  };
  const chainName = getChainName(chainId);

  const stats = [
    {
      label: 'Network',
      value: chainName,
      icon: '🌐',
    },
    {
      label: 'Current Epoch',
      value: currentEpochId !== undefined ? currentEpochId.toString() : 'Loading...',
      icon: '📅',
    },
    {
      label: 'Total Deposits',
      value: totalDeposits !== undefined 
        ? `${parseFloat(formatEther(totalDeposits)).toFixed(4)} MNT` 
        : 'Loading...',
      icon: '💎',
    },
    {
      label: 'Yield Rate',
      value: yieldRate !== undefined ? `${yieldRate.toString()}%` : 'Loading...',
      icon: '📈',
    },
  ];

  return (
    <SimpleCard title="Vault Statistics">
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs font-medium text-gray-600">{stat.label}</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{stat.value}</span>
          </div>
        ))}

        {isConnected && address && (
          <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg mt-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <span className="text-xs font-medium text-blue-900">Your Balance</span>
            </div>
            <span className="text-xs font-bold text-blue-900">
              {userBalance !== undefined 
                ? `${parseFloat(formatEther(userBalance)).toFixed(4)} MNT` 
                : 'Loading...'}
            </span>
          </div>
        )}

        <div className="pt-3 mt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Vault Contract:</span>
            <code className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-2xs">
              {vaultAddress ? `${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}` : 'N/A'}
            </code>
          </div>
        </div>
      </div>
    </SimpleCard>
  );
}
