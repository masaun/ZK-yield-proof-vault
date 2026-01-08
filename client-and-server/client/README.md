# ZK Yield Proof Vault - Frontend

A Next.js frontend for the ZK Yield Proof Vault, enabling privacy-preserving yield distribution on Mantle using Zero-Knowledge proofs powered by Noir.

## Features

### 🔐 Privacy-Preserving Yield Claims
- Generate ZK proofs off-chain using Noir.js
- Verify proofs on-chain without revealing user balances
- Prevent double-claiming using nullifiers

### 🌐 Mantle Network Support
- **Mantle Mainnet** (Chain ID: 5000)
- **Mantle Sepolia Testnet** (Chain ID: 5003)
- Easy network switching via WalletConnect/Reown

### 📊 User Flow
1. **Deposit**: Users deposit MNT into the Yield Vault
2. **Epoch Snapshot**: Contract takes periodic snapshots of user balances
3. **ZK Proof Generation**: Users generate proofs off-chain using Noir
4. **Verification**: On-chain verifier validates the proof
5. **Yield Claim**: Users receive their yield privately

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables

Edit `.env` and add your contract addresses:

```bash
# WalletConnect/Reown Project ID
NEXT_PUBLIC_PROJECT_ID=your_project_id

# Mantle Mainnet Contracts
NEXT_PUBLIC_VAULT_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_VERIFIER_ADDRESS_MAINNET=0x...

# Mantle Sepolia Testnet Contracts
NEXT_PUBLIC_VAULT_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_VERIFIER_ADDRESS_TESTNET=0x...
```

Get your WalletConnect Project ID from: https://dashboard.reown.com

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Wallet Connection**: Reown AppKit (WalletConnect)
- **Blockchain Interaction**: Wagmi + Viem
- **ZK Proofs**: Noir.js + bb.js (Barretenberg)

### Key Components

#### `/src/components/`
- `ConnectButton.tsx` - Wallet connection with Mantle network support
- `VaultStats.tsx` - Display vault statistics and user balance
- `DepositForm.tsx` - Deposit MNT into the vault
- `ClaimYieldForm.tsx` - Generate ZK proof and claim yield

#### `/src/hooks/`
- `useYieldVault.ts` - Contract interaction hooks for the vault
- `useZKProof.ts` - ZK proof generation and management

#### `/src/services/`
- `zkProof.ts` - Core ZK proof generation logic using Noir and bb.js

#### `/src/contracts/`
- `YieldVault.abi.ts` - Contract ABI
- `addresses.ts` - Contract addresses for different networks

## Contract Interaction

### Deposit MNT

```typescript
const { deposit } = useYieldVault();
await deposit("1.0"); // Deposit 1 MNT
```

### Claim Yield

```typescript
const { claimYield } = useYieldVault();
const { generateProof, getFormattedProof } = useZKProof();

// Generate proof
await generateProof(proofInputs);

// Get formatted proof
const { proof, publicInputs } = getFormattedProof();

// Claim with proof
await claimYield(epochId, proof, publicInputs);
```

## Resources

- [Noir Documentation](https://noir-lang.org/docs/)
- [Noir.js Tutorial](https://noir-lang.org/docs/tutorials/noirjs_app)
- [Mantle Network](https://www.mantle.xyz/)
- [Reown (WalletConnect)](https://reown.com/)
- [Wagmi Documentation](https://wagmi.sh/)
