import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a key pair for the relayer that will submit state updates
 * to the RegistrationSMTReplicator contract
 */
async function generateKeyPair() {
  console.log('Generating key pair for Rarimo relayer...\n');

  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();

  // Display the generated keys
  console.log('=== Generated Key Pair ===');
  console.log('Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);
  console.log('Mnemonic:', wallet.mnemonic?.phrase);
  console.log('========================\n');

  // Prepare environment variables
  const envContent = `
# Rarimo Relayer Configuration
# Generated on ${new Date().toISOString()}

# Oracle/Relayer Address
ORACLE_ADDRESS=${wallet.address}

# Oracle/Relayer Private Key (KEEP THIS SECRET!)
ORACLE_PRIVATE_KEY=${wallet.privateKey}

# Mnemonic (KEEP THIS SECRET!)
ORACLE_MNEMONIC="${wallet.mnemonic?.phrase}"

# Contract Addresses (will be filled after deployment)
NEXT_PUBLIC_REGISTRATION_SMT_REPLICATOR_ADDRESS=
NEXT_PUBLIC_ZK_KYC_RARIMO_ADDRESS=
`;

  // Save to .env.local in client directory
  const clientEnvPath = path.join(__dirname, '.env.local');
  
  // Check if file exists and ask for confirmation
  if (fs.existsSync(clientEnvPath)) {
    console.warn('⚠️  .env.local already exists!');
    console.warn('The new keys will be appended to the existing file.');
    console.warn('Please review and merge manually if needed.\n');
    
    fs.appendFileSync(clientEnvPath, `\n${envContent}`);
  } else {
    fs.writeFileSync(clientEnvPath, envContent);
  }

  console.log('✅ Keys saved to:', clientEnvPath);

  // Also create a keys.json file for reference
  const keysData = {
    generatedAt: new Date().toISOString(),
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase,
    warning: 'KEEP THIS FILE SECURE! Never commit it to version control.',
  };

  const keysJsonPath = path.join(__dirname, 'relayer-keys.json');
  fs.writeFileSync(keysJsonPath, JSON.stringify(keysData, null, 2));
  
  console.log('✅ Keys also saved to:', keysJsonPath);

  // Create .gitignore entry if it doesn't exist
  const gitignorePath = path.join(__dirname, '.gitignore');
  const gitignoreEntries = '\n# Rarimo Relayer Keys\nrelayer-keys.json\n.env.local\n';
  
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignoreContent.includes('relayer-keys.json')) {
      fs.appendFileSync(gitignorePath, gitignoreEntries);
      console.log('✅ Updated .gitignore to exclude keys');
    }
  } else {
    fs.writeFileSync(gitignorePath, gitignoreEntries);
    console.log('✅ Created .gitignore to exclude keys');
  }

  console.log('\n=== Next Steps ===');
  console.log('1. Save the private key and mnemonic in a secure location');
  console.log('2. Fund the oracle address with native tokens for gas fees');
  console.log('3. Use this address when deploying the RegistrationSMTReplicator contract');
  console.log('4. Set up the relayer service with these credentials');
  console.log('\n⚠️  SECURITY WARNING ⚠️');
  console.log('Never share your private key or mnemonic!');
  console.log('Never commit relayer-keys.json or .env.local to version control!');
}

// Run the script
generateKeyPair()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error generating key pair:', error);
    process.exit(1);
  });
