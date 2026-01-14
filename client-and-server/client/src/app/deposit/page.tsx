'use client';

import { DepositForm } from "@/components/yield-vault/DepositForm";
import { VaultStats } from "@/components/yield-vault/VaultStats";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function DepositPage() {
  const { isConnected } = useAccount();

  return (
    <div className="py-3 px-2">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="h4 fw-bold text-dark mb-2">Deposit</h1>
        <p className="text-muted" style={{fontSize: '0.75rem'}}>
          Deposit MNT to the Yield Vault to start earning yield
        </p>
      </div>

      {!isConnected ? (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" role="alert" style={{fontSize: '0.75rem'}}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <div>Wallet not connected. Please connect your wallet to deposit funds.</div>
        </div>
      ) : (
        <div className="row g-3">
          {/* Main Content - Deposit Form */}
          <div className="col-12 col-lg-8">\n            <DepositForm />

            {/* How It Works */}
            <SimpleCard 
              title="How Deposits Work" 
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
                    Deposits are recorded in your balance and included in the next epoch snapshot
                    </span>
                  </span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    Your deposits are included in the Merkle tree for privacy-preserving yield claims
                  </span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    You can withdraw your funds at any time (subject to availability)
                  </span>
                </li>
              </ul>

              {/* Quick Links */}
              <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-2">
                <Link
                  href="/claim"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                  style={{fontSize: '0.75rem'}}
                >
                  Claim Yield
                  <svg className="ms-2" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/withdraw"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                  style={{fontSize: '0.75rem'}}
                >
                  Withdraw Funds
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
