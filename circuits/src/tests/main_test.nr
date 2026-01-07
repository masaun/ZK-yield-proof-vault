use crate::{
    main,
    libs::{
        merkle_tree_manager::{
            update_merkle_tree
        }
    }
};
use poseidon::poseidon2;         // @dev - Poseidon Hash
//use std::hash::pedersen_hash;  // @dev - Pedersen Hash function


// Private Inputs
// - User balances
// - Deposit timestamps
// - KYC eligibility flags (or credential hashes)
// - Merkle inclusion proofs

// Public Inputs
// - balanceRoot
// - yieldRate or yield formula parameters
// - epochStart, epochEnd
// - totalYield


/**
 * @notice - Tests a valid yield proof scenario
 */
#[test]
fn test_main_valid_yield_proof() {
    // @dev - Setup test data
    let user_address: Field = 0x123456789;
    let latest_user_balance: u64 = 1000;
    let yield_rate: u64 = 5; // 5% yield rate
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100; // 100 time units
    let latest_user_yield: u64 = latest_user_balance * yield_rate * (epoch_end - epoch_start); // 500000
    let latest_block_number: u64 = 100;
    let kyc_eligibility_flags: bool = true;
    
    // @dev - Calculate expected leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());
    
    // @dev - Public inputs
    let last_user_balance_root: Field = 0x1234; // Simplified for test
    let latest_total_yield: u64 = latest_user_yield + 1000; // Total yield should be >= user_yield
    
    // @dev - Calculate an expected merkle root of the latest user balance
    let expected_latest_user_balance_root = update_merkle_tree(latest_user_balance_leaf, last_user_balance_root, []);
    
    let inputs_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, expected_latest_user_balance_root];
    let expected_nullifier = poseidon2::Poseidon2::hash(inputs_nullifier, inputs_nullifier.len());

    // @dev - Call the main() function
    let (nullifier, new_merkle_root) = main(
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
        expected_nullifier
    );
    
    // @dev - Retrieve a new Merkle root, which is emitted from the ZK circuit as a "public output"
    println(f"new Merkle root: {new_merkle_root}");

    // Verify outputs
    assert_eq(nullifier, expected_nullifier);
    assert_eq(new_merkle_root, expected_latest_user_balance_root);
    // new_merkle_root should be non-zero
    assert(new_merkle_root != 0);
}

/**
 * @notice - Tests edge case with no time elapsed
 */
#[test]
fn test_main_with_zero_yield() {
    // @dev - Test case where no yield is generated (epoch_start == epoch_end)
    let user_address: Field = 0x111111111;
    let latest_user_balance: u64 = 500;
    let yield_rate: u64 = 10;
    let epoch_start: u64 = 50;
    let epoch_end: u64 = 50; // Same as start, so no time elapsed
    let latest_user_yield: u64 = 0; // No yield
    let latest_block_number: u64 = 50;
    let kyc_eligibility_flags: bool = true;
    
    // @dev - Calculate expected leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());
    
    let last_user_balance_root: Field = 0x1234; // Simplified for test
    let latest_total_yield: u64 = 0;
    
    // @dev - Calculate an expected merkle root of the latest user balance
    let expected_latest_user_balance_root = update_merkle_tree(latest_user_balance_leaf, last_user_balance_root, []);
  
    let inputs_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, expected_latest_user_balance_root];
    let expected_nullifier = poseidon2::Poseidon2::hash(inputs_nullifier, inputs_nullifier.len());
    
    let (nullifier, new_merkle_root) = main(
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
        expected_nullifier
    );
    
    assert_eq(nullifier, expected_nullifier);
    assert_eq(new_merkle_root, expected_latest_user_balance_root);
    assert(new_merkle_root != 0);
}

/**
 * @notice - Tests when user yield equals total yield
 */
#[test]
fn test_main_max_yield_conservation() {
    // @dev - Test edge case where latest_user_yield equals latest_total_yield
    let user_address: Field = 0x222222222;
    let latest_user_balance: u64 = 2000;
    let yield_rate: u64 = 3;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 50;
    let latest_user_yield: u64 = latest_user_balance * yield_rate * (epoch_end - epoch_start); // 300000
    let latest_block_number: u64 = 50;
    let kyc_eligibility_flags: bool = true;
    
    // @dev - Calculate expected leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());
    
    let last_user_balance_root: Field = 0x1234; // Simplified for test
    let latest_total_yield: u64 = latest_user_yield; // Exactly equal
    
    // @dev - Calculate an expected merkle root of the latest user balance
    let expected_latest_user_balance_root = update_merkle_tree(latest_user_balance_leaf, last_user_balance_root, []);

    let inputs_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, expected_latest_user_balance_root];
    let expected_nullifier = poseidon2::Poseidon2::hash(inputs_nullifier, inputs_nullifier.len());
    
    let (nullifier, new_merkle_root) = main(
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
        expected_nullifier
    );
    
    assert_eq(nullifier, expected_nullifier);
    assert_eq(new_merkle_root, expected_latest_user_balance_root);
    assert(new_merkle_root != 0);
}

/**
 * @notice - Tests failure when KYC eligibility is false
 */
#[test(should_fail)]
fn test_main_fails_kyc_not_eligible() {
    // @dev - Test should fail when KYC eligibility is false
    let user_address: Field = 0x333333333;
    let latest_user_balance: u64 = 1500;
    let yield_rate: u64 = 4;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100;
    let latest_user_yield: u64 = latest_user_balance * yield_rate * (epoch_end - epoch_start);
    let latest_block_number: u64 = 100;
    let kyc_eligibility_flags: bool = false; // KYC not eligible
    
    // @dev - Calculate expected leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());
    
    let last_user_balance_root: Field = 0x1234; // Simplified for test
    let latest_total_yield: u64 = latest_user_yield + 1000;
    
    // @dev - Calculate an expected merkle root of the latest user balance
    let expected_latest_user_balance_root = update_merkle_tree(latest_user_balance_leaf, last_user_balance_root, []);
  
    let inputs_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, expected_latest_user_balance_root];
    let expected_nullifier = poseidon2::Poseidon2::hash(inputs_nullifier, inputs_nullifier.len());
    
    // This should fail due to KYC constraint
    let (_nullifier, _new_merkle_root) = main(
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
        expected_nullifier
    );
}

/**
 * @notice - Tests failure when user yield exceeds total yield
 */
#[test(should_fail)]
fn test_main_fails_yield_exceeds_total() {
    // @dev - Test should fail when latest_user_yield > latest_total_yield
    let user_address: Field = 0x444444444;
    let latest_user_balance: u64 = 3000;
    let yield_rate: u64 = 10;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100;
    let latest_user_yield: u64 = latest_user_balance * yield_rate * (epoch_end - epoch_start);
    let latest_block_number: u64 = 100;
    let kyc_eligibility_flags: bool = true;
    
    // @dev - Calculate expected leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());
    
    let last_user_balance_root: Field = 0x1234; // Simplified for test
    let latest_total_yield: u64 = latest_user_yield - 1; // Total yield less than user yield

    // @dev - Calculate an expected merkle root of the latest user balance
    let expected_latest_user_balance_root = update_merkle_tree(latest_user_balance_leaf, last_user_balance_root, []);
    
    let inputs_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, expected_latest_user_balance_root];
    let expected_nullifier = poseidon2::Poseidon2::hash(inputs_nullifier, inputs_nullifier.len());
    
    // This should fail due to conservation constraint
    let (_nullifier, _new_merkle_root) = main(
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
        expected_nullifier
    );
}

/**
 * @notice - Tests failure when yield calculation is incorrect
 */
#[test(should_fail)]
fn test_main_fails_incorrect_yield_calculation() {
    // @dev - Test should fail when yield calculation is incorrect
    let user_address: Field = 0x555555555;
    let latest_user_balance: u64 = 1000;
    let yield_rate: u64 = 5;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100;
    let latest_user_yield: u64 = 12345; // Incorrect yield (should be 500000)
    let latest_block_number: u64 = 100;
    let kyc_eligibility_flags: bool = true;
    
    // @dev - Calculate expected leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());
    
    let last_user_balance_root: Field = 0x1234; // Simplified for test
    let latest_total_yield: u64 = 1000000;
    
    // @dev - Calculate an expected merkle root of the latest user balance
    let expected_latest_user_balance_root = update_merkle_tree(latest_user_balance_leaf, last_user_balance_root, []);
    
    let inputs_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, expected_latest_user_balance_root];
    let expected_nullifier = poseidon2::Poseidon2::hash(inputs_nullifier, inputs_nullifier.len());
    
    // This should fail due to incorrect yield formula
    let (_nullifier, _new_merkle_root) = main(
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
        expected_nullifier
    );
}

/**
 * @notice - Tests failure when expected merkle root doesn't match
 */
#[test(should_fail)]
fn test_main_fails_wrong_merkle_root() {
    // @dev - Test should fail when expected merkle root doesn't match
    let user_address: Field = 0x666666666;
    let latest_user_balance: u64 = 750;
    let yield_rate: u64 = 8;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 50;
    let latest_user_yield: u64 = latest_user_balance * yield_rate * (epoch_end - epoch_start);
    let latest_block_number: u64 = 50;
    let kyc_eligibility_flags: bool = true;
    
    // @dev - Calculate expected leaf hash
    let inputs = [user_address, latest_user_balance as Field, latest_block_number as Field];
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());
    
    let last_user_balance_root: Field = 0x1234; // Simplified for test
    let latest_total_yield: u64 = latest_user_yield + 500;
    
    let expected_latest_user_balance_root: Field = 0x1234567890; // Wrong merkle root
    
    let inputs_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, expected_latest_user_balance_root];
    let expected_nullifier = poseidon2::Poseidon2::hash(inputs_nullifier, inputs_nullifier.len());
    
    // This should fail due to merkle root mismatch
    let (_nullifier, _new_merkle_root) = main(
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
        expected_nullifier
    );
}