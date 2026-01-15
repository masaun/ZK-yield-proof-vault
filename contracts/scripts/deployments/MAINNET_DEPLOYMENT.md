# Mantle Mainnet Deployment Guide

This guide provides step-by-step instructions for deploying all contracts to Mantle Mainnet and verifying them on Mantlescan.

## Prerequisites

1. **Funded Deployer Account**: Ensure your deployer account has sufficient MNT
   - Estimated cost: **~1.2 MNT**
   - Recommended balance: **> 1.5 MNT**
   - Deployer Address: Check with `cast wallet address --private-key $PRIVATE_KEY`

2. **Environment Setup**: Configure your `.env` file with:
   - `PRIVATE_KEY`: Your deployer private key
   - `ORACLE_ADDRESS`: Oracle address (generated from generateRelayerKeys.ts)
   - `ORACLE_PRIVATE_KEY`: Oracle private key
   - `ETHERSCAN_API_KEY`: Your Mantlescan API key
   - `MANTLE_MAINNET_RPC_URL`: https://rpc.mantle.xyz

3. **Build Optimization**: Contracts are built with `optimizer_runs=20` to balance contract size and deployment cost.

## Quick Start

### Automated Deployment (Recommended)

Run the automated deployment script:

- For the Mantle Mainnet
```bash
cd contracts
sh ./script/deployments/deploy-and-verify-mantle-mainnet.sh
```

- For the Mantle Sepolia Testnet
```bash
cd contracts
sh ./script/deployments/deploy-and-verify-mantle-testnet.sh
```

<br>

This script will:
1. Deploy all YieldProofSystem contracts (HonkVerifier, YieldProofVerifier, YieldVault)
2. Deploy all Rarimo ZK KYC contracts (RegistrationSMTReplicator, ZkKycWithRarimo)
3. Update `.env` file with deployed addresses
4. Verify all contracts on Mantlescan

### Manual Deployment

If you prefer to deploy manually:

#### 1. Check Your Balance

```bash
source .env
cast balance $(cast wallet address --private-key $PRIVATE_KEY) --rpc-url $MANTLE_MAINNET_RPC_URL --ether
```

#### 2. Deploy YieldProofSystem Contracts

```bash
forge script script/deployments/circuits/DeployYieldProofSystem.s.sol:DeployYieldProofSystem \
  --rpc-url $MANTLE_MAINNET_RPC_URL \
  --broadcast \
  --legacy \
  --slow
```

**Expected Output:**
- HonkVerifier: `0x...`
- YieldProofVerifier: `0x...`
- YieldVault: `0x...`

**Update `.env`:**
```bash
# Add these addresses to your .env file
MAINNET_HONK_VERIFIER_ADDRESS=0x...
MAINNET_YIELD_PROOF_VERIFIER_ADDRESS=0x...
MAINNET_YIELD_VAULT_ADDRESS=0x...
```

#### 3. Deploy Rarimo ZK KYC Contracts

```bash
forge script script/deployments/zk-kyc/rarimo/DeployZkKycWithRarimo.s.sol:DeployZkKycWithRarimo \
  --rpc-url $MANTLE_MAINNET_RPC_URL \
  --broadcast \
  --legacy \
  --slow
```

**Expected Output:**
- RegistrationSMTReplicator (Implementation): `0x...`
- RegistrationSMTReplicator (Proxy): `0x...`
- ZkKycWithRarimo: `0x...`

**Update `.env`:**
```bash
# Add these addresses to your .env file
MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...  # Use Proxy address
MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...
```

#### 4. Verify Contracts on Mantlescan

Wait for ~2 minutes after deployment for block confirmations, then verify:

**Verify HonkVerifier:**
```bash
forge verify-contract $MAINNET_HONK_VERIFIER_ADDRESS \
  src/circuits/honk-verifier/honk_vk.sol:HonkVerifier \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --watch
```

**Verify YieldProofVerifier:**
```bash
forge verify-contract $MAINNET_YIELD_PROOF_VERIFIER_ADDRESS \
  src/circuits/YieldProofVerifier.sol:YieldProofVerifier \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --constructor-args $(cast abi-encode "constructor(address)" $MAINNET_HONK_VERIFIER_ADDRESS) \
  --watch
```

**Verify YieldVault:**
```bash
forge verify-contract $MAINNET_YIELD_VAULT_ADDRESS \
  src/YieldVault.sol:YieldVault \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --constructor-args $(cast abi-encode "constructor(address,uint64)" $MAINNET_YIELD_PROOF_VERIFIER_ADDRESS 1000000000000000) \
  --watch
```

**Verify RegistrationSMTReplicator Implementation:**
```bash
# First, find the implementation address from deployment logs
forge verify-contract <IMPLEMENTATION_ADDRESS> \
  src/zk-kyc/rarimo/RegistrationSMTReplicator.sol:RegistrationSMTReplicator \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --watch
```

**Verify ZkKycWithRarimo:**
```bash
forge verify-contract $MAINNET_ZK_KYC_RARIMO_ADDRESS \
  src/zk-kyc/rarimo/ZkKycWithRarimo.sol:ZkKycWithRarimo \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --constructor-args $(cast abi-encode "constructor(address)" $MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS) \
  --watch
```

## Deployed Contract Architecture

```
YieldVault System:
├── HonkVerifier (ZK Proof Verification)
├── YieldProofVerifier (Yield Proof Logic)
│   └── Uses HonkVerifier
└── YieldVault (Main Vault Contract)
    └── Uses YieldProofVerifier

Rarimo ZK KYC System:
├── RegistrationSMTReplicator (Proxy Pattern)
│   ├── Implementation Contract
│   └── ERC1967 Proxy
└── ZkKycWithRarimo (KYC Verification)
    └── Uses RegistrationSMTReplicator Proxy
```

## Contract Details

### YieldProofSystem

1. **HonkVerifier** (`honk_vk.sol`)
   - Size: ~23.7 KB (optimized with `optimizer_runs=20`)
   - Purpose: Core ZK proof verification using Honk protocol
   - No constructor arguments

2. **YieldProofVerifier** (`YieldProofVerifier.sol`)
   - Purpose: Wrapper for yield proof verification
   - Constructor: `(address _verifier)` - HonkVerifier address

3. **YieldVault** (`YieldVault.sol`)
   - Purpose: Main yield-bearing vault with ZK proof integration
   - Constructor: `(address _verifier, uint64 _initialYieldRate)`
     - `_verifier`: YieldProofVerifier address
     - `_initialYieldRate`: 1000000000000000 (0.001 per block)

### Rarimo ZK KYC

1. **RegistrationSMTReplicator** (Upgradeable)
   - Implementation + ERC1967 Proxy pattern
   - Purpose: Replicates ZK Passport state from Rarimo L2
   - Initialization: Oracle addresses + Source SMT address

2. **ZkKycWithRarimo** (`ZkKycWithRarimo.sol`)
   - Purpose: KYC verification using Rarimo ZK Passport
   - Constructor: `(address _replicator)` - RegistrationSMTReplicator Proxy

## Troubleshooting

### Insufficient Funds Error
```
Error: insufficient funds for gas * price + value
```
**Solution**: Fund your deployer account with at least 1.5 MNT

### Contract Size Too Large
```
Error: Contract size exceeds 24576 bytes
```
**Solution**: Already configured with `optimizer_runs=20` in `foundry.toml`

### Verification Failed
```
Error: Failed to verify contract
```
**Solutions**:
1. Wait 2-3 minutes after deployment
2. Check that contract address is correct
3. Verify constructor arguments match deployment
4. Ensure ETHERSCAN_API_KEY is valid for Mantlescan

### Execution Reverted
```
Error: execution reverted
```
**Possible causes**:
1. Nonce mismatch - wait for previous transaction to confirm
2. Gas estimation failed - try with `--skip-simulation` flag
3. Contract already deployed at that address

## Verification on Mantlescan

After successful verification, your contracts will be visible at:
- Mainnet: https://mantlescan.xyz/address/YOUR_CONTRACT_ADDRESS

## Post-Deployment

1. **Update Client Configuration**: Copy deployed addresses to client `.env`:
   ```bash
   # In client-and-server/client/.env
   NEXT_PUBLIC_VAULT_ADDRESS_MAINNET=<YIELD_VAULT_ADDRESS>
   NEXT_PUBLIC_VERIFIER_ADDRESS_MAINNET=<YIELD_PROOF_VERIFIER_ADDRESS>
   NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=<REPLICATOR_PROXY_ADDRESS>
   NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS=<ZK_KYC_ADDRESS>
   ```

2. **Test Contracts**: Run integration tests to verify deployment
3. **Fund Vault**: Transfer initial yield funds to YieldVault if needed
4. **Configure Oracle**: Ensure oracle has permissions for SMT updates

## Cost Breakdown

Estimated deployment costs on Mantle Mainnet:
- YieldProofSystem (3 contracts): ~0.8 MNT
- Rarimo ZK KYC (3 contracts): ~0.4 MNT
- **Total**: ~1.2 MNT + buffer

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review deployment logs in `broadcast/` directory
3. Verify gas prices haven't increased significantly
4. Ensure RPC endpoint is responding

## Important Notes

- **Optimizer Settings**: Contracts use `optimizer_runs=20` to keep HonkVerifier under 24KB limit
- **Legacy Transaction Type**: Deployments use `--legacy` flag for compatibility
- **Slow Mode**: Uses `--slow` flag to avoid nonce issues
- **Mainnet vs Testnet**: Always verify chain ID (5000 for mainnet, 5003 for Sepolia testnet)
