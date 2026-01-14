'use client';

import { useState, useEffect } from 'react';
import { useYieldVault, useEpochData, useHasClaimedEpoch } from '@/hooks/yield-vault/useYieldVault';
import { useAccount } from 'wagmi';
import { SimpleCard } from '@/components/ui/SimpleCard';

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
    <SimpleCard title="Available Epochs" collapsible={true}>
      <div className="d-flex flex-column gap-2">
        {epochs.length === 0 ? (
          <p className="text-muted text-center py-3" style={{fontSize: '0.75rem'}}>No epochs available yet</p>
        ) : (
          epochs.map((epochId) => (
            <EpochCard key={epochId.toString()} epochId={epochId} />
          ))
        )}
      </div>
    </SimpleCard>
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
    <div className={`rounded border p-3 ${
      snapshotted 
        ? 'bg-success bg-opacity-10 border-success border-opacity-25' 
        : 'bg-primary bg-opacity-10 border-primary border-opacity-25'
    }`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="fw-bold text-dark mb-0" style={{fontSize: '0.75rem'}}>Epoch #{epochId.toString()}</h3>
        <span className={`badge ${
          snapshotted 
            ? 'bg-success' 
            : 'bg-primary'
        }`} style={{fontSize: '0.625rem'}}>
          {snapshotted ? 'Complete' : 'Active'}
        </span>
      </div>
      
      <div className="d-flex flex-column gap-2">
        <div className="d-flex justify-content-between" style={{fontSize: '0.75rem'}}>
          <span className="text-muted">Blocks:</span>
          <span className="text-dark text-2xs" style={{fontFamily: 'monospace'}}>
            {startBlock.toString()} → {endBlock.toString()}
          </span>
        </div>
        
        {snapshotted && (
          <>
            <div className="d-flex justify-content-between" style={{fontSize: '0.75rem'}}>
              <span className="text-muted">Total Yield:</span>
              <span className="fw-semibold text-dark text-2xs">{totalYield.toString()}</span>
            </div>
            
            <div className="d-flex justify-content-between pt-2 border-top" style={{fontSize: '0.75rem'}}>
              <span className="text-muted">Your Status:</span>
              <span className={`fw-semibold text-2xs ${
                hasClaimed ? 'text-success' : 'text-warning'
              }`}>
                {hasClaimed ? '✓ Claimed' : '○ Not Claimed'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
