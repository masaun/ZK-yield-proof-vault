/**
 * ABI for ZkKycWithRarimo contract
 * This is the on-chain verification contract for ZK Passport using Rarimo
 */
export const ZK_KYC_WITH_RARIMO_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'replicator_', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'root', type: 'bytes32' }],
    name: 'InvalidRoot',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidProof',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'nullifier', type: 'bytes32' }],
    name: 'NullifierAlreadyUsed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'bytes32', name: 'nullifier', type: 'bytes32' },
      { indexed: false, internalType: 'bytes32', name: 'root', type: 'bytes32' },
    ],
    name: 'UserVerified',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'checkVerification',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'isVerified',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'replicator',
    outputs: [{ internalType: 'contract RegistrationSMTReplicator', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'verifiedNullifiers',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'registrationRoot', type: 'bytes32' },
      { internalType: 'bytes32', name: 'nullifier', type: 'bytes32' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'verifyZkPassport',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
