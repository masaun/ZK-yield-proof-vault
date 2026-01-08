/**
 * Merkle Tree Utilities for ZK Yield Proof Vault
 * 
 * These utilities help with:
 * - Building Merkle trees from user balances
 * - Generating Merkle proofs for individual users
 * - Verifying Merkle proofs
 */

export interface UserBalance {
  address: string;
  balance: bigint;
}

export interface MerkleProof {
  path: string[];
  index: number;
  root: string;
}

/**
 * Simple hash function (placeholder)
 * In production, use Poseidon or Pedersen hash for ZK-friendly hashing
 */
function hash(left: string, right: string): string {
  // This is a placeholder implementation
  // In production, replace with a proper ZK-friendly hash like Poseidon
  const combined = BigInt(left) + BigInt(right);
  return combined.toString();
}

/**
 * Build a Merkle tree from user balances
 */
export function buildMerkleTree(balances: UserBalance[]): {
  root: string;
  tree: string[][];
} {
  if (balances.length === 0) {
    throw new Error('Cannot build tree from empty balances');
  }

  // Ensure the number of leaves is a power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(balances.length)));
  const paddedBalances = [...balances];
  
  // Pad with zero balances if needed
  while (paddedBalances.length < nextPowerOf2) {
    paddedBalances.push({
      address: '0x0000000000000000000000000000000000000000',
      balance: 0n,
    });
  }

  // Create leaf nodes (hash of address + balance)
  const leaves = paddedBalances.map(b => {
    // In production, use proper hashing
    return (BigInt(b.address) + b.balance).toString();
  });

  // Build tree bottom-up
  const tree: string[][] = [leaves];
  let currentLevel = leaves;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1];
      const parent = hash(left, right);
      nextLevel.push(parent);
    }
    
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    tree,
  };
}

/**
 * Generate a Merkle proof for a specific user
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
  const { root, tree } = buildMerkleTree(balances);

  // Generate proof path
  const path: string[] = [];
  let index = userIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const isLeft = index % 2 === 0;
    const siblingIndex = isLeft ? index + 1 : index - 1;
    const sibling = tree[level][siblingIndex];
    
    path.push(sibling);
    index = Math.floor(index / 2);
  }

  return {
    path,
    index: userIndex,
    root,
  };
}

/**
 * Verify a Merkle proof
 */
export function verifyMerkleProof(
  leaf: string,
  proof: MerkleProof
): boolean {
  let current = leaf;
  const indexBits = proof.index.toString(2).padStart(proof.path.length, '0');

  for (let i = 0; i < proof.path.length; i++) {
    const sibling = proof.path[i];
    const isLeft = indexBits[proof.path.length - 1 - i] === '0';
    
    current = isLeft 
      ? hash(current, sibling)
      : hash(sibling, current);
  }

  return current === proof.root;
}

/**
 * Format Merkle proof for circuit input
 */
export function formatProofForCircuit(proof: MerkleProof): {
  path: string[];
  index: string;
} {
  return {
    path: proof.path,
    index: proof.index.toString(),
  };
}

/**
 * Example usage / helper for testing
 */
export function createTestMerkleTree(): {
  balances: UserBalance[];
  tree: ReturnType<typeof buildMerkleTree>;
} {
  const balances: UserBalance[] = [
    { address: '0x1111111111111111111111111111111111111111', balance: 1000n },
    { address: '0x2222222222222222222222222222222222222222', balance: 2000n },
    { address: '0x3333333333333333333333333333333333333333', balance: 3000n },
    { address: '0x4444444444444444444444444444444444444444', balance: 4000n },
  ];

  const tree = buildMerkleTree(balances);

  return { balances, tree };
}
