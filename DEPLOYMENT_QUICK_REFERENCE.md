# YieldVault Deployment - Quick Reference

## 🎯 Deployment Status: ✅ COMPLETE

**Network:** Mantle Sepolia Testnet  
**Chain ID:** 5003  
**Date:** January 15, 2026

---

## 📝 Contract Addresses

| Contract | Address | Explorer |
|----------|---------|----------|
| **YieldVault** | `0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E` | [View](https://explorer.sepolia.mantle.xyz/address/0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E) |
| **YieldProofVerifier** | `0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1` | [View](https://explorer.sepolia.mantle.xyz/address/0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1) |
| **HonkVerifier** | `0x59E5927bc672dA957B209bB40945b002B81E2A7b` | [View](https://explorer.sepolia.mantle.xyz/address/0x59E5927bc672dA957B209bB40945b002B81E2A7b) |

### ✅ Verification Status
All contracts are **verified** on Mantlescan using Sourcify.

---

## 🔧 Configuration Updates

### Contracts `.env`
```bash
TESTNET_HONK_VERIFIER_ADDRESS="0x59E5927bc672dA957B209bB40945b002B81E2A7b"
TESTNET_YIELD_PROOF_VERIFIER_ADDRESS="0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1"
TESTNET_YIELD_VAULT_ADDRESS="0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E"
```

### Client `.env`
```bash
NEXT_PUBLIC_VAULT_ADDRESS_TESTNET="0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E"
NEXT_PUBLIC_VERIFIER_ADDRESS_TESTNET="0xf016F797f75deFF4D64e9b18B5D251A8F38A80d1"
```

---

## ⚙️ Contract Settings

- **Initial Yield Rate:** 0.001 MNT per block (1000000000000000 wei)
- **Current Epoch:** 0 (just deployed)
- **Owner:** Deployer address

---

## 🧪 Testing Commands

### Check Current Epoch
```bash
cast call 0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E "currentEpochId()(uint256)" --rpc-url https://rpc.sepolia.mantle.xyz
```

### Check Yield Rate
```bash
cast call 0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E "yieldRate()(uint64)" --rpc-url https://rpc.sepolia.mantle.xyz
```

### Check User Balance
```bash
cast call 0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E "getUserBalance(address)(uint256)" <YOUR_ADDRESS> --rpc-url https://rpc.sepolia.mantle.xyz
```

### Make a Test Deposit (requires MNT on testnet)
```bash
cast send 0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E "deposit()" --value 0.1ether --private-key <YOUR_PRIVATE_KEY> --rpc-url https://rpc.sepolia.mantle.xyz
```

---

## 💰 Gas Costs

Total deployment cost: **0.4953 MNT** (~$0.49 USD at current prices)

| Contract | Gas Used | Cost (MNT) |
|----------|----------|------------|
| HonkVerifier | 18,428,822,991 | 0.3704 |
| YieldProofVerifier | 1,165,997,212 | 0.0234 |
| YieldVault | 5,046,093,034 | 0.1014 |

---

## 🌐 Network Information

- **RPC URL:** https://rpc.sepolia.mantle.xyz
- **Chain ID:** 5003
- **Explorer:** https://explorer.sepolia.mantle.xyz
- **Faucet:** https://faucet.sepolia.mantle.xyz

---

## 📋 Next Steps

1. ✅ Deploy contracts
2. ✅ Verify on Mantlescan
3. ✅ Update environment files
4. 🔄 Test frontend integration
5. 🔄 Make test deposits
6. 🔄 Test epoch snapshots
7. 🔄 Test ZK proof generation and yield claims

---

## 🔗 Useful Links

- [YieldVault on Explorer](https://explorer.sepolia.mantle.xyz/address/0x4b7Fdcc6e1B543303289b0D47a0895bC8813FA3E)
- [Mantle Docs](https://docs.mantle.xyz/)
- [Mantle Faucet](https://faucet.sepolia.mantle.xyz)
- [Full Deployment Details](./DEPLOYMENT_MANTLE_TESTNET.md)

---

## 📞 Support

If you encounter any issues:
1. Check the [full deployment documentation](./DEPLOYMENT_MANTLE_TESTNET.md)
2. Verify your .env files are correctly configured
3. Ensure you have MNT testnet tokens from the faucet
4. Check transaction status on Mantlescan
