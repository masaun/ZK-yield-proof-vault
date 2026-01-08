import { ConnectButton } from "@/components/ConnectButton";
import { VaultStats } from "@/components/VaultStats";
import { DepositForm } from "@/components/DepositForm";
import { ClaimYieldForm } from "@/components/ClaimYieldForm";
import { EpochList } from "@/components/EpochList";
import Image from 'next/image';

export default function Home() {
  return (
    <div className={"pages"}>
      <div className="header">
        <Image src="/reown.svg" alt="Reown" width={100} height={100} priority />
        <h1>ZK Yield Proof Vault</h1>
        <p className="subtitle">Privacy-Preserving Yield Distribution on Mantle</p>
      </div>

      <ConnectButton />

      <div className="user-flow-diagram">
        <h3>User Flow</h3>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <strong>Deposit</strong>
              <p>Users deposit MNT to Yield Vault</p>
            </div>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <strong>Epoch Snapshot</strong>
              <p>Contract takes snapshot of balances</p>
            </div>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <strong>ZK Proof Generation</strong>
              <p>Off-chain prover generates proof using Noir</p>
            </div>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <strong>Verification</strong>
              <p>Contract verifies ZK proof on Mantle</p>
            </div>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <strong>Claim Yield</strong>
              <p>User receives yield privately</p>
            </div>
          </div>
        </div>
      </div>

      <VaultStats />
      
      <EpochList />
      
      <div className="forms-container">
        <DepositForm />
        <ClaimYieldForm />
      </div>

      <div className="advice">
        <p>
          <strong>Note:</strong> Make sure you&apos;re connected to Mantle Mainnet or Mantle Sepolia Testnet.
        </p>
        <p>
          This project uses Zero-Knowledge proofs powered by Noir to enable privacy-preserving yield distribution.
        </p>
      </div>
    </div>
  );
}