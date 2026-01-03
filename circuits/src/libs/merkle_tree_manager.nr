use trees::merkle::MerkleTree; // @dev - Merkle Tree (https://github.com/zk-kit/zk-kit.noir/tree/main/packages/merkle-trees)
use trees::types::{MT_Creator, Modifier, MembershipProver};
use std::hash::pedersen_hash;

pub fn hasher(leaves: [Field; 2]) -> Field {
    pedersen_hash(leaves)
}

pub fn update_merkle_tree(entry: Field, merkle_root: Field, paths: [Field; 0]) {
    let mut mt = MerkleTree::new(hasher);

    // add at index 0
    mt.add(entry, 0, paths);

    // prove it is in the tree (kinda redundant isn't it?)
    mt.membership(entry, 0, paths);
}