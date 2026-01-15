// Test script to understand how zk-kit calculates single-leaf Merkle root
const { buildPoseidon } = require('circomlibjs');

async function testMerkleRoot() {
  const poseidon = await buildPoseidon();
  
  // Test values from the circuit test
  const userAddress = BigInt('0x123456789');
  const balance = BigInt(1000);
  const blockNumber = BigInt(100);
  
  // Calculate leaf (same as circuit)
  const leaf = poseidon.F.toObject(poseidon([userAddress, balance, blockNumber]));
  console.log('Leaf:', '0x' + leaf.toString(16));
  
  // For a single-leaf Merkle tree, we need to understand the structure
  // The zk-kit MerkleTree likely hashes the leaf with padding/zeros
  // to create higher levels of the tree
  
  // Try hashing with zero (common pattern for sparse Merkle trees)
  const root1 = poseidon.F.toObject(poseidon([leaf, BigInt(0)]));
  console.log('Root (leaf, 0):', '0x' + root1.toString(16));
  
  const root2 = poseidon.F.toObject(poseidon([BigInt(0), leaf]));
  console.log('Root (0, leaf):', '0x' + root2.toString(16));
  
  // Try building up multiple levels (common for fixed-depth trees)
  let currentHash = leaf;
  for (let depth = 0; depth < 32; depth++) {
    currentHash = poseidon.F.toObject(poseidon([currentHash, BigInt(0)]));
    if (depth < 5) {
      console.log(`Level ${depth + 1}:`, '0x' + currentHash.toString(16));
    }
    if (currentHash.toString(16) === '1dd7c2e2eb5b4968f810393bc87e32251ce0c4b740a19cd6439acf71310b5205') {
      console.log(`MATCH at depth ${depth + 1}!`);
      break;
    }
  }
  
  // Expected root from circuit test
  console.log('Expected from circuit:', '0x1dd7c2e2eb5b4968f810393bc87e32251ce0c4b740a19cd6439acf71310b5205');
}

testMerkleRoot().catch(console.error);
