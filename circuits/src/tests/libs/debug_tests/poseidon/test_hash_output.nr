use poseidon::poseidon;

#[test]
fn test_poseidon_with_actual_values() {
    // Actual values from the frontend logs
    let user_address: Field = 0xfdbffc0cd419344649dec61f08912a4af283e1a6; // @dev - Here is an example address - So, please replace with actual EVM address used in the frontend
    let latest_user_balance: u64 = 100000000;
    let latest_block_number: u64 = 33467205;
    
    // Calculate leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let leaf = poseidon::bn254::hash_3(inputs);
    
    println(f"User address: {user_address}");
    println(f"Balance: {latest_user_balance}");
    println(f"Block number: {latest_block_number}");
    println(f"Calculated leaf: {leaf}");
    
    // Expected from frontend: 4908957865095162607671371698865646900017838161946492755345315887226236351189  // @dev - This expected value should be replaced based on the actual EVM address of "user_address" above
    let expected_leaf: Field = 0xada5f2711176d084216de8492df94ba49d6188062c89556f6b8f74f588ab2d5;  // @dev - This expected value should be replaced based on the actual EVM address of "user_address" above
    println(f"Expected leaf:   {expected_leaf}");
    
    assert_eq(leaf, expected_leaf);
}
