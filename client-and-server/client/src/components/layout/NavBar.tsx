'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Deposit', href: '/deposit' },
  { name: 'Withdraw', href: '/withdraw' },
  { name: 'Claim', href: '/claim' },
  { name: 'ZK-KYC', href: '/zk-kyc' },
];

const getNetworkColor = (color: string) => {
  const colorMap: Record<string, string> = {
    'bg-emerald-500': 'bg-success',
    'bg-amber-500': 'bg-warning',
    'bg-purple-500': 'bg-primary',
    'bg-gray-500': 'bg-secondary'
  };
  return colorMap[color] || 'bg-secondary';
};

export function NavBar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNetworkInfo = () => {
    switch (chainId) {
      case 5000:
        return { name: 'Mantle', short: 'MNT', color: 'bg-emerald-500' };
      case 5003:
        return { name: 'Mantle Sepolia', short: 'MNT-T', color: 'bg-amber-500' };
      case 7368:
        return { name: 'Rarimo', short: 'RMO', color: 'bg-purple-500' };
      default:
        return { name: 'Unknown', short: '?', color: 'bg-gray-500' };
    }
  };

  const network = getNetworkInfo();

  return (
    <header className="sticky-top navbar-custom">
      <nav className="px-3 py-2">
        <div className="d-flex align-items-center justify-content-between">
          {/* Logo Section */}
          <div className="d-flex align-items-center gap-2">
            <Link href="/" className="text-decoration-none">
              <span className="fw-semibold text-white" style={{fontSize: '0.875rem', opacity: 0.9}}>
                ZK Yield Vault
              </span>
            </Link>

            {/* Desktop Navigation */}
            <span className="text-white d-none d-lg-inline mx-1" style={{opacity: 0.4}}>›</span>
            <div className="d-none d-lg-flex align-items-center gap-1">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <div key={item.href} className="d-flex align-items-center">
                    {index > 0 && <span className="text-white mx-1" style={{opacity: 0.4}}>›</span>}
                    <Link
                      href={item.href}
                      className={`nav-link-custom ${isActive ? 'active' : ''}`}
                    >
                      {item.name}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Section - Network & Wallet */}
          <div className="d-flex align-items-center gap-2">
            {isConnected ? (
              <div className="d-flex align-items-center gap-2">
                {/* Network Badge */}
                <div className="d-none d-sm-flex align-items-center gap-2 network-badge">
                  <div className={`network-dot ${getNetworkColor(network.color)}`} />
                  <span className="text-2xs fw-medium text-white">
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
              className="d-lg-none btn btn-sm text-white border-0 p-2"
              style={{backgroundColor: 'rgba(255, 255, 255, 0.1)'}}
              aria-label="Toggle menu"
            >
              <svg
                width="20"
                height="20"
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
          <div className="d-lg-none bg-white rounded-bottom mt-2 p-2 shadow">
            <div className="d-flex flex-column gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-decoration-none px-2 py-2 rounded text-2xs fw-medium ${
                      isActive
                        ? 'bg-primary bg-opacity-10 text-primary'
                        : 'text-dark'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
