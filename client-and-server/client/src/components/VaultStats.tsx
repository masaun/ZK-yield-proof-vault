'use client';

import { useYieldVault } from '@/hooks/useYieldVault';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';

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

  return (
    <div className="vault-stats">
      <h2>Vault Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Network:</span>
          <span className="stat-value">{chainName}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Vault Address:</span>
          <span className="stat-value address">
            {vaultAddress ? `${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}` : 'N/A'}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Current Epoch:</span>
          <span className="stat-value">
            {currentEpochId !== undefined ? currentEpochId.toString() : 'Loading...'}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Total Deposits:</span>
          <span className="stat-value">
            {totalDeposits !== undefined 
              ? `${parseFloat(formatEther(totalDeposits)).toFixed(4)} MNT` 
              : 'Loading...'}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Yield Rate:</span>
          <span className="stat-value">
            {yieldRate !== undefined ? yieldRate.toString() : 'Loading...'}
          </span>
        </div>

        {isConnected && address && (
          <div className="stat-item highlight">
            <span className="stat-label">Your Balance:</span>
            <span className="stat-value">
              {userBalance !== undefined 
                ? `${parseFloat(formatEther(userBalance)).toFixed(4)} MNT` 
                : 'Loading...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
