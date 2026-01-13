# ZK Passport On-Chain Verification Implementation

This implementation follows the [Rarimo ZK Passport On-Chain Verification Guide](https://docs.rarimo.com/zk-passport/guide-on-chain-verification/) and is based on the [reference implementation](https://github.com/rarimo/zk-passport/tree/ce1b2e2485df385e3e2ff721963169888b4b412e/examples/onchain-verification-react).

## Overview

This implementation enables on-chain user verification using ZK Passport, allowing users to prove their identity without revealing personal information. The verification happens entirely on-chain on the Mantle network.

## Architecture

### Smart Contracts

- **ZkKycWithRarimo**: Main verification contract that validates ZK proofs on-chain
- **RegistrationSMTReplicator**: Replicates the Rarimo L2 registration state to Mantle

### Frontend Components

1. **OnChainZkPassportVerification** (`src/components/OnChainZkPassportVerification.tsx`)
   - Main verification component with QR code display
   - Handles the complete verification flow
   - Manages state and user feedback

2. **useOnChainVerification** (`src/hooks/useOnChainVerification.ts`)
   - Custom hook for interacting with the verification contract
   - Handles transaction estimation and execution
   - Manages verification state

3. **Utility Components**
   - `Spinner`: Loading indicator
   - `CopyButton`: Copy-to-clipboard functionality
   - `DocsLink`: Link to documentation

### Contract ABIs

- **ZkKycWithRarimoAbi** (`src/contracts/ZkKycWithRarimoAbi.ts`)
  - ABI for the ZK KYC verification contract

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```env
# Mainnet Configuration
NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...
NEXT_PUBLIC_RELAYER_API_URL_MAINNET=https://your-relayer-mainnet.com

# Testnet Configuration  
NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS=0x...
NEXT_PUBLIC_RELAYER_API_URL_TESTNET=https://your-relayer-testnet.com

# Rarimo Verificator Service
NEXT_PUBLIC_RARIMO_VERIFICATOR_URL=https://api.app.rarime.com
```

### Rarimo Configuration

The configuration is managed in `src/config/rarimo.ts`:

```typescript
export const rarimoConfig = {
  sourceSMT: '0x479F84502Db545FA8d2275372E0582425204A879', // Rarimo L2 SMT
  verificator: {
    url: process.env.NEXT_PUBLIC_RARIMO_VERIFICATOR_URL || 'https://api.app.rarime.com',
  },
  // ... contract addresses
}
```

## Usage

### Basic Implementation

```tsx
import { OnChainZkPassportVerification } from '@/components/OnChainZkPassportVerification'

export default function MyPage() {
  return (
    <div>
      <OnChainZkPassportVerification />
    </div>
  )
}
```

### Using the Hook Directly

```tsx
import { useOnChainVerification } from '@/hooks/useOnChainVerification'
import { getRarimoConfig } from '@/config/rarimo'

function MyComponent() {
  const config = getRarimoConfig('testnet')
  
  const {
    isVerified,
    executeVerification,
    isVerifying,
  } = useOnChainVerification({
    contractAddress: config.zkKycAddress,
  })

  return (
    <div>
      {isVerified ? 'Verified!' : 'Not verified'}
    </div>
  )
}
```

## Verification Flow

1. **User Connects Wallet**
   - User connects their wallet to the DApp
   - System checks if already verified

2. **QR Code Generation**
   - Component generates a QR code using `@rarimo/zk-passport-react`
   - QR code contains verification parameters

3. **Proof Generation**
   - User scans QR code with RariMe mobile app
   - App generates ZK proof from passport data
   - Proof is sent back to the web app

4. **Transaction Estimation**
   - App estimates gas for verification transaction
   - Checks if proof can be verified

5. **On-Chain Verification**
   - Submits proof to `ZkKycWithRarimo` contract
   - Contract verifies:
     - Registration root is valid
     - Nullifier hasn't been used
     - ZK proof is valid

6. **Verification Complete**
   - User's address is marked as verified
   - Transaction hash is displayed
   - User can now access protected features

## Key Features

### Privacy-Preserving
- No personal information revealed on-chain
- Only verification status stored
- Uses zero-knowledge proofs

### Sybil-Resistant
- Each passport can only verify once (nullifier system)
- Prevents duplicate verifications

### On-Chain
- Verification state stored on Mantle blockchain
- No centralized verification service required
- Fully decentralized

## Integration with Yield Vault

The on-chain verification can be integrated into the Yield Vault to:

1. **Restrict Deposits**: Only verified users can deposit
2. **KYC Compliance**: Ensure regulatory compliance
3. **Airdrop Distribution**: Verify unique users for airdrops
4. **Sybil Prevention**: Prevent multiple claims per person

Example integration:

```solidity
contract YieldVaultWithKYC {
    IZkKycWithRarimo public zkKyc;
    
    function deposit() external payable {
        require(zkKyc.isVerified(msg.sender), "Not verified");
        // ... deposit logic
    }
}
```

## Testing

### Test on Mantle Sepolia

1. Connect wallet to Mantle Sepolia Testnet
2. Ensure you have testnet MNT for gas
3. Navigate to `/onchain-verification` page
4. Scan QR code with RariMe app
5. Complete verification

### Verify Contracts

Check contract verification status:

```typescript
const { isVerified } = useOnChainVerification({
  contractAddress: config.zkKycAddress
})
```

## Troubleshooting

### Common Issues

1. **"Invalid Root" Error**
   - The registration root hasn't been replicated to Mantle
   - Wait for relayer to sync the state
   - Check relayer status

2. **"Nullifier Already Used" Error**
   - This passport has already been used for verification
   - Each passport can only verify once

3. **Transaction Fails**
   - Check wallet has enough MNT for gas
   - Verify you're on correct network
   - Ensure contracts are properly deployed

### Debug Mode

Enable debug logging:

```typescript
const { isVerified } = useOnChainVerification({
  contractAddress: config.zkKycAddress,
})

console.log('Verification status:', isVerified)
```

## Resources

- [Rarimo Documentation](https://docs.rarimo.com/)
- [ZK Passport Guide](https://docs.rarimo.com/zk-passport/guide-on-chain-verification/)
- [Reference Implementation](https://github.com/rarimo/zk-passport/tree/main/examples/onchain-verification-react)
- [RariMe Mobile App](https://rarime.com/)

## License

MIT
