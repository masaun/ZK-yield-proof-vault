# Rarimo ZK Passport Integration - Frontend

This directory contains the frontend integration for Rarimo's ZK Passport verification system on Mantle.

## Overview

The frontend enables users to:
1. Connect their wallet
2. Obtain ZK Passport proofs from Rarimo's verificator service
3. Automatically fetch signed state transitions from the relayer
4. Submit verification transactions to the ZkKycWithRarimo contract

## Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Rarimo Relayer API URLs
NEXT_PUBLIC_RELAYER_API_URL_MAINNET=https://your-relayer.example.com
NEXT_PUBLIC_RELAYER_API_URL_TESTNET=http://localhost:8080

# Contract Addresses - Mainnet
NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...

# Contract Addresses - Testnet
NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS=0x...

# Rarimo Verificator Service
NEXT_PUBLIC_RARIMO_VERIFICATOR_URL=https://api.verificator.rarimo.com
```

### 3. Generate Relayer Keys (First Time Only)

```bash
cd scripts
npm install
npm run generate-keys
```

This will generate:
- Oracle/relayer wallet credentials
- `.env.local` with the oracle address
- `relayer-keys.json` (keep this secure!)

## Usage

### Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Components

### ZkPassportVerificationForm

Main component for ZK Passport verification:

```tsx
import { ZkPassportVerificationForm } from '@/components/ZkPassportVerificationForm';
import { getRarimoConfig } from '@/config/rarimo';

function MyPage() {
  const config = getRarimoConfig('testnet'); // or 'mainnet'

  return (
    <ZkPassportVerificationForm
      zkKycAddress={config.zkKycAddress}
      replicatorAddress={config.replicatorAddress}
      relayerApiUrl={config.relayerApiUrl}
    />
  );
}
```

### Hooks

#### useZkPassportVerification

Hook for ZK Passport verification:

```tsx
import { useZkPassportVerification } from '@/hooks/useZkPassportVerification';

function MyComponent() {
  const { verify, isVerifying, isSuccess, isUserVerified } = useZkPassportVerification({
    zkKycAddress: '0x...',
    replicatorAddress: '0x...',
    relayerApiUrl: 'http://localhost:8080',
  });

  const handleVerify = async () => {
    await verify({
      registrationRoot: '0x...',
      nullifier: '0x...',
      proof: '0x...',
    });
  };

  return (
    <div>
      <button onClick={handleVerify} disabled={isVerifying}>
        {isVerifying ? 'Verifying...' : 'Verify'}
      </button>
      {isUserVerified && <p>User is verified! ✓</p>}
    </div>
  );
}
```

#### useRarimoRelayer

Hook for interacting with the relayer:

```tsx
import { useRarimoRelayer } from '@/hooks/useRarimoRelayer';

function MyComponent() {
  const { submitStateTransition, isTransitioning } = useRarimoRelayer({
    replicatorAddress: '0x...',
    relayerApiUrl: 'http://localhost:8080',
  });

  const handleTransition = async (root: string) => {
    await submitStateTransition(root);
  };

  return (
    <button onClick={() => handleTransition('0x...')} disabled={isTransitioning}>
      {isTransitioning ? 'Transitioning...' : 'Submit State'}
    </button>
  );
}
```

## Integration Flow

```
1. User generates ZK proof
   ↓
2. Frontend extracts registration root (11th public signal)
   ↓
3. Frontend queries relayer for signed state:
   GET /integrations/proof-verification-relayer/v2/state?filter[root]={root}
   ↓
4. Relayer returns signed state { root, timestamp, signature }
   ↓
5. Frontend calls RegistrationSMTReplicator.transitionRootWithSignature()
   ↓
6. Frontend calls ZkKycWithRarimo.verifyZkPassport()
   ↓
7. User is verified! ✅
```

## API Integration

### Fetch Signed State

```typescript
const fetchSignedState = async (root: string) => {
  const url = new URL('http://localhost:8080/integrations/proof-verification-relayer/v2/state');
  url.searchParams.set('filter[root]', root);

  const response = await fetch(url.toString());
  const data = await response.json();

  return {
    root: data.data.attributes.root,
    timestamp: data.data.attributes.timestamp,
    signature: data.data.attributes.signature,
  };
};
```

### Submit State Transition

```typescript
import { useContractWrite } from 'wagmi';

const { write } = useContractWrite({
  address: replicatorAddress,
  abi: REPLICATOR_ABI,
  functionName: 'transitionRootWithSignature',
});

const submitTransition = async (signedState) => {
  write({
    args: [
      signedState.root,
      BigInt(signedState.timestamp),
      signedState.signature,
    ],
  });
};
```

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

## Deployment

### Vercel

```bash
vercel --prod
```

### Environment Variables

Make sure to set all environment variables in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables

## Troubleshooting

### "Relayer API not responding"
- Check relayer service is running: `docker-compose ps`
- Verify RELAYER_API_URL is correct
- Check CORS settings in relayer config

### "Invalid root" error
- Ensure relayer has synced the state
- Check the registration root matches the ZK proof
- Verify the root is less than 1 hour old

### "Transaction reverted"
- Check wallet has sufficient gas
- Verify contract addresses are correct
- Ensure oracle is set correctly in replicator

## Security

1. **Private Keys**: Never commit `.env.local` or `relayer-keys.json`
2. **API Keys**: Use environment variables for sensitive data
3. **HTTPS**: Always use HTTPS in production
4. **Validation**: Validate all user inputs before submission

## Resources

- [Rarimo Documentation](https://docs.rarimo.com/zk-passport/)
- [Rarimo SDK](https://github.com/rarimo/js-sdk)
- [Example DApps](https://github.com/rarimo/rarime)
- [Mantle Network](https://www.mantle.xyz/)

## Support

For issues or questions:
- Rarimo Discord: [discord.gg/rarimo](https://discord.gg/rarimo)
- GitHub Issues: [Open an issue](https://github.com/your-repo/issues)
