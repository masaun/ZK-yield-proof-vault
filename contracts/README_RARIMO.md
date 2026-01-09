# Rarimo ZK Passport Integration on Mantle

This repository contains a complete implementation of Rarimo's ZK Passport verification system on Mantle Mainnet and Testnet, enabling privacy-preserving identity verification without disclosing sensitive user information.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Rarimo L2 (Source)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Registration SMT (ZK Passport Registry)             │   │
│  │  Address: 0x479F84502Db545FA8d2275372E0582425204A879 │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ RootUpdated Events
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Proof Verification Relayer (Server)            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Listens to Rarimo L2 events                      │   │
│  │  • Signs state transitions                          │   │
│  │  • Stores states in PostgreSQL                      │   │
│  │  • Exposes API for signed states                    │   │
│  └────────────────────┬────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ Signed State (root, timestamp, signature)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Client)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • User generates ZK proof                          │   │
│  │  • Fetches signed state from relayer                │   │
│  │  • Submits state transition on-demand               │   │
│  └────────────────────┬────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ transitionRootWithSignature()
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Mantle Network (Mainnet/Testnet)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RegistrationSMTReplicator (UUPS Proxy)              │  │
│  │  • Replicates ZK Passport Registry state             │  │
│  │  • Validates oracle signatures                       │  │
│  │  • Maintains root validity (1 hour)                  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│                       │ isRootValid()                       │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ZkKycWithRarimo                                     │  │
│  │  • Verifies ZK Passport proofs                       │  │
│  │  • Prevents double verification (nullifiers)         │  │
│  │  • Manages user verification status                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Repository Structure

```
ZK-yield-proof-vault/
├── contracts/                              # Smart contracts
│   ├── src/zk-kyc/rarimo/
│   │   ├── RegistrationSMTReplicator.sol  # State replication contract
│   │   └── ZkKycWithRarimo.sol            # ZK verification contract
│   ├── script/
│   │   └── DeployZkKycWithRarimo.s.sol    # Deployment script
│   ├── .env.example                        # Environment template
│   └── RARIMO_DEPLOYMENT.md               # Deployment guide
│
├── client-and-server/
│   ├── client/                            # Frontend application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── ZkPassportVerificationForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useRarimoRelayer.ts
│   │   │   │   └── useZkPassportVerification.ts
│   │   │   └── config/
│   │   │       └── rarimo.ts
│   │   ├── scripts/
│   │   │   └── generateRelayerKeys.ts     # Key generation script
│   │   └── RARIMO_INTEGRATION.md          # Frontend guide
│   │
│   └── server/                            # Backend services
│       └── rarimo-relayer/
│           ├── config_mantle.yaml         # Relayer configuration
│           ├── docker-compose.yml         # Docker setup
│           └── README.md                  # Relayer guide
│
└── README_RARIMO.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm
- **Foundry** for Solidity development
- **Docker** and Docker Compose (for relayer)
- **PostgreSQL** (included in Docker setup)
- Funded wallets on Mantle Testnet/Mainnet

### Step 1: Generate Oracle Keys

```bash
cd client-and-server/client/scripts
npm install
npm run generate-keys
```

**Important**: Save the generated private key and mnemonic securely!

### Step 2: Deploy Smart Contracts

```bash
cd contracts
cp .env.example .env
# Edit .env with your configuration
forge script script/DeployZkKycWithRarimo.s.sol \
  --rpc-url $MANTLE_TESTNET_RPC_URL \
  --broadcast \
  --verify
```

See [contracts/RARIMO_DEPLOYMENT.md](contracts/RARIMO_DEPLOYMENT.md) for detailed instructions.

### Step 3: Set Up Relayer Service

```bash
cd client-and-server/server/rarimo-relayer
# Edit config_mantle.yaml with your settings
docker-compose up -d
```

See [client-and-server/server/rarimo-relayer/README.md](client-and-server/server/rarimo-relayer/README.md) for configuration details.

### Step 4: Configure Frontend

```bash
cd client-and-server/client
cp .env.example .env.local
# Edit .env.local with deployed contract addresses
npm install
npm run dev
```

See [client-and-server/client/RARIMO_INTEGRATION.md](client-and-server/client/RARIMO_INTEGRATION.md) for integration guide.

## 📚 Documentation

Each component has detailed documentation:

1. **[Contract Deployment Guide](contracts/RARIMO_DEPLOYMENT.md)**: Deploy RegistrationSMTReplicator and ZkKycWithRarimo
2. **[Relayer Setup Guide](client-and-server/server/rarimo-relayer/README.md)**: Configure and run the proof-verification-relayer
3. **[Frontend Integration Guide](client-and-server/client/RARIMO_INTEGRATION.md)**: Integrate ZK Passport verification in your dApp

## 🔑 Key Components

### 1. RegistrationSMTReplicator

UUPS upgradeable proxy contract that replicates the ZK Passport Registry state from Rarimo L2 to Mantle.

**Key Features:**
- Oracle-based state updates
- Signature verification for state transitions
- 1-hour root validity window
- Owner-controlled oracle management

**Main Functions:**
```solidity
function transitionRoot(bytes32 newRoot, uint256 timestamp) external onlyOracle
function transitionRootWithSignature(bytes32 newRoot, uint256 timestamp, bytes signature) external
function isRootValid(bytes32 root) external view returns (bool)
```

### 2. ZkKycWithRarimo

Contract for verifying ZK Passport proofs on Mantle.

**Key Features:**
- Root validity verification
- Nullifier-based double-spending prevention
- User verification status tracking

**Main Functions:**
```solidity
function verifyZkPassport(bytes32 registrationRoot, bytes32 nullifier, bytes proof) external
function isVerified(address user) external view returns (bool)
```

### 3. Proof Verification Relayer

Go-based service that listens to Rarimo L2 and provides signed state transitions.

**Key Features:**
- Event listening from Rarimo L2
- State signing with oracle private key
- RESTful API for state queries
- PostgreSQL state storage

### 4. Frontend Integration

React hooks and components for seamless ZK Passport verification.

**Key Features:**
- Automatic state transition handling
- Wallet integration via wagmi
- User-friendly verification UI

## 🔐 Security Considerations

1. **Oracle Security**
   - Oracle private key must be kept secure
   - Use vault services for production (e.g., AWS Secrets Manager, HashiCorp Vault)
   - Monitor oracle activity for unauthorized access

2. **Contract Security**
   - Contracts are upgradeable via UUPS pattern
   - Only owner can upgrade or modify oracles
   - Root validity limited to 1 hour to prevent stale state attacks

3. **Nullifier Protection**
   - Each nullifier can only be used once
   - Prevents identity replay attacks
   - Nullifiers are derived from passport data

4. **API Security**
   - CORS configuration should be restrictive in production
   - Consider rate limiting for relayer API
   - Use HTTPS for all communications

## 🧪 Testing

### Test on Mantle Testnet

1. Deploy to Mantle Testnet
2. Configure relayer with testnet settings
3. Generate test ZK proofs
4. Verify the complete flow

### Integration Tests

```bash
# Run contract tests
cd contracts
forge test

# Run frontend tests
cd client-and-server/client
npm run test
```

## 🌐 Deployed Addresses

### Mantle Testnet
- **RegistrationSMTReplicator**: `<FILL_AFTER_DEPLOYMENT>`
- **ZkKycWithRarimo**: `<FILL_AFTER_DEPLOYMENT>`

### Mantle Mainnet
- **RegistrationSMTReplicator**: `<FILL_AFTER_DEPLOYMENT>`
- **ZkKycWithRarimo**: `<FILL_AFTER_DEPLOYMENT>`

## 📖 Resources

- [Rarimo Documentation](https://docs.rarimo.com/zk-passport/)
- [Rarimo ZK Passport Guide](https://docs.rarimo.com/zk-passport/guide-setting-up-cross-chain-replication/)
- [Proof Verification Relayer](https://github.com/rarimo/proof-verification-relayer)
- [Passport Contracts](https://github.com/rarimo/passport-contracts)
- [Mantle Network](https://www.mantle.xyz/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Important Notes

1. **Testnet First**: Always test on Mantle Testnet before deploying to mainnet
2. **Key Security**: Never commit private keys or environment files
3. **Oracle Funding**: Ensure oracle address has sufficient funds for gas
4. **State Sync**: Allow time for relayer to sync state from Rarimo L2
5. **Root Validity**: Roots are valid for 1 hour - plan verification accordingly

## 🆘 Troubleshooting

### Common Issues

**Q: Relayer not syncing states**
- Check Rarimo L2 RPC connectivity
- Verify contract address in config
- Check database connection

**Q: Transaction reverts with "InvalidRoot"**
- Ensure root has been transitioned on-chain
- Check root is less than 1 hour old
- Verify relayer is running and synced

**Q: "NotAnOracle" error**
- Verify oracle address is added to replicator
- Check signature is from correct oracle
- Ensure oracle private key matches address

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Join [Rarimo Discord](https://discord.gg/rarimo)
- Check [Rarimo Documentation](https://docs.rarimo.com)

---

Built with ❤️ for the Mantle Global Hackathon using [Rarimo](https://rarimo.com) ZK Passport technology.
