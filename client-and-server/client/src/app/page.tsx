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
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ZK Yield Proof Vault
          </h1>
          <p className="text-sm text-gray-600">
            Earn yield with privacy. Deposit assets, earn rewards, and claim anonymously using zero-knowledge proofs.
          </p>
        </div>
        {!isConnected && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            Connect your wallet to view your positions and interact with the vault
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Link 
            href="/deposit" 
            className="block group"
          >
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-gray-200 hover:border-blue-300">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">💰</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#5792FF] transition-colors">
                  Deposit Assets
                </h3>
                <p className="text-xs text-gray-600">Add funds to start earning yield</p>
              </CardContent>
            </Card>
          </Link>

          <Link 
            href="/withdraw" 
            className="block group"
          >
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-gray-200 hover:border-blue-300">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">🏦</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#5792FF] transition-colors">
                  Withdraw
                </h3>
                <p className="text-xs text-gray-600">Remove your principal assets</p>
              </CardContent>
            </Card>
          </Link>

          <Link 
            href="/claim" 
            className="block group"
          >
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-gray-200 hover:border-blue-300">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">🎁</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#5792FF] transition-colors">
                  Claim Rewards
                </h3>
                <p className="text-xs text-gray-600">Get your earned yield with ZK proof</p>
              </CardContent>
            </Card>
          </Link>

          <Link 
            href="/zk-kyc" 
            className="block group"
          >
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-gray-200 hover:border-blue-300">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">🔐</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#5792FF] transition-colors">
                  ZK-KYC
                </h3>
                <p className="text-xs text-gray-600">Verify identity with privacy</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* How It Works */}
        <SimpleCard 
          title="How It Works" 
          collapsible={true}
          initialCollapsed={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Deposit', desc: 'Add assets to vault', icon: '💰' },
              { step: '2', title: 'Earn', desc: 'Generate yield', icon: '📈' },
              { step: '3', title: 'Proof', desc: 'Create ZK proof', icon: '🔐' },
              { step: '4', title: 'Verify', desc: 'Submit proof', icon: '✅' },
              { step: '5', title: 'Claim', desc: 'Receive rewards', icon: '🎉' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl mb-2">
                  {item.icon}
                </div>
                <div className="text-xs text-gray-500 mb-1">STEP {item.step}</div>
                <div className="text-xs font-semibold text-gray-900 mb-1">{item.title}</div>
                <div className="text-xs text-gray-600">{item.desc}</div>
              </div>
            ))}
          </div>
        </SimpleCard>

        {/* Vault Stats and Epochs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VaultStats />
          <EpochList />
        </div>
      </div>
    </div>
  );
}
