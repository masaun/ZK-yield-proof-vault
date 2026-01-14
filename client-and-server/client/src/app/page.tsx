'use client';

import Link from "next/link";
import { VaultStats } from "@/components/yield-vault/VaultStats";
import { EpochList } from "@/components/yield-vault/EpochList";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { useAccount } from 'wagmi';

export default function Dashboard() {
  const { isConnected } = useAccount();

  return (
    <>
      {/* Page Header */}
      <div className="mb-3 px-2">
        <h1 className="h5 fw-semibold text-dark mb-1">
          ZK Yield Proof Vault
        </h1>
        <p className="text-2xs text-muted">
          Earn yield with privacy. Deposit assets, earn rewards, and claim anonymously using zero-knowledge proofs.
        </p>
      </div>
      {!isConnected && (
        <div className="alert alert-info-custom d-flex align-items-center gap-2 mx-2 mb-3" role="alert">
          <svg className="flex-shrink-0" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <div>Connect your wallet to view your positions and interact with the vault</div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="row g-2 mb-3 px-2">
          <div className="col-12 col-sm-6 col-lg-3">
            <Link href="/deposit" className="text-decoration-none custom-card-link">
              <div className="custom-card h-100 p-3">
                <div className="fs-4 mb-2">💰</div>
                <h3 className="text-2xs fw-semibold text-dark mb-1">
                  Deposit Assets
                </h3>
                <p className="text-2xs text-muted mb-0">Add funds to start earning yield</p>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <Link href="/withdraw" className="text-decoration-none custom-card-link">
              <div className="custom-card h-100 p-3">
                <div className="fs-4 mb-2">🏦</div>
                <h3 className="text-2xs fw-semibold text-dark mb-1">
                  Withdraw
                </h3>
                <p className="text-2xs text-muted mb-0">Remove your principal assets</p>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <Link href="/claim" className="text-decoration-none custom-card-link">
              <div className="custom-card h-100 p-3">
                <div className="fs-4 mb-2">🎁</div>
                <h3 className="text-2xs fw-semibold text-dark mb-1">
                  Claim Rewards
                </h3>
                <p className="text-2xs text-muted mb-0">Get your earned yield with ZK proof</p>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <Link href="/zk-kyc" className="text-decoration-none custom-card-link">
              <div className="custom-card h-100 p-3">
                <div className="fs-4 mb-2">🔐</div>
                <h3 className="text-2xs fw-semibold text-dark mb-1">
                  ZK-KYC
                </h3>
                <p className="text-2xs text-muted mb-0">Verify identity with privacy</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-2 space-y-3">

        {/* How It Works */}
        <SimpleCard 
          title="How It Works" 
          collapsible={true}
          initialCollapsed={false}
        >
          <div className="row g-3">
            {[
              { step: '1', title: 'Deposit', desc: 'Add assets to vault', icon: '💰' },
              { step: '2', title: 'Earn', desc: 'Generate yield', icon: '📈' },
              { step: '3', title: 'Proof', desc: 'Create ZK proof', icon: '🔐' },
              { step: '4', title: 'Verify', desc: 'Submit proof', icon: '✅' },
              { step: '5', title: 'Claim', desc: 'Receive rewards', icon: '🎉' },
            ].map((item) => (
              <div key={item.step} className="col-12 col-sm-6 col-lg text-center">
                <div className="d-flex flex-column align-items-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mb-2" style={{width: '2.5rem', height: '2.5rem'}}>
                    <span className="fs-6">{item.icon}</span>
                  </div>
                  <div className="text-2xs text-muted mb-1">STEP {item.step}</div>
                  <div className="text-2xs fw-semibold text-dark mb-1">{item.title}</div>
                  <div className="text-2xs text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </SimpleCard>

        {/* Vault Stats and Epochs */}
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <VaultStats />
          </div>
          <div className="col-12 col-lg-6">
            <EpochList />
          </div>
        </div>
      </div>
    </>
  );
}
