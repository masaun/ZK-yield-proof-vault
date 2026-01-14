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
      <div className="d-flex flex-column gap-2">
        {stats.map((stat, index) => (
          <div key={index} className="d-flex align-items-center justify-content-between py-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <span style={{fontSize: '1.125rem'}}>{stat.icon}</span>
              <span className="text-muted" style={{fontSize: '0.75rem', fontWeight: 500}}>{stat.label}</span>
            </div>
            <span className="fw-semibold text-dark" style={{fontSize: '0.75rem'}}>{stat.value}</span>
          </div>
        ))}

        {isConnected && address && (
          <div className="d-flex align-items-center justify-content-between py-2 px-3 bg-primary bg-opacity-10 rounded mt-2">
            <div className="d-flex align-items-center gap-2">
              <span style={{fontSize: '1.125rem'}}>👤</span>
              <span className="text-primary" style={{fontSize: '0.75rem', fontWeight: 500}}>Your Balance</span>
            </div>
            <span className="fw-bold text-primary" style={{fontSize: '0.75rem'}}>
              {userBalance !== undefined 
                ? `${parseFloat(formatEther(userBalance)).toFixed(4)} MNT` 
                : 'Loading...'}
            </span>
          </div>
        )}

        <div className="pt-2 mt-2 border-top">
          <div className="d-flex align-items-center gap-2 text-muted" style={{fontSize: '0.75rem'}}>
            <span>Vault Contract:</span>
            <code className="px-2 py-1 bg-light rounded text-dark" style={{fontSize: '0.625rem', fontFamily: 'monospace'}}>
              {vaultAddress ? `${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}` : 'N/A'}
            </code>
          </div>
        </div>
      </div>
    </SimpleCard>
  );
}
