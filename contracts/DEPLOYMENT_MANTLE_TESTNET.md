# YieldVault Deployment on Mantle Sepolia Testnet

## Deployment Summary

**Network:** Mantle Sepolia Testnet  
**Chain ID:** 5003  
**Deployment Date:** January 15, 2026  
**Initial Yield Rate:** 0.001 MNT per block (1000000000000000 wei)

## Deployed Contract Addresses

### HonkVerifier
- **Address:** `0x59E5927bc672dA957B209bB40945b002B81E2A7b`
- **Explorer:** https://explorer.sepolia.mantle.xyz/address/0x59E5927bc672dA957B209bB40945b002B81E2A7b
- **Verification Status:** ✅ Verified (Sourcify)
- **Transaction:** https://explorer.sepolia.mantle.xyz/tx/0x70d40086e69bc849a311a4768aef91113160863dd5dc0b409862b69f673f23e1

### YieldProofVerifier
- **Address:** `0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1`
- **Explorer:** https://explorer.sepolia.mantle.xyz/address/0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1
- **Verification Status:** ✅ Verified (Sourcify)
- **Constructor Args:**
  - `honkVerifier`: `0x59E5927bc672dA957B209bB40945b002B81E2A7b`
- **Transaction:** https://explorer.sepolia.mantle.xyz/tx/0xffc109c55983125a9b808b5948d52590e9a03e1611fe4fef4b0062980b64d2a1

### YieldVault (Main Contract)
- **Address:** `0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E`
- **Explorer:** https://explorer.sepolia.mantle.xyz/address/0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E
- **Verification Status:** ✅ Verified (Sourcify)
- **Constructor Args:**
  - `verifier`: `0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1`
  - `initialYieldRate`: `1000000000000000` (0.001 MNT per block)
- **Transaction:** https://explorer.sepolia.mantle.xyz/tx/0x80a002e9ae5ca2dca54476a4ebb287587009c60d1b78bc1e2a8676f6a0407ea9

## Gas Costs

| Contract | Gas Used | Cost (MNT) |
|----------|----------|------------|
| HonkVerifier | 18,428,822,991 | 0.3704193421191 |
| YieldProofVerifier | 1,165,997,212 | 0.0234365439612 |
| YieldVault | 5,046,093,034 | 0.1014264699834 |
| **Total** | **24,640,913,237** | **0.4952823560637** |

## Deployment Process

The contracts were deployed using Foundry's deployment script:

```bash
forge script scripts/deployments/circuits/DeployYieldProofSystem.s.sol:DeployYieldProofSystem \
  --rpc-url $MANTLE_TESTNET_RPC_URL \
  --broadcast \
  --verify \
  --verifier sourcify
```

## Contract Verification

All three contracts have been successfully verified on the Mantle Sepolia Explorer using Sourcify:

1. ✅ HonkVerifier - Full match
2. ✅ YieldProofVerifier - Full match
3. ✅ YieldVault - Full match

## Configuration

Add these addresses to your `.env` file:

```bash
# Mantle Sepolia Testnet
TESTNET_HONK_VERIFIER_ADDRESS="0x59E5927bc672dA957B209bB40945b002B81E2A7b"
TESTNET_YIELD_PROOF_VERIFIER_ADDRESS="0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1"
TESTNET_YIELD_VAULT_ADDRESS="0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E"
```

## Next Steps

1. ✅ Contracts deployed
2. ✅ Contracts verified on Mantlescan
3. 🔄 Update frontend configuration with new contract addresses
4. 🔄 Test deposit/withdraw functionality
5. 🔄 Test ZK proof generation and yield claiming

## Network Information

- **RPC URL:** https://rpc.sepolia.mantle.xyz
- **Explorer:** https://explorer.sepolia.mantle.xyz
- **Faucet:** https://faucet.sepolia.mantle.xyz

## Contract Features

### YieldVault
- ZK proof-based yield verification
- Epoch-based yield distribution
- Merkle tree snapshot mechanism
- Nullifier system to prevent double claiming
- Configurable yield rate

### Security Features
- Zero-knowledge proofs for privacy-preserving yield claims
- Honk proof system for efficient verification
- Merkle tree for user balance verification
- Nullifier tracking to prevent replay attacks

## Testing

To interact with the deployed contracts:

```bash
# Check vault balance
cast call 0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E "currentEpochId()" --rpc-url $MANTLE_TESTNET_RPC_URL

# Check your deposit
cast call 0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E "getUserBalance(address)" <YOUR_ADDRESS> --rpc-url $MANTLE_TESTNET_RPC_URL
```

## Important Notes

- Initial yield rate is set to 0.001 MNT per block
- The vault owner can update the yield rate and verifier contract
- Users can deposit at any time
- Yield can be claimed after epoch snapshots using ZK proofs
- Each epoch must be snapshotted before claims can be made
