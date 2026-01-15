# ZK Yield Proof Vault

## Overview

ZK Yield Proof Vault is a privacy-preserving DeFi protocol that uses zero-knowledge proofs to verify yield generation without revealing sensitive user data. Built on Mantle Sepolia Testnet using Noir circuits and Honk proof system, this project demonstrates how ZK cryptography can enable transparent yet private yield verification in decentralized finance.

The system allows users to deposit funds into a yield vault, and periodically generates zero-knowledge proofs of yield accumulation. These proofs can be verified on-chain without exposing individual user balances or positions, ensuring both privacy and trustlessness.

<br>

## Tech Stack

- **ZK Circuit**: `Noir` (with Honk proof system via Barretenberg)
- **Smart Contract**: `Solidity`
- **Blockchain**: `Mantle` Sepolia Testnet
- **Frontend**: `Next.js` + `TypeScript`
- **Proof Generation**: `bb` (Barretenberg)

<br>

## Userflow

1. **Deposit**: Users deposit ETH into the YieldVault contract
2. **Yield Accumulation**: Vault accumulates yield over time
3. **Epoch Snapshot**: At epoch intervals, vault state is captured
4. **Proof Generation**: Off-chain prover generates ZK proof of yield using Noir circuits
5. **Proof Verification**: On-chain Honk Verifier contract validates the proof
6. **Claim Yield**: Users can claim their verified yield with privacy

<br>

## Architecture

### System Flow Diagram

```
Users
  │
  │ (deposit ETH)
  ▼
YieldVault Contract (on Mantle Sepolia Testnet)
  │
  │ (epoch snapshot)
  ▼
Off-chain Prover (ZK Prover using bb/Noir)
  │
  │ generates zk-proof (zk Yield Proof)
  ▼
YieldVault Contract (on Mantle Sepolia Testnet)
  │
  │ (verify proof)
  ▼
YieldProofVerifier Contract (on Mantle Sepolia Testnet)
  │
  │ (delegates to)
  ▼
HonkVerifier Contract (on Mantle Sepolia Testnet) <-- Inherits Honk Verifier logic
  │
  │ (verifies zk Yield Proof)
  ▼
Claim Yield (if proof is valid)
```

### Component Details

#### 1. **Frontend (Next.js Client)**
- User interface for interacting with the vault
- Wallet connection and transaction signing
- Real-time balance and yield tracking
- Proof generation monitoring

#### 2. **YieldVault Contract**
- **Location**: `contracts/src/YieldVault.sol`
- **Functions**:
  - `deposit()`: Accept user ETH deposits
  - `withdraw()`: Allow users to withdraw their funds
  - `snapshotEpoch()`: Capture vault state for proof generation
  - `verifyAndDistributeYield()`: Verify ZK proof and distribute yield
- **State Management**:
  - Tracks user balances
  - Manages epoch data (timestamps, total deposits, yield amounts)
  - Stores Merkle tree roots for privacy-preserving state commitments

#### 3. **Noir ZK Circuit**
- **Location**: `circuits/src/main.nr`
- **Purpose**: Generate zero-knowledge proofs of yield calculations
- **Inputs**:
  - Private: User balances, individual yield amounts
  - Public: Merkle roots, total yield, epoch data
- **Proof System**: Honk (via Barretenberg)
- **Constraints**: Verify yield calculations are correct without revealing individual positions

#### 4. **YieldProofVerifier Contract**
- **Location**: `contracts/src/circuits/YieldProofVerifier.sol`
- **Role**: Interface contract for proof verification
- **Functions**:
  - `verifyYieldProof()`: Validates ZK proof and public inputs
- **Delegates to**: HonkVerifier contract

#### 5. **HonkVerifier Contract**
- **Auto-generated** from Noir circuit via `bb write_solidity_verifier`
- **Location**: `contracts/target/Verifier.sol`
- **Function**: `verify()`: Core cryptographic verification using Honk proof system
- **Verification**: Checks proof against public inputs using elliptic curve pairings

#### 6. **Off-chain Prover**
- **Tools**: `bb` (Barretenberg CLI) + Noir
- **Process**:
  1. Fetch epoch data from YieldVault
  2. Construct witness (private inputs)
  3. Generate proof: `bb prove`
  4. Submit proof to YieldVault contract

### Data Flow

1. **Deposit Phase**:
   - User → YieldVault: ETH deposit transaction
   - YieldVault: Update user balance, total deposits

2. **Epoch Snapshot**:
   - Admin/Keeper → YieldVault: Trigger `snapshotEpoch()`
   - YieldVault: Record timestamp, balances, compute Merkle root

3. **Proof Generation** (Off-chain):
   - Prover: Fetch epoch data
   - Noir Circuit: Compute yield distribution
   - Barretenberg: Generate Honk proof
   - Output: Proof bytes + public inputs

4. **Verification & Distribution**:
   - Prover → YieldVault: Submit proof + public inputs
   - YieldVault → YieldProofVerifier: Forward proof
   - YieldProofVerifier → HonkVerifier: Verify cryptographic proof
   - If valid: YieldVault updates claimable yields

5. **Claim Phase**:
   - User → YieldVault: Call `claimYield()`
   - YieldVault: Transfer verified yield to user

### Security Considerations

- **Privacy**: Individual balances never revealed on-chain
- **Trustlessness**: ZK proofs ensure correctness without trust
- **Verifiability**: All yield calculations verified cryptographically
- **Immutability**: Proof verification logic is deterministic and cannot be manipulated

<br>

## Deployed Contract Addresses

| Contract Name | Address | Network | Explorer |
|--------------|---------|---------|----------|
| HonkVerifier | `0x786b31a1e67a9745f848dffb6c54a1d8accb8f1c` | Mantle Sepolia | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x786b31a1e67a9745f848dffb6c54a1d8accb8f1c) |
| YieldProofVerifier | `0x1aa877bfb71e7ec24224415a30e1e0345dc1d4c0` | Mantle Sepolia | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x1aa877bfb71e7ec24224415a30e1e0345dc1d4c0) |
| YieldVault | `0x44b3ae18a72a44b17cd762c48f5206ad4f4a17c9` | Mantle Sepolia | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x44b3ae18a72a44b17cd762c48f5206ad4f4a17c9) |

<br>

## Installation

### Prerequisites

- Node.js v18+
- Rust (for Noir)
- Foundry (for Solidity contracts)
- `bb` (Barretenberg CLI)

### ZK Circuit

1. **Install Noir and Barretenberg**:
```bash
# Install nargo
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup

# Install bb (Barretenberg)
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/cpp/installation/install | bash
```

2. **Build the circuit**:
```bash
cd circuits
sh build.sh
```

3. **Run circuit tests**:
```bash
sh circuit_test.sh
```

4. **Generate Solidity verifier**:
```bash
bb write_vk -b ./target/zk_yield_proof_vault.json
bb contract -b ./target/zk_yield_proof_vault.json -o ./target/Verifier.sol
```

### Smart Contract

1. **Install dependencies**:
```bash
cd contracts
forge install
```

2. **Compile contracts**:
```bash
forge build
```

3. **Run tests**:
```bash
forge test
```

4. **Deploy to Mantle Sepolia**:
```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export RPC_URL=https://rpc.sepolia.mantle.xyz

# Deploy
forge script scripts/deployments/DeployYieldProofSystem.s.sol:DeployYieldProofSystem \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Frontend (/client)

1. **Install dependencies**:
```bash
cd client-and-server/client
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run development server**:
```bash
npm run dev
```

4. **Build for production**:
```bash
npm run build
```

<br>

## References

- [Noir Documentation](https://noir-lang.org/)
- [Barretenberg Documentation](https://aztecprotocol.github.io/barretenberg/)
- [Mantle Network Documentation](https://docs.mantle.xyz/)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Next.js Documentation](https://nextjs.org/docs)