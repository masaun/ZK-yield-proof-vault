/**
 * On-Chain ZK Passport Verification Example Page
 * 
 * This page demonstrates the complete on-chain verification flow
 * following the Rarimo documentation pattern
 */
import { OnChainZkPassportVerification } from "@/components/zk-kyc/rarimo/OnChainZkPassportVerification";
import { ConnectButton } from "@/components/connect-wallet/ConnectButton";
import Image from 'next/image';

export default function OnChainVerificationPage() {
  return (
    <div className="pages">
      <div className="header">
        <Image src="/reown.svg" alt="Reown" width={100} height={100} priority />
        <h1>ZK Passport On-Chain Verification</h1>
        <p className="subtitle">
          Verify your identity on-chain using ZK Passport without revealing personal data
        </p>
      </div>

      <ConnectButton />

      <div style={{ marginTop: '40px', marginBottom: '40px' }}>
        <OnChainZkPassportVerification />
      </div>

      <div className="info-section" style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '12px',
        marginTop: '40px' 
      }}>
        <h2 style={{ marginBottom: '20px' }}>How It Works</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          <div className="info-card">
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📱</div>
            <h3>1. Scan QR Code</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Use the RariMe mobile app to scan the QR code and initiate verification
            </p>
          </div>

          <div className="info-card">
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔐</div>
            <h3>2. Generate Proof</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Your device generates a zero-knowledge proof from your passport data
            </p>
          </div>

          <div className="info-card">
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⛓️</div>
            <h3>3. On-Chain Verification</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>
              The proof is verified on-chain without revealing your personal information
            </p>
          </div>

          <div className="info-card">
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
            <h3>4. Get Verified</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Your address is marked as verified, enabling access to protected features
            </p>
          </div>
        </div>
      </div>

      <div className="advice" style={{ marginTop: '40px' }}>
        <h3>Requirements</h3>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Connect your wallet to Mantle Mainnet or Mantle Sepolia Testnet</li>
          <li>Download the RariMe mobile app (iOS/Android)</li>
          <li>Have a valid passport ready for scanning</li>
          <li>Ensure you have enough MNT for gas fees</li>
        </ul>

        <h3 style={{ marginTop: '20px' }}>Privacy Features</h3>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Your passport data never leaves your device</li>
          <li>Zero-knowledge proofs ensure privacy</li>
          <li>Only a verification status is stored on-chain</li>
          <li>No personal information is revealed</li>
        </ul>

        <h3 style={{ marginTop: '20px' }}>Learn More</h3>
        <p style={{ marginTop: '10px' }}>
          <a 
            href="https://docs.rarimo.com/zk-passport/guide-on-chain-verification/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#4f46e5', textDecoration: 'underline' }}
          >
            📚 On-Chain Verification Documentation
          </a>
        </p>
        <p style={{ marginTop: '5px' }}>
          <a 
            href="https://rarime.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#4f46e5', textDecoration: 'underline' }}
          >
            🌐 RariMe Mobile App
          </a>
        </p>
      </div>
    </div>
  );
}
