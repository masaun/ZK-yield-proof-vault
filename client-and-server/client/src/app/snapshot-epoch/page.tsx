'use client';

import { SnapshotEpochForm } from "@/components/yield-vault/SnapshotEpochForm";
import { VaultStats } from "@/components/yield-vault/VaultStats";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { useAccount } from 'wagmi';
import { useYieldVault } from '@/hooks/yield-vault/useYieldVault';
import Link from 'next/link';

export default function SnapshotEpochPage() {
  const { isConnected } = useAccount();
  const { currentEpochId } = useYieldVault();

  return (
    <div className="py-3 px-2">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="h4 fw-bold text-dark mb-2">Snapshot Epoch</h1>
        <p className="text-muted" style={{fontSize: '0.75rem'}}>
          End the current epoch and create a snapshot of all user balances (Owner only)
        </p>
      </div>

      {!isConnected ? (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" role="alert" style={{fontSize: '0.75rem'}}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <div>Wallet not connected. Please connect your wallet to snapshot epochs.</div>
        </div>
      ) : (
        <div className="row g-3">
          {/* Main Content - Snapshot Form */}
          <div className="col-12 col-lg-8">
            {/* Current Epoch Info */}
            <SimpleCard title="Current Epoch Information" className="mb-3">
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>Current Epoch ID:</span>
                  <span className="fw-semibold" style={{fontSize: '0.875rem'}}>
                    {currentEpochId !== undefined ? currentEpochId.toString() : '...'}
                  </span>
                </div>
                <div className="alert alert-info mb-0 d-flex align-items-start gap-2" role="alert" style={{fontSize: '0.7rem'}}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" className="flex-shrink-0 mt-1">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    After snapshotting, this epoch will be finalized and a new epoch (ID: {currentEpochId !== undefined ? (Number(currentEpochId) + 1).toString() : '...'}) will begin.
                  </span>
                </div>
              </div>
            </SimpleCard>

            {/* Snapshot Form */}
            <SnapshotEpochForm />

            {/* How It Works */}
            <SimpleCard 
              title="How Epoch Snapshots Work" 
              collapsible={true}
              initialCollapsed={false}
            >
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                <li className="d-flex align-items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    <strong>Owner Only:</strong> Only the contract owner can snapshot epochs
                  </span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    <strong>Balance Root:</strong> The Merkle root of all user balances at the snapshot time. This is used for ZK proof verification during yield claims.
                  </span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    <strong>Total Yield:</strong> The total yield amount generated during the epoch (in wei). This is distributed proportionally to depositors.
                  </span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    <strong>Finalization:</strong> Once an epoch is snapshotted, it cannot be modified and users can claim their yield for that epoch.
                  </span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    <strong>New Epoch:</strong> A new epoch automatically starts after the snapshot
                  </span>
                </li>
              </ul>

              {/* Quick Links */}
              <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-2">
                <Link
                  href="/deposit"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                  style={{fontSize: '0.75rem'}}
                >
                  Manage Deposits
                  <svg className="ms-2" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/claim"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                  style={{fontSize: '0.75rem'}}
                >
                  View Yield Claims
                  <svg className="ms-2" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </SimpleCard>
          </div>

          {/* Sidebar - Vault Stats */}
          <div className="col-12 col-lg-4">
            <VaultStats />
          </div>
        </div>
      )}
    </div>
  );
}
