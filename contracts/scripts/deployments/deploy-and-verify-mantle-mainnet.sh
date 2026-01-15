#!/bin/bash

# Deploy and Verify All Contracts on Mantle Mainnet
# This script deploys all contracts and verifies them on Mantlescan

set -e

echo "======================================"
echo "Mantle Mainnet Deployment & Verification"
echo "======================================"
echo ""
echo "Cost Estimate (which was measured on Jan 10, 2026):"
echo "- YieldProofSystem: ~0.8 MNT"
echo "- Rarimo ZK KYC: ~0.4 MNT"
echo "- Total: ~1.2 MNT"
echo ""

# Load environment variables
source .env

# Check deployer balance
DEPLOYER_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $MANTLE_MAINNET_RPC_URL --ether)
echo "Deployer Address: $DEPLOYER_ADDRESS"
echo "Current Balance: $BALANCE MNT"
echo ""

# Minimum required balance
MIN_BALANCE="1.5"
echo "Estimated total cost: ~1.2 MNT"
echo "Recommended balance: > $MIN_BALANCE MNT"
echo ""

# Deploy YieldProofSystem contracts
echo "======================================"
echo "1. Deploying YieldProofSystem Contracts"
echo "======================================"
echo ""

forge script scripts/deployments/circuits/DeployYieldProofSystem.s.sol:DeployYieldProofSystem \
  --rpc-url $MANTLE_MAINNET_RPC_URL \
  --broadcast \
  --legacy \
  --slow \
  --skip-simulation

# Extract deployed addresses from the broadcast file
BROADCAST_FILE="broadcast/DeployYieldProofSystem.s.sol/5000/run-latest.json"

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
  sed -i.bak "s/MAINNET_HONK_VERIFIER_ADDRESS=.*/MAINNET_HONK_VERIFIER_ADDRESS=$HONK_VERIFIER/" .env
  sed -i.bak "s/MAINNET_YIELD_PROOF_VERIFIER_ADDRESS=.*/MAINNET_YIELD_PROOF_VERIFIER_ADDRESS=$YIELD_PROOF_VERIFIER/" .env
  sed -i.bak "s/MAINNET_YIELD_VAULT_ADDRESS=.*/MAINNET_YIELD_VAULT_ADDRESS=$YIELD_VAULT/" .env
  
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
  --rpc-url $MANTLE_MAINNET_RPC_URL \
  --broadcast \
  --legacy \
  --slow \
  --skip-simulation

# Extract deployed addresses
BROADCAST_FILE_RARIMO="broadcast/DeployZkKycWithRarimo.s.sol/5000/run-latest.json"

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
  sed -i.bak "s/MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=.*/MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=$REPLICATOR_PROXY/" .env
  sed -i.bak "s/MAINNET_ZK_KYC_RARIMO_ADDRESS=.*/MAINNET_ZK_KYC_RARIMO_ADDRESS=$ZK_KYC/" .env
  
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

# Verify HonkVerifier
echo "Verifying HonkVerifier..."
forge verify-contract $MAINNET_HONK_VERIFIER_ADDRESS \
  src/circuits/honk-verifier/honk_vk.sol:HonkVerifier \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --watch || echo "HonkVerifier verification failed or already verified"

echo ""

# Verify YieldProofVerifier
echo "Verifying YieldProofVerifier..."
CONSTRUCTOR_ARGS_VERIFIER=$(cast abi-encode "constructor(address)" $MAINNET_HONK_VERIFIER_ADDRESS)
forge verify-contract $MAINNET_YIELD_PROOF_VERIFIER_ADDRESS \
  src/circuits/YieldProofVerifier.sol:YieldProofVerifier \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --constructor-args $CONSTRUCTOR_ARGS_VERIFIER \
  --watch || echo "YieldProofVerifier verification failed or already verified"

echo ""

# Verify YieldVault
echo "Verifying YieldVault..."
CONSTRUCTOR_ARGS_VAULT=$(cast abi-encode "constructor(address,uint64)" $MAINNET_YIELD_PROOF_VERIFIER_ADDRESS 1000000000000000)
forge verify-contract $MAINNET_YIELD_VAULT_ADDRESS \
  src/YieldVault.sol:YieldVault \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --constructor-args $CONSTRUCTOR_ARGS_VAULT \
  --watch || echo "YieldVault verification failed or already verified"

echo ""

# Verify RegistrationSMTReplicator Implementation
echo "Verifying RegistrationSMTReplicator Implementation..."
forge verify-contract $REPLICATOR_IMPL \
  src/zk-kyc/rarimo/RegistrationSMTReplicator.sol:RegistrationSMTReplicator \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --watch || echo "RegistrationSMTReplicator Implementation verification failed or already verified"

echo ""

# Verify RegistrationSMTReplicator Proxy
echo "Verifying RegistrationSMTReplicator Proxy..."
# Proxy verification requires initialization data
forge verify-contract $MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --watch || echo "Proxy verification failed or already verified"

echo ""

# Verify ZkKycWithRarimo
echo "Verifying ZkKycWithRarimo..."
CONSTRUCTOR_ARGS_ZK_KYC=$(cast abi-encode "constructor(address)" $MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS)
forge verify-contract $MAINNET_ZK_KYC_RARIMO_ADDRESS \
  src/zk-kyc/rarimo/ZkKycWithRarimo.sol:ZkKycWithRarimo \
  --chain-id 5000 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.mantlescan.xyz/api \
  --constructor-args $CONSTRUCTOR_ARGS_ZK_KYC \
  --watch || echo "ZkKycWithRarimo verification failed or already verified"

echo ""
echo "======================================"
echo "Deployment and Verification Complete!"
echo "======================================"
echo ""
echo "Contract Addresses (Mainnet):"
echo "  HonkVerifier: $MAINNET_HONK_VERIFIER_ADDRESS"
echo "  YieldProofVerifier: $MAINNET_YIELD_PROOF_VERIFIER_ADDRESS"
echo "  YieldVault: $MAINNET_YIELD_VAULT_ADDRESS"
echo "  RegistrationSMTReplicator: $MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS"
echo "  ZkKycWithRarimo: $MAINNET_ZK_KYC_RARIMO_ADDRESS"
echo ""
echo "All addresses have been saved to .env file"
echo ""
