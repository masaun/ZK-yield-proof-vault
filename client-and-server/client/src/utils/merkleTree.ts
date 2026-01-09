/**
 * Merkle Tree Utilities for ZK Yield Proof Vault
 * Using ZK-Kit's LeanIMT for optimized, ZK-friendly Merkle tree operations
 * 
 * These utilities help with:
 * - Building Merkle trees from user balances
 * - Generating Merkle proofs for individual users
 * - Verifying Merkle proofs
 */

import { LeanIMT } from '@zk-kit/lean-imt';
import { poseidon2 } from 'poseidon-lite';

export interface UserBalance {
  address: string;
  balance: bigint;
}

export interface MerkleProof {
  siblings: bigint[];
  index: number;
  root: bigint;
  leaf: bigint;
}

/**
 * Hash user balance data using Poseidon
 * This is ZK-friendly and matches what the circuit expects
 */
export function hashUserBalance(address: string, balance: bigint): bigint {
  // Convert address to bigint
  const addressBigInt = BigInt(address);
  // Hash address and balance together using Poseidon
  return poseidon2([addressBigInt, balance]);
}

/**
 * Build a Lean Incremental Merkle Tree from user balances
 * LeanIMT is optimized for lightweight environments like browsers
 */
export function buildMerkleTree(balances: UserBalance[]): {
  tree: LeanIMT;
  root: bigint;
  leaves: bigint[];
} {
  if (balances.length === 0) {
    throw new Error('Cannot build tree from empty balances');
  }

  // Create leaf hashes
  const leaves = balances.map(b => hashUserBalance(b.address, b.balance));

  // Initialize LeanIMT with Poseidon hash
  const tree = new LeanIMT((a, b) => poseidon2([a, b]));

  // Insert all leaves
  for (const leaf of leaves) {
    tree.insert(leaf);
  }

  return {
    tree,
    root: tree.root,
    leaves,
  };
}

/**
 * Generate a Merkle proof for a specific user using LeanIMT
 */
export function generateMerkleProof(
  balances: UserBalance[],
  userAddress: string
): MerkleProof | null {
  // Find user index
  const userIndex = balances.findIndex(
    b => b.address.toLowerCase() === userAddress.toLowerCase()
  );

  if (userIndex === -1) {
    return null;
  }

  // Build tree
  const { tree, root, leaves } = buildMerkleTree(balances);

  // Get the leaf for this user
  const leaf = leaves[userIndex];

  // Generate proof
  const { siblings, index } = tree.generateProof(userIndex);

  return {
    siblings,
    index,
    root,
    leaf,
  };
}

/**
 * Verify a Merkle proof using LeanIMT
 */
export function verifyMerkleProof(proof: MerkleProof): boolean {
  try {
    return LeanIMT.verifyProof(
      {
        siblings: proof.siblings,
        index: proof.index,
        root: proof.root,
        leaf: proof.leaf,
      },
      (a, b) => poseidon2([a, b])
    );
  } catch (error) {
    console.error('Error verifying Merkle proof:', error);
    return false;
  }
}

/**
 * Format Merkle proof for circuit input
 */
export function formatProofForCircuit(proof: MerkleProof): {
  path: string[];
  index: string;
  leaf: string;
  root: string;
} {
  return {
    path: proof.siblings.map(s => s.toString()),
    index: proof.index.toString(),
    leaf: proof.leaf.toString(),
    root: proof.root.toString(),
  };
}

/**
 * Convert hex address to field element (for Poseidon hashing)
 */
export function addressToField(address: string): bigint {
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return BigInt('0x' + cleanAddress);
}

/**
 * Generate Merkle root from user balances
 */
export function generateMerkleRoot(balances: UserBalance[]): bigint {
  const { root } = buildMerkleTree(balances);
  return root;
}

/**
 * Example usage / helper for testing
 */
export function createTestMerkleTree(): {
  balances: UserBalance[];
  tree: LeanIMT;
  root: bigint;
  leaves: bigint[];
} {
  const balances: UserBalance[] = [
    { address: '0x1111111111111111111111111111111111111111', balance: 1000n },
    { address: '0x2222222222222222222222222222222222222222', balance: 2000n },
    { address: '0x3333333333333333333333333333333333333333', balance: 3000n },
    { address: '0x4444444444444444444444444444444444444444', balance: 4000n },
  ];

  const result = buildMerkleTree(balances);

  return { balances, ...result };
}

/**
 * Batch generate proofs for multiple users
 */
export function batchGenerateProofs(
  balances: UserBalance[],
  userAddresses: string[]
): Map<string, MerkleProof | null> {
  const proofs = new Map<string, MerkleProof | null>();

  for (const address of userAddresses) {
    const proof = generateMerkleProof(balances, address);
    proofs.set(address.toLowerCase(), proof);
  }

  return proofs;
}
