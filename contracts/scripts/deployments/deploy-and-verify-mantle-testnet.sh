#!/bin/bash

# Deploy and Verify All Contracts on Mantle Sepolia Testnet
# This script deploys all contracts and verifies them on Mantlescan

set -e

echo "======================================"
echo "Mantle Sepolia Testnet Deployment & Verification"
echo "======================================"
echo ""
echo "Cost Estimate (which was measured on Jan 14, 2026):"
echo "- YieldProofSystem: ~0.5 MNT"
echo "- Rarimo ZK KYC: ~0.2 MNT"
echo "- Total: ~0.7 MNT"
echo ""

# Load environment variables
source .env

# Check deployer balance
DEPLOYER_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $MANTLE_TESTNET_RPC_URL --ether)
echo "Deployer Address: $DEPLOYER_ADDRESS"
echo "Current Balance: $BALANCE MNT"
echo ""

# Minimum required balance
MIN_BALANCE="1.0"
echo "Estimated total cost: ~0.7 MNT"
echo "Recommended balance: > $MIN_BALANCE MNT"
echo ""

# Deploy YieldProofSystem contracts
echo "======================================"
echo "1. Deploying YieldProofSystem Contracts"
echo "======================================"
echo ""

forge script script/deployments/circuits/DeployYieldProofSystem.s.sol:DeployYieldProofSystem \
  --rpc-url $MANTLE_TESTNET_RPC_URL \
  --broadcast \
  --legacy \
  --slow \
  --skip-simulation

# Extract deployed addresses from the broadcast file
BROADCAST_FILE="broadcast/DeployYieldProofSystem.s.sol/5003/run-latest.json"

if [ -f "$BROADCAST_FILE" ]; then
  HONK_VERIFIER=$(jq -r '.transactions[0].contractAddress' $BROADCAST_FILE)
  YIELD_PROOF_VERIFIER=$(jq -r '.transactions[1].contractAddress' $BROADCAST_FILE)
  YIELD_VAULT=$(jq -r '.transactions[2].contractAddress' $BROADCAST_FILE)
  
  echo ""
  echo "YieldProofSystem Deployed:"
  echo "  HonkVerifier: $HONK_VERIFIER"
  echo "  YieldProofVerifier: $YIELD_PROOF_VERIFIER"
  echo "  YieldVault: $YIELD_VAULT"
  echo ""
  
  # Update .env file
  sed -i.bak "s/TESTNET_HONK_VERIFIER_ADDRESS=.*/TESTNET_HONK_VERIFIER_ADDRESS=\"$HONK_VERIFIER\"/" .env
  sed -i.bak "s/TESTNET_YIELD_PROOF_VERIFIER_ADDRESS=.*/TESTNET_YIELD_PROOF_VERIFIER_ADDRESS=\"$YIELD_PROOF_VERIFIER\"/" .env
  sed -i.bak "s/TESTNET_YIELD_VAULT_ADDRESS=.*/TESTNET_YIELD_VAULT_ADDRESS=\"$YIELD_VAULT\"/" .env
  
  echo "Updated .env file with YieldProofSystem addresses"
fi

echo ""
echo "Waiting 30 seconds for block confirmations..."
sleep 30

# Deploy Rarimo ZK KYC contracts
echo ""
echo "======================================"
echo "2. Deploying Rarimo ZK KYC Contracts"
echo "======================================"
echo ""

forge script script/deployments/zk-kyc/rarimo/DeployZkKycWithRarimo.s.sol:DeployZkKycWithRarimo \
  --rpc-url $MANTLE_TESTNET_RPC_URL \
  --broadcast \
  --legacy \
  --slow \
  --skip-simulation

# Extract deployed addresses
BROADCAST_FILE_RARIMO="broadcast/DeployZkKycWithRarimo.s.sol/5003/run-latest.json"

if [ -f "$BROADCAST_FILE_RARIMO" ]; then
  REPLICATOR_IMPL=$(jq -r '.transactions[0].contractAddress' $BROADCAST_FILE_RARIMO)
  REPLICATOR_PROXY=$(jq -r '.transactions[1].contractAddress' $BROADCAST_FILE_RARIMO)
  ZK_KYC=$(jq -r '.transactions[2].contractAddress' $BROADCAST_FILE_RARIMO)
  
  echo ""
  echo "Rarimo ZK KYC Deployed:"
  echo "  RegistrationSMTReplicator (Impl): $REPLICATOR_IMPL"
  echo "  RegistrationSMTReplicator (Proxy): $REPLICATOR_PROXY"
  echo "  ZkKycWithRarimo: $ZK_KYC"
  echo ""
  
  # Update .env file
  sed -i.bak "s/TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=.*/TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=\"$REPLICATOR_PROXY\"/" .env
  sed -i.bak "s/TESTNET_ZK_KYC_RARIMO_ADDRESS=.*/TESTNET_ZK_KYC_RARIMO_ADDRESS=\"$ZK_KYC\"/" .env
  
  echo "Updated .env file with Rarimo addresses"
fi

echo ""
echo "Waiting 60 seconds for block confirmations before verification..."
sleep 60

# Verify contracts
echo ""
echo "======================================"
echo "3. Verifying Contracts on Mantlescan"
echo "======================================"
echo ""

# Reload addresses from .env
source .env

# Remove quotes from addresses
TESTNET_HONK_VERIFIER_ADDRESS=$(echo $TESTNET_HONK_VERIFIER_ADDRESS | tr -d '"')
TESTNET_YIELD_PROOF_VERIFIER_ADDRESS=$(echo $TESTNET_YIELD_PROOF_VERIFIER_ADDRESS | tr -d '"')
TESTNET_YIELD_VAULT_ADDRESS=$(echo $TESTNET_YIELD_VAULT_ADDRESS | tr -d '"')
TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=$(echo $TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS | tr -d '"')
TESTNET_ZK_KYC_RARIMO_ADDRESS=$(echo $TESTNET_ZK_KYC_RARIMO_ADDRESS | tr -d '"')

# Verify HonkVerifier
echo "Verifying HonkVerifier..."
forge verify-contract $TESTNET_HONK_VERIFIER_ADDRESS \
  src/circuits/honk-verifier/honk_vk.sol:HonkVerifier \
  --chain 5003 \
  --watch \
  --verifier etherscan || echo "HonkVerifier verification failed or already verified"

echo ""

# Verify YieldProofVerifier
echo "Verifying YieldProofVerifier..."
CONSTRUCTOR_ARGS_VERIFIER=$(cast abi-encode "constructor(address)" $TESTNET_HONK_VERIFIER_ADDRESS)
forge verify-contract $TESTNET_YIELD_PROOF_VERIFIER_ADDRESS \
  src/circuits/YieldProofVerifier.sol:YieldProofVerifier \
  --chain 5003 \
  --watch \
  --verifier etherscan \
  --constructor-args $CONSTRUCTOR_ARGS_VERIFIER || echo "YieldProofVerifier verification failed or already verified"

echo ""

# Verify YieldVault
echo "Verifying YieldVault..."
CONSTRUCTOR_ARGS_VAULT=$(cast abi-encode "constructor(address,uint64)" $TESTNET_YIELD_PROOF_VERIFIER_ADDRESS 1000000000000000)
forge verify-contract $TESTNET_YIELD_VAULT_ADDRESS \
  src/YieldVault.sol:YieldVault \
  --chain 5003 \
  --watch \
  --verifier etherscan \
  --constructor-args $CONSTRUCTOR_ARGS_VAULT || echo "YieldVault verification failed or already verified"

echo ""

# Verify RegistrationSMTReplicator Implementation
if [ ! -z "$REPLICATOR_IMPL" ]; then
  echo "Verifying RegistrationSMTReplicator Implementation..."
  forge verify-contract $REPLICATOR_IMPL \
    src/zk-kyc/rarimo/RegistrationSMTReplicator.sol:RegistrationSMTReplicator \
    --chain 5003 \
    --watch \
    --verifier etherscan || echo "RegistrationSMTReplicator Implementation verification failed or already verified"
  
  echo ""
fi

# Verify RegistrationSMTReplicator Proxy
if [ ! -z "$TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS" ]; then
  echo "Verifying RegistrationSMTReplicator Proxy..."
  # Proxy verification requires initialization data
  forge verify-contract $TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS \
    lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
    --chain 5003 \
    --watch \
    --verifier etherscan || echo "Proxy verification failed or already verified"
  
  echo ""
fi

# Verify ZkKycWithRarimo
if [ ! -z "$TESTNET_ZK_KYC_RARIMO_ADDRESS" ] && [ ! -z "$TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS" ]; then
  echo "Verifying ZkKycWithRarimo..."
  CONSTRUCTOR_ARGS_ZK_KYC=$(cast abi-encode "constructor(address)" $TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS)
  forge verify-contract $TESTNET_ZK_KYC_RARIMO_ADDRESS \
    src/zk-kyc/rarimo/ZkKycWithRarimo.sol:ZkKycWithRarimo \
    --chain 5003 \
    --watch \
    --verifier etherscan \
    --constructor-args $CONSTRUCTOR_ARGS_ZK_KYC || echo "ZkKycWithRarimo verification failed or already verified"
  
  echo ""
fi

echo "======================================"
echo "Deployment and Verification Complete!"
echo "======================================"
echo ""
echo "Contract Addresses (Testnet):"
echo "  HonkVerifier: $TESTNET_HONK_VERIFIER_ADDRESS"
echo "  YieldProofVerifier: $TESTNET_YIELD_PROOF_VERIFIER_ADDRESS"
echo "  YieldVault: $TESTNET_YIELD_VAULT_ADDRESS"
echo "  RegistrationSMTReplicator: $TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS"
echo "  ZkKycWithRarimo: $TESTNET_ZK_KYC_RARIMO_ADDRESS"
echo ""
echo "All addresses have been saved to .env file"
echo ""
echo "View on Mantlescan:"
echo "  https://sepolia.mantlescan.xyz/address/$TESTNET_YIELD_VAULT_ADDRESS"
echo ""
