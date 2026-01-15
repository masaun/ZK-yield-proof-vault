use crate::libs::merkle_tree_manager::update_merkle_tree;
use poseidon::poseidon2;

#[test]
fn test_debug_merkle_root() {
    // Use the exact values from the browser console
    let user_address: Field = 0xd3BFFc0CD419344649deC61f08912a4Af283E1a6;
    let latest_user_balance: Field = 100000000;
    let latest_block_number: Field = 33467205;
    
    // Calculate leaf (same as in circuit)
    let inputs_for_leaf = [user_address, latest_user_balance, latest_block_number];
    let leaf = poseidon2::Poseidon2::hash(inputs_for_leaf, inputs_for_leaf.len());
    
    println(f"Leaf value: {leaf}");
    
    // Call update_merkle_tree with leaf as last_root (what we're doing in client)
    let computed_root = update_merkle_tree(leaf, leaf, []);
    
    println(f"Computed root from update_merkle_tree: {computed_root}");
    
    // Check if equal
    assert(computed_root == leaf, "Root should equal leaf for single entry");
}
