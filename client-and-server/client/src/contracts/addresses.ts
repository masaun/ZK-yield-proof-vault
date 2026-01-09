export const CONTRACT_ADDRESSES = {
  5000: {
    // Mantle Mainnet
    vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS_MAINNET as `0x${string}`,
    verifier: process.env.NEXT_PUBLIC_VERIFIER_ADDRESS_MAINNET as `0x${string}`,
  },
  5003: {
    // Mantle Sepolia Testnet
    vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS_TESTNET as `0x${string}`,
    verifier: process.env.NEXT_PUBLIC_VERIFIER_ADDRESS_TESTNET as `0x${string}`,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddresses(chainId: number) {
  if (chainId in CONTRACT_ADDRESSES) {
    return CONTRACT_ADDRESSES[chainId as SupportedChainId];
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}
