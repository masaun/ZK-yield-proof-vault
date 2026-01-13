# Quick Start Guide - ZK Passport On-Chain Verification

## Prerequisites

1. **Mobile App**: Download RariMe mobile app (iOS/Android)
2. **Passport**: Valid passport ready for scanning
3. **Wallet**: MetaMask or compatible wallet
4. **Network**: Mantle Sepolia Testnet (for testing)
5. **Gas**: Some MNT for transaction fees

## Step-by-Step Setup

### 1. Environment Configuration

Create or update `.env.local`:

```bash
# Copy example file
cp .env.example .env.local

# Add your configuration
NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS=0x... # Your deployed contract
NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x... # Replicator address
NEXT_PUBLIC_RELAYER_API_URL_TESTNET=https://... # Relayer endpoint
NEXT_PUBLIC_RARIMO_VERIFICATOR_URL=https://api.app.rarime.com
```

### 2. Install Dependencies

```bash
# From client directory
cd client-and-server/client
npm install
# or
yarn install
```

### 3. Start Development Server

```bash
npm run dev
# or
yarn dev
```

### 4. Access the Application

Open [http://localhost:3000](http://localhost:3000)

## Using the On-Chain Verification

### Option 1: Main Page Integration

1. Navigate to the main page (`/`)
2. Click "Connect Wallet"
3. Select Mantle Sepolia Testnet
4. Scroll to "ZK Passport On-Chain Verification" section
5. Scan the QR code with RariMe app
6. Follow app prompts to generate proof
7. Wait for transaction confirmation

### Option 2: Dedicated Verification Page

1. Navigate to `/onchain-verification`
2. Follow the same steps as above

## Testing the Implementation

### Test Verification Status

```tsx
import { useOnChainVerification } from '@/hooks/useOnChainVerification'
import { getRarimoConfig } from '@/config/rarimo'

function TestComponent() {
  const config = getRarimoConfig('testnet')
  const { isVerified } = useOnChainVerification({
    contractAddress: config.zkKycAddress,
  })

  return <div>Verified: {isVerified ? 'Yes' : 'No'}</div>
}
```

### Check Verification On-Chain

Using Etherscan/Block Explorer:
1. Go to your ZkKycWithRarimo contract
2. Call `isVerified(yourAddress)`
3. Should return `true` after successful verification

## Common Issues & Solutions

### 1. QR Code Not Loading
**Problem**: QR code doesn't appear
**Solution**: 
- Check network connection
- Verify NEXT_PUBLIC_RARIMO_VERIFICATOR_URL is set
- Ensure wallet is connected

### 2. Transaction Fails
**Problem**: Verification transaction reverts
**Solution**:
- Ensure sufficient MNT for gas
- Check you're on correct network
- Verify contract addresses are correct
- Check if already verified (can only verify once)

### 3. "Invalid Root" Error
**Problem**: Registration root not found
**Solution**:
- Wait for relayer to sync state
- Check relayer is running
- Verify replicator contract address

### 4. Proof Generation Fails
**Problem**: Mobile app can't generate proof
**Solution**:
- Ensure passport is valid
- Check lighting when scanning
- Try rescanning passport
- Update RariMe app to latest version

## Verification Flow Diagram

```
┌─────────────────────────┐
│   User Opens DApp       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Connect Wallet         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  QR Code Displayed      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Scan with RariMe App   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Generate ZK Proof      │
│  (on mobile device)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Proof Sent to Web      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Estimate Gas           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Submit Transaction     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Contract Verifies      │
│  - Check root valid     │
│  - Check nullifier new  │
│  - Verify ZK proof      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  User Verified ✅       │
└─────────────────────────┘
```

## Integration with Your Contracts

### Restrict Function Access

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ZkKycWithRarimo.sol";

contract MyContract {
    ZkKycWithRarimo public zkKyc;

    constructor(address _zkKyc) {
        zkKyc = ZkKycWithRarimo(_zkKyc);
    }

    modifier onlyVerified() {
        require(zkKyc.isVerified(msg.sender), "Not verified");
        _;
    }

    function restrictedFunction() external onlyVerified {
        // Only verified users can call this
    }
}
```

### Check Verification in Frontend

```tsx
import { useOnChainVerification } from '@/hooks/useOnChainVerification'

function MyComponent() {
  const { isVerified } = useOnChainVerification({
    contractAddress: '0x...',
  })

  if (!isVerified) {
    return <div>Please verify with ZK Passport first</div>
  }

  return <div>Welcome, verified user!</div>
}
```

## Next Steps

1. **Test Thoroughly**: Complete multiple verification flows
2. **Add Error Boundaries**: Implement error handling
3. **Add Loading States**: Improve UX during verification
4. **Integrate with Features**: Add verification requirements to your features
5. **Deploy to Mainnet**: After testing, deploy to Mantle Mainnet

## Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

## Resources

- 📚 [Full Documentation](./ONCHAIN_VERIFICATION.md)
- 🔗 [Rarimo Docs](https://docs.rarimo.com/)
- 📱 [RariMe App](https://rarime.com/)
- 💬 [Discord Support](https://discord.gg/rarimo)
- 🐛 [GitHub Issues](https://github.com/rarimo/zk-passport/issues)

## Support

If you encounter any issues:

1. Check this guide and the full documentation
2. Review error messages in browser console
3. Check transaction status on block explorer
4. Ask in Rarimo Discord
5. Create an issue on GitHub

---

**Happy Building! 🚀**
