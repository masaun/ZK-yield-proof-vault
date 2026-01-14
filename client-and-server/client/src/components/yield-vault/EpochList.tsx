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
      <div className="space-y-2">
        {epochs.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-3">No epochs available yet</p>
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
    <div className={`rounded-lg border p-3 transition-all ${
      snapshotted 
        ? 'bg-green-50 border-green-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-900">Epoch #{epochId.toString()}</h3>
        <span className={`px-2 py-0.5 text-2xs font-semibold rounded ${
          snapshotted 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {snapshotted ? 'Complete' : 'Active'}
        </span>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Blocks:</span>
          <span className="font-mono text-gray-900 text-2xs">
            {startBlock.toString()} → {endBlock.toString()}
          </span>
        </div>
        
        {snapshotted && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total Yield:</span>
              <span className="font-semibold text-gray-900 text-2xs">{totalYield.toString()}</span>
            </div>
            
            <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200">
              <span className="text-gray-600">Your Status:</span>
              <span className={`font-semibold text-2xs ${
                hasClaimed ? 'text-green-600' : 'text-orange-600'
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
