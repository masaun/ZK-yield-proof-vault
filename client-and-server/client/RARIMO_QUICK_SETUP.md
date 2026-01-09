# Quick Setup Guide - Rarimo ZK Passport Integration

This guide provides step-by-step instructions to set up and test the Rarimo ZK Passport integration in your local development environment.

## Prerequisites

- Node.js 18+ installed
- Wallet with MNT on Mantle Sepolia Testnet (for testing)
- Rarimo mobile app installed on your phone
- Deployed Rarimo contracts on Mantle (see `/contracts/RARIMO_DEPLOYMENT.md`)

## Step 1: Install Dependencies

```bash
cd client-and-server/client
npm install
```

This will install the `@rarimo/zk-passport-react` package and all other dependencies.

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your configuration:

```bash
# WalletConnect Project ID (get from https://dashboard.reown.com)
NEXT_PUBLIC_PROJECT_ID=your_project_id

# Rarimo Verificator Service (use public instance for testing)
NEXT_PUBLIC_RARIMO_VERIFICATOR_URL=https://api.app.rarime.com

# Rarimo Relayer API (set up in Step 3)
NEXT_PUBLIC_RELAYER_API_URL_TESTNET=http://localhost:8080

# Your deployed contract addresses on Mantle Sepolia
NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0xYourReplicatorAddress
NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS=0xYourZkKycAddress

# For Mainnet (when ready)
NEXT_PUBLIC_RELAYER_API_URL_MAINNET=http://localhost:8080
NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS=0x...
```

## Step 3: Set Up the Relayer

The relayer is required to sync state from Rarimo L2 to Mantle.

1. Navigate to the relayer directory:
```bash
cd ../../server/rarimo-relayer
```

2. Edit `config_mantle.yaml` with your settings:
```yaml
listener:
  chains:
    rarimo:
      # ... (keep default Rarimo L2 settings)
    
    mantle:
      rpc: https://rpc.sepolia.mantle.xyz  # or mainnet RPC
      contract_addr: "0xYourReplicatorAddress"  # Same as in .env.local
      block_window: 1000
      start_block: latest

# Add your relayer oracle private key (must be registered in replicator contract)
broadcaster:
  sender_prv_key: "your_private_key_here"  # DO NOT COMMIT THIS!
```

3. Start the relayer:
```bash
docker-compose up -d
```

4. Verify it's running:
```bash
docker-compose logs -f
```

You should see logs indicating it's listening for events.

## Step 4: Start the Frontend

1. Return to the client directory:
```bash
cd ../../client-and-server/client
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Integration

### 5.1 Connect Your Wallet

1. Click "Connect Wallet" button
2. Select your wallet provider
3. Switch to **Mantle Sepolia Testnet** (Chain ID: 5003)
4. Approve the connection

### 5.2 Initiate ZK Passport Verification

1. Scroll to the "ZK Passport Verification" section
2. Verify you see:
   - Network: Mantle Sepolia Testnet
   - Contract addresses displayed
   - Status: idle

3. Click "🔐 Connect Rarimo ZK Passport"

### 5.3 Scan the QR Code

1. A modal should appear with a QR code
2. Open the Rarimo app on your phone
3. Scan the QR code
4. Follow the prompts in the Rarimo app to:
   - Grant access to your passport data
   - Generate the zero-knowledge proof

### 5.4 Wait for Verification

The frontend will automatically:
1. Receive the proof from Rarimo
2. Fetch signed state from the relayer
3. Submit state transition to the RegistrationSMTReplicator contract
4. Verify the proof on-chain

Watch the status change from "pending" to "success"!

### 5.5 Check Verification Status

1. The QR code modal will close automatically
2. You should see a green "✓ Verified" badge
3. Scroll down to the "Verification Status Dashboard"
4. Verify:
   - Your verification status shows "✓ Verified"
   - Latest root has been updated
   - Total roots count has increased

## Step 6: Test Manual State Management

### 6.1 Manual Root Check

1. In the "Verification Status Dashboard", scroll to "Manual State Management"
2. Enter a registration root (you can copy the latest root from above)
3. Click "Check Root"
4. Verify it shows "✓ Root is valid and replicated on this chain"

### 6.2 Manual State Transition

1. Get a new registration root from the Rarimo app or verificator service
2. Enter it in the "Registration Root" field
3. Click "Check Root" - it should show "✗ Root not found"
4. Click "Submit State Transition"
5. Approve the transaction in your wallet
6. Wait for confirmation
7. Click "Check Root" again - it should now show "✓ Root is valid"

## Troubleshooting

### QR Code Not Displaying

**Problem**: QR code modal is blank or shows error

**Solutions**:
- Check browser console for errors
- Ensure `@rarimo/zk-passport-react` is installed: `npm list @rarimo/zk-passport-react`
- Clear browser cache and restart dev server
- Check that NEXT_PUBLIC_RARIMO_VERIFICATOR_URL is set correctly

### State Transition Failing

**Problem**: "Failed to submit state transition" error

**Solutions**:
- Verify relayer is running: `cd ../../server/rarimo-relayer && docker-compose ps`
- Check relayer logs: `docker-compose logs -f`
- Ensure relayer API URL is correct in .env.local
- Verify relayer's address is registered as oracle in replicator contract
- Check that you have enough MNT for gas

### Verification Not Working

**Problem**: Proof verification fails on-chain

**Solutions**:
- Ensure state transition completed successfully first
- Check that the registration root exists on-chain (use Manual Root Check)
- Verify contract addresses are correct
- Check Mantle block explorer for transaction errors

### Wrong Network

**Problem**: "Switch to Mantle Network" message

**Solution**:
- Click the button or manually switch to Mantle Sepolia Testnet in your wallet
- Chain ID should be 5003 for testnet, 5000 for mainnet

### Relayer Not Syncing

**Problem**: Relayer doesn't fetch signed states

**Solutions**:
- Check `config_mantle.yaml` has correct contract address
- Verify RPC URL is accessible
- Restart relayer: `docker-compose restart`
- Check relayer database for stored states

## Next Steps

### For Production Deployment

1. **Deploy to Mainnet**:
   - Deploy contracts to Mantle Mainnet
   - Update environment variables for mainnet
   - Configure relayer for mainnet RPC

2. **Host Relayer Publicly**:
   - Deploy relayer to a server (not localhost)
   - Set up HTTPS with SSL certificate
   - Update NEXT_PUBLIC_RELAYER_API_URL_MAINNET

3. **Security Hardening**:
   - Use dedicated relayer key with minimal permissions
   - Set up monitoring and alerts
   - Enable rate limiting on relayer API

4. **Deploy Frontend**:
   - Build for production: `npm run build`
   - Deploy to Vercel, Netlify, or your hosting provider
   - Set environment variables in hosting dashboard

### Additional Resources

- [Full Integration Documentation](./RARIMO_FRONTEND_INTEGRATION.md)
- [Contract Deployment Guide](../../contracts/RARIMO_DEPLOYMENT.md)
- [Rarimo Documentation](https://docs.rarimo.com/)
- [Rarimo GitHub Examples](https://github.com/rarimo/zk-passport/tree/main/examples)

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting) above
2. Review the [full integration documentation](./RARIMO_FRONTEND_INTEGRATION.md)
3. Check Rarimo Discord or GitHub issues
4. Review contract deployment and relayer logs

Happy building! 🚀
