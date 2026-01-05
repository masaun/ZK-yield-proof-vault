use trees::merkle::MerkleTree; // @dev - Merkle Tree (https://github.com/zk-kit/zk-kit.noir/tree/main/packages/merkle-trees)
use trees::types::{MT_Creator, Modifier, MembershipProver};
use std::hash::pedersen_hash;

pub fn hasher(leaves: [Field; 2]) -> Field {
    pedersen_hash(leaves)
}

pub fn update_merkle_tree(entry: Field, merkle_root: Field, paths: [Field; 0]) -> Field {
//pub fn update_merkle_tree(entry: Field, merkle_root: Field, paths: [Field; 0]) -> MerkleTree<Field> {
    let mut mt = MerkleTree::new(hasher);
    println(f"Initial Merkle Tree: {mt}");

    // add at index 0
    mt.add(entry, 0, paths);
    println(f"Updated Merkle Tree: {mt}");

    // prove it is in the tree (kinda redundant isn't it?)
    mt.membership(entry, 0, paths);

    // @dev - Return the new Merkle Root
    mt.root

    // @dev - Return the new entire Merkle Tree
    //mt
}