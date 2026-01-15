use crate::{main, libs::merkle_tree_manager::update_merkle_tree};
use poseidon::poseidon2;

#[test]
fn test_with_actual_browser_values() {
    // Exact values from browser console
    let user_address: Field = 0xfdbffc0cd419344649dec61f08912a4af283e1a6; // @dev - Here is an example address - So, please replace with actual EVM address used in the frontend
    let latest_user_balance: u64 = 100000000;
    let latest_block_number: u64 = 33467205;
    let epoch_start: u64 = 33466581;
    let epoch_end: u64 = 33467205;
    let yield_rate: u64 = 1;
    let latest_user_yield: u64 = 62400000000;
    let latest_total_yield: u64 = 62400000000;
    let kyc_eligibility_flags: bool = true;
    
    // Calculate what the client calculated
    let inputs_for_leaf = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let client_leaf = poseidon2::Poseidon2::hash(inputs_for_leaf, inputs_for_leaf.len());
    
    println(f"Client calculated leaf: {client_leaf}");
    println(f"Expected hex: 0xada5f2711176d084216de8492df94ba49d6188062c89556f6b8f74f588ab2d5"); // @dev - This expected value should be replaced based on the actual EVM address of "user_address" above
    
    // What the client thinks the root should be
    let expected_latest_user_balance_root = client_leaf; // Single entry tree
    let last_user_balance_root = client_leaf;
    
    // What the client calculated for nullifier
    let inputs_for_nullifier = [user_address, latest_block_number as Field, client_leaf, expected_latest_user_balance_root];
    let client_nullifier = poseidon2::Poseidon2::hash(inputs_for_nullifier, inputs_for_nullifier.len());
    println(f"Client calculated nullifier: {client_nullifier}");
    
    // Now call the actual circuit function
    let (circuit_nullifier, circuit_root) = main(
        user_address,
        latest_user_balance,
        expected_latest_user_balance_root,
        last_user_balance_root,
        latest_block_number,
        kyc_eligibility_flags,
        latest_user_yield,
        yield_rate,
        epoch_start,
        epoch_end,
        latest_total_yield,
        client_nullifier
    );
    
    println(f"Circuit computed root: {circuit_root}");
    println(f"Circuit computed nullifier: {circuit_nullifier}");
}
