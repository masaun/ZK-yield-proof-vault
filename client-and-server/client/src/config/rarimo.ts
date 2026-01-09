// Rarimo ZK Passport Configuration
export const rarimoConfig = {
  // Rarimo L2 source SMT address
  sourceSMT: '0x479F84502Db545FA8d2275372E0582425204A879' as const,

  // Relayer API endpoints
  relayer: {
    mainnet: process.env.NEXT_PUBLIC_RELAYER_API_URL_MAINNET || 'http://localhost:8080',
    testnet: process.env.NEXT_PUBLIC_RELAYER_API_URL_TESTNET || 'http://localhost:8080',
  },

  // Deployed contract addresses
  contracts: {
    mainnet: {
      replicator: process.env.NEXT_PUBLIC_MAINNET_REGISTRATION_SMT_REPLICATOR_ADDRESS as `0x${string}` | undefined,
      zkKyc: process.env.NEXT_PUBLIC_MAINNET_ZK_KYC_RARIMO_ADDRESS as `0x${string}` | undefined,
    },
    testnet: {
      replicator: process.env.NEXT_PUBLIC_TESTNET_REGISTRATION_SMT_REPLICATOR_ADDRESS as `0x${string}` | undefined,
      zkKyc: process.env.NEXT_PUBLIC_TESTNET_ZK_KYC_RARIMO_ADDRESS as `0x${string}` | undefined,
    },
  },

  // Rarimo verificator service
  verificator: {
    url: process.env.NEXT_PUBLIC_RARIMO_VERIFICATOR_URL || 'https://api.verificator.rarimo.com',
  },
} as const;

export function getRarimoConfig(network: 'mainnet' | 'testnet') {
  const contracts = rarimoConfig.contracts[network];
  const relayerUrl = rarimoConfig.relayer[network];

  if (!contracts.replicator || !contracts.zkKyc) {
    throw new Error(`Rarimo contracts not configured for ${network}`);
  }

  return {
    replicatorAddress: contracts.replicator,
    zkKycAddress: contracts.zkKyc,
    relayerApiUrl: relayerUrl,
    verificatorUrl: rarimoConfig.verificator.url,
    sourceSMT: rarimoConfig.sourceSMT,
  };
}
