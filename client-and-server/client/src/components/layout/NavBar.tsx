'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';

const navItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Deposit', href: '/deposit', icon: '💰' },
  { name: 'Withdraw', href: '/withdraw', icon: '🏦' },
  { name: 'Claim', href: '/claim', icon: '🎁' },
  { name: 'ZK-KYC', href: '/zk-kyc', icon: '🛡️' },
];

export function NavBar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNetworkInfo = () => {
    switch (chainId) {
      case 5000:
        return { name: 'Mantle', short: 'MNT', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' };
      case 5003:
        return { name: 'Mantle Sepolia', short: 'MNT-T', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' };
      case 7368:
        return { name: 'Rarimo', short: 'RMO', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50' };
      default:
        return { name: 'Unknown', short: '?', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' };
    }
  };

  const network = getNetworkInfo();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-0.5 transition-transform group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                  <span className="text-lg font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ZK
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                  Yield Vault
                </span>
                <div className="text-[10px] font-medium text-gray-500 -mt-0.5">
                  Privacy First
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md ${
                      isActive
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="relative z-10">{item.name}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section - Network & Wallet */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2">
                {/* Network Badge */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md border ${network.bgColor} border-gray-200`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${network.color}`} />
                  <span className={`text-2xs font-semibold ${network.textColor}`}>
                    {network.short}
                  </span>
                </div>
                
                {/* Reown Wallet Button */}
                <appkit-button />
              </div>
            ) : (
              <appkit-button />
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            {isConnected && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${network.bgColor}`}>
                  <span className="text-xs font-medium text-gray-600">Network</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${network.color}`} />
                    <span className={`text-xs font-semibold ${network.textColor}`}>
                      {network.name}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
