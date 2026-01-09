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

# Rarimo ZK Passport Integration
# Rarimo Verificator Service (for generating ZK Passport proofs)
NEXT_PUBLIC_RARIMO_VERIFICATOR_URL=https://api.app.rarime.com

# Rarimo Relayer API URLs (for cross-chain state replication)
NEXT_PUBLIC_RELAYER_API_URL_MAINNET=http://localhost:8080
NEXT_PUBLIC_RELAYER_API_URL_TESTNET=http://localhost:8080

# Rarimo Contract Addresses on Mantle Mainnet
NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...

# Rarimo Contract Addresses on Mantle Sepolia Testnet
NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS=0x...
```

Get your WalletConnect Project ID from: https://dashboard.reown.com

For Rarimo integration setup, see the [Rarimo ZK Passport Integration](#rarimo-zk-passport-integration) section below.

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
- **Merkle Trees**: ZK-Kit (LeanIMT + Poseidon)

### Key Components

#### `/src/components/`
- `ConnectButton.tsx` - Wallet connection with Mantle network support
- `VaultStats.tsx` - Display vault statistics and user balance
- `DepositForm.tsx` - Deposit MNT into the vault
- `ClaimYieldForm.tsx` - Generate ZK proof and claim yield
- `EpochList.tsx` - Display available epochs
- `MerkleTreeHelper.tsx` - Interactive tool to generate Merkle proofs using ZK-Kit

#### `/src/hooks/`
- `useYieldVault.ts` - Contract interaction hooks for the vault
- `useZKProof.ts` - ZK proof generation and management

#### `/src/services/`
- `zkProof.ts` - Core ZK proof generation logic using Noir and bb.js

#### `/src/contracts/`

#### `/src/utils/`
- `merkleTree.ts` - ZK-Kit based Merkle tree utilities (LeanIMT + Poseidon)

## ZK-Kit Integration

This project uses **[ZK-Kit](https://github.com/zk-kit/zk-kit)** for ZK-friendly Merkle tree operations:

### Features
- **LeanIMT**: Lean Incremental Merkle Tree optimized for browser environments
- **Poseidon Hash**: SNARK-friendly hash function for efficient ZK circuits
- **Proof Generation**: Generate and verify Merkle inclusion proofs
- **Circuit Compatible**: Outputs compatible with Noir circuits

### Merkle Tree Operations

```typescript
import { buildMerkleTree, generateMerkleProof } from '@/utils/merkleTree';

// Build tree from user balances
const balances = [
  { address: '0x...', balance: 1000n },
  { address: '0x...', balance: 2000n },
];

const { tree, root } = buildMerkleTree(balances);

// Generate proof for a user
const proof = generateMerkleProof(balances, userAddress);

// Use proof in circuit
const { siblings, index, leaf, root } = proof;
```

### Interactive Merkle Tree Helper

The app includes an interactive **Merkle Tree Helper** component that allows you to:
1. Add user balances
2. Generate Merkle tree and root using ZK-Kit's LeanIMT
3. Create Merkle proofs for any user
4. Verify proofs on-chain
5. Copy proof data for the claim form

This tool is perfect for testing and understanding how Merkle proofs work!
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

## Rarimo ZK Passport Integration

This application integrates **Rarimo's ZK Passport** for privacy-preserving identity verification on Mantle. Users can verify their identity using their physical passport without revealing sensitive personal information.

### Features

- **QR Code-Based Verification**: Scan a QR code with the Rarimo mobile app to initiate verification
- **Cross-Chain State Replication**: Automatically sync ZK Passport registry state from Rarimo L2 to Mantle
- **On-Chain Verification**: Verify ZK proofs directly on Mantle mainnet or testnet
- **Verification Status Dashboard**: Real-time display of verification status and state replication

### How It Works

1. **Connect Wallet**: Connect your wallet to Mantle mainnet or testnet
2. **Initiate Verification**: Click "Connect Rarimo ZK Passport" button
3. **Scan QR Code**: Open the Rarimo app and scan the displayed QR code
4. **Generate Proof**: The app generates a zero-knowledge proof of your passport data
5. **State Replication**: The frontend automatically submits the registration root to the Mantle chain via the relayer
6. **On-Chain Verification**: The proof is verified on-chain, and your address is marked as verified

### Components

#### `RarimoZkPassportConnect`
Main component for initiating ZK Passport verification:
- Displays a "Connect Rarimo ZK Passport" button
- Shows QR code modal when clicked
- Integrates `@rarimo/zk-passport-react` package
- Handles verification lifecycle (pending, success, error states)

#### `RarimoVerificationStatus`
Dashboard for monitoring verification and state replication:
- Shows user verification status
- Displays replicator contract state (latest root, total roots)
- Manual root checking and state transition submission
- Real-time updates every 10 seconds

### Setup Instructions

#### 1. Deploy Rarimo Contracts on Mantle

You need to deploy two contracts:

**RegistrationSMTReplicator**: Replicates the ZK Passport registry state from Rarimo L2 to Mantle
```bash
# See: /contracts/RARIMO_DEPLOYMENT.md
```

**TD3QueryProofVerifier** (or your custom contract): Verifies ZK proofs on-chain
```bash
# See: /contracts/RARIMO_IMPLEMENTATION_SUMMARY.md
```

#### 2. Set Up the Relayer

The relayer service listens for ZK Passport registry updates and provides signed state data to your frontend.

```bash
cd server/rarimo-relayer

# Edit config_mantle.yaml with:
# - Your deployed RegistrationSMTReplicator address
# - Relayer private key (must be registered as oracle in the contract)
# - Mantle RPC URL

# Run the relayer
docker-compose up -d
```

See [server/rarimo-relayer/README.md](../../server/rarimo-relayer/README.md) for detailed setup.

#### 3. Configure Environment Variables

Update your `.env.local` file:

```bash
# Rarimo Verificator Service
NEXT_PUBLIC_RARIMO_VERIFICATOR_URL=https://api.app.rarime.com

# Relayer API (running locally or deployed)
NEXT_PUBLIC_RELAYER_API_URL_MAINNET=http://localhost:8080
NEXT_PUBLIC_RELAYER_API_URL_TESTNET=http://localhost:8080

# Deployed contract addresses on Mantle
NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...

NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS=0x...
```

#### 4. Install Dependencies

```bash
npm install
# This will install @rarimo/zk-passport-react and other dependencies
```

#### 5. Run the Application

```bash
npm run dev
```

Navigate to the ZK Passport section on the main page to test the integration.

### Architecture

```
┌─────────────────┐
│  Rarimo L2      │
│  (Source SMT)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Relayer        │◄──── Listens for state updates
│  (Backend)      │
└────────┬────────┘
         │
         │ Provides signed state
         ▼
┌─────────────────┐
│  Frontend       │
│  (React)        │
│  - QR Code      │◄──── User scans with Rarimo app
│  - State Submit │
└────────┬────────┘
         │
         │ Submit state transition
         ▼
┌─────────────────┐
│  Mantle Chain   │
│  - Replicator   │
│  - Verifier     │
└─────────────────┘
```

### API Reference

#### `useRarimoRelayer` Hook
```typescript
const { 
  submitStateTransition,
  isTransitioning,
  isSuccess,
  error,
  txHash 
} = useRarimoRelayer({
  replicatorAddress: '0x...',
  relayerApiUrl: 'http://localhost:8080'
});

// Submit a root transition
await submitStateTransition('0x1234...');
```

#### `getRarimoConfig` Utility
```typescript
const config = getRarimoConfig('mainnet' | 'testnet');
// Returns: { 
//   replicatorAddress, 
//   zkKycAddress, 
//   relayerApiUrl,
//   verificatorUrl,
//   sourceSMT 
// }
```

### Troubleshooting

**QR Code not displaying**:
- Ensure `@rarimo/zk-passport-react` is installed
- Check that the component is client-side rendered (uses `'use client'`)
- Verify environment variables are set

**State transition failing**:
- Ensure the relayer is running and accessible
- Check that the relayer's address is registered as an oracle in the RegistrationSMTReplicator contract
- Verify the root exists in the relayer's database

**Verification failing**:
- Ensure the registration root has been transitioned to the Mantle chain first
- Check that the proof parameters match the contract's expected format
- Verify the contract addresses are correct

### References

- [Rarimo ZK Passport Documentation](https://docs.rarimo.com/zk-passport/)
- [On-Chain Verification Guide](https://docs.rarimo.com/zk-passport/guide-on-chain-verification/)
- [Cross-Chain Replication Guide](https://docs.rarimo.com/zk-passport/guide-setting-up-cross-chain-replication/)
- [Rarimo GitHub](https://github.com/rarimo)
- [Example Implementation](../../contracts/RARIMO_IMPLEMENTATION_SUMMARY.md)

