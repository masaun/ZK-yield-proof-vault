'use client';

import { useState, useEffect } from 'react';
import { useYieldVault, useEpochData, useHasClaimedEpoch } from '@/hooks/useYieldVault';
import { useAccount } from 'wagmi';

export function EpochList() {
  const { currentEpochId } = useYieldVault();
  const { address } = useAccount();
  const [epochs, setEpochs] = useState<bigint[]>([]);

  useEffect(() => {
    if (currentEpochId !== undefined) {
      const epochArray: bigint[] = [];
      for (let i = 0; i <= Number(currentEpochId); i++) {
        epochArray.push(BigInt(i));
      }
      setEpochs(epochArray);
    }
  }, [currentEpochId]);

  if (!address) {
    return null;
  }

  return (
    <div className="epoch-list">
      <h2>Available Epochs</h2>
      <div className="epochs-container">
        {epochs.length === 0 ? (
          <p>No epochs available yet</p>
        ) : (
          epochs.map((epochId) => (
            <EpochCard key={epochId.toString()} epochId={epochId} />
          ))
        )}
      </div>
    </div>
  );
}

function EpochCard({ epochId }: { epochId: bigint }) {
  const { epochData } = useEpochData(epochId);
  const { hasClaimed } = useHasClaimedEpoch(epochId);

  if (!epochData) {
    return null;
  }

  const [, startBlock, endBlock, , totalYield, , snapshotted] = epochData;

  return (
    <div className={`epoch-card ${snapshotted ? 'snapshotted' : 'active'}`}>
      <div className="epoch-header">
        <h3>Epoch #{epochId.toString()}</h3>
        <span className={`status-badge ${snapshotted ? 'complete' : 'active'}`}>
          {snapshotted ? 'Complete' : 'Active'}
        </span>
      </div>
      
      <div className="epoch-details">
        <div className="detail-row">
          <span className="label">Blocks:</span>
          <span className="value">{startBlock.toString()} → {endBlock.toString()}</span>
        </div>
        
        {snapshotted && (
          <>
            <div className="detail-row">
              <span className="label">Total Yield:</span>
              <span className="value">{totalYield.toString()}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Your Status:</span>
              <span className={`value ${hasClaimed ? 'claimed' : 'unclaimed'}`}>
                {hasClaimed ? '✓ Claimed' : '○ Not Claimed'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
