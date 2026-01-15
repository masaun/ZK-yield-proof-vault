# Rarimo ZK Passport Integration Deployment Guide

This guide walks you through deploying the Rarimo ZK Passport verification system on Mantle Mainnet and Testnet.

## Prerequisites

1. **Foundry**: Install Foundry for Solidity development
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Node.js & npm**: For key generation scripts
   ```bash
   node --version  # Should be v18+
   npm --version
   ```

3. **Funded Wallets**: You need two wallets:
   - **Deployer Wallet**: For deploying contracts
   - **Oracle Wallet**: For relayer authentication (will be generated)

## Step 1: Generate Oracle/Relayer Key Pair

Navigate to the client directory and generate the relayer keys:

```bash
cd client-and-server/client/scripts
npm install
npm run generate-keys
```

This will generate:
- `relayer-keys.json`: Contains the oracle address and private key
- `.env.local`: Environment variables for the client

**⚠️ IMPORTANT**: 
- Save the private key and mnemonic securely
- Never commit these files to version control
- Fund the oracle address with native tokens for gas fees

## Step 2: Set Up Environment Variables

### Contracts Directory

```bash
cd ../../../contracts
cp .env.example .env
```

Edit `.env` and fill in:
```bash
# Your deployer private key (has funds for deployment)
PRIVATE_KEY=0x...

# Oracle address from the generated keys
ORACLE_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...  # From relayer-keys.json

# RPC URLs
MANTLE_MAINNET_RPC_URL=https://rpc.mantle.xyz
MANTLE_TESTNET_RPC_URL=https://rpc.testnet.mantle.xyz
```

## Step 3: Deploy to Mantle Testnet

First, deploy to testnet for testing:

```bash
forge script script/DeployZkKycWithRarimo.s.sol \
  --rpc-url $MANTLE_TESTNET_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

After deployment, you'll see output like:
```
=== Deployment Summary ===
Network: 5003
RegistrationSMTReplicator Proxy: 0x...
ZkKycWithRarimo: 0x...
Oracle Address: 0x...
Source SMT (Rarimo L2): 0x479F84502Db545FA8d2275372E0582425204A879
```

**Save these addresses** to your `.env` file:
```bash
TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
TESTNET_ZK_KYC_RARIMO_ADDRESS=0x...
```

## Step 4: Deploy to Mantle Mainnet

After testing on testnet, deploy to mainnet:

```bash
forge script script/DeployZkKycWithRarimo.s.sol \
  --rpc-url $MANTLE_MAINNET_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

Save the mainnet addresses to your `.env` file:
```bash
MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...
```

## Step 5: Update Client Environment Variables

Update the client `.env.local` file:

```bash
cd ../client-and-server/client
```

Add the deployed contract addresses:
```bash
# Testnet
NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS=0x...

# Mainnet
NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...
```

## Step 6: Verify Contract Deployment

Check that the contracts are properly initialized:

```bash
# Check oracle is set
cast call $TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS \
  "isOracle(address)(bool)" \
  $ORACLE_ADDRESS \
  --rpc-url $MANTLE_TESTNET_RPC_URL

# Should return: true
```

## Next Steps

After deployment, proceed to:
1. **Set up the relayer service** (see `server/README.md`)
2. **Integrate frontend** (see `client/README.md`)
3. **Test the integration** with sample ZK Passport proofs

## Troubleshooting

### Deployment Fails

- Check deployer wallet has sufficient funds
- Verify RPC URL is correct
- Try increasing gas limit: `--gas-limit 8000000`

### Oracle Not Set

- Ensure `ORACLE_ADDRESS` in `.env` matches the generated address
- Re-deploy if necessary

### Verification Fails

- Mantle may not support automatic verification
- Manually verify on Mantle Explorer if needed

## Security Notes

1. **Private Keys**: Never share or commit private keys
2. **Oracle Security**: The oracle private key should be stored securely in the relayer service
3. **Access Control**: Only authorized oracles can update roots
4. **Upgrades**: Contracts are upgradeable via UUPS pattern - only owner can upgrade

## Architecture

```
┌─────────────────────┐
│   Rarimo L2         │
│  (Source Registry)  │
└──────────┬──────────┘
           │
           │ Events
           ▼
┌─────────────────────┐
│  Relayer Service    │
│  (proof-verification│
│   -relayer)         │
└──────────┬──────────┘
           │
           │ Sign & Submit
           ▼
┌─────────────────────┐
│ RegistrationSMT     │
│   Replicator        │
│  (Mantle)           │
└──────────┬──────────┘
           │
           │ Verify Root
           ▼
┌─────────────────────┐
│  ZkKycWithRarimo    │
│  (Your Contract)    │
└─────────────────────┘
```

## Resources

- [Rarimo Documentation](https://docs.rarimo.com/zk-passport/)
- [Mantle Network](https://www.mantle.xyz/)
- [Foundry Book](https://book.getfoundry.sh/)
