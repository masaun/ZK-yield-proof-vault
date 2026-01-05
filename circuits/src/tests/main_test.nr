use crate::main;
use std::hash::pedersen_hash;

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
    let user_balance: u64 = 1000;
    let yield_rate: u64 = 5; // 5% yield rate
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100; // 100 time units
    let user_yield: u64 = user_balance * yield_rate * (epoch_end - epoch_start); // 500000
    let deposit_timestamps: u64 = 0;
    let kyc_eligibility_flags: bool = true;
    let optional_kyc_commitment: Field = 0x987654321;
    let merkle_inclusion_proof: Field = 0;
    
    // @dev - Calculate expected leaf hash
    let expected_leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    
    // @dev - Public inputs
    let balance_root: u64 = user_balance; // Simplified for test
    let total_yield: u64 = user_yield + 1000; // Total yield should be >= user_yield
    

    // @dev - Call the main() function
    let (leaf_hash, new_merkle_root) = main(
        user_address,
        user_yield,
        user_balance,
        deposit_timestamps,
        kyc_eligibility_flags,
        optional_kyc_commitment,
        merkle_inclusion_proof,
        expected_leaf_hash,
        balance_root,
        yield_rate,
        epoch_start,
        epoch_end,
        total_yield
    );
    
    // @dev - Retrieve a new Merkle root, which is emitted from the ZK circuit as a "public output"
    println(f"new Merkle root: {new_merkle_root}");

    // Verify outputs
    assert_eq(leaf_hash, expected_leaf_hash);
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
    let user_balance: u64 = 500;
    let yield_rate: u64 = 10;
    let epoch_start: u64 = 50;
    let epoch_end: u64 = 50; // Same as start, so no time elapsed
    let user_yield: u64 = 0; // No yield
    let deposit_timestamps: u64 = 50;
    let kyc_eligibility_flags: bool = true;
    let optional_kyc_commitment: Field = 0xABCDEF;
    let merkle_inclusion_proof: Field = 0;
    
    let expected_leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    
    let balance_root: u64 = user_balance;
    let total_yield: u64 = 0;
    
    let (leaf_hash, new_merkle_root) = main(
        user_address,
        user_yield,
        user_balance,
        deposit_timestamps,
        kyc_eligibility_flags,
        optional_kyc_commitment,
        merkle_inclusion_proof,
        expected_leaf_hash,
        balance_root,
        yield_rate,
        epoch_start,
        epoch_end,
        total_yield
    );
    
    assert_eq(leaf_hash, expected_leaf_hash);
    assert(new_merkle_root != 0);
}

/**
 * @notice - Tests when user yield equals total yield
 */
#[test]
fn test_main_max_yield_conservation() {
    // @dev - Test edge case where user_yield equals total_yield
    let user_address: Field = 0x222222222;
    let user_balance: u64 = 2000;
    let yield_rate: u64 = 3;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 50;
    let user_yield: u64 = user_balance * yield_rate * (epoch_end - epoch_start); // 300000
    let deposit_timestamps: u64 = 0;
    let kyc_eligibility_flags: bool = true;
    let optional_kyc_commitment: Field = 0xDEADBEEF;
    let merkle_inclusion_proof: Field = 0;
    
    let expected_leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    
    let balance_root: u64 = user_balance;
    let total_yield: u64 = user_yield; // Exactly equal
    
    let (leaf_hash, new_merkle_root) = main(
        user_address,
        user_yield,
        user_balance,
        deposit_timestamps,
        kyc_eligibility_flags,
        optional_kyc_commitment,
        merkle_inclusion_proof,
        expected_leaf_hash,
        balance_root,
        yield_rate,
        epoch_start,
        epoch_end,
        total_yield
    );
    
    assert_eq(leaf_hash, expected_leaf_hash);
    assert(new_merkle_root != 0);
}

/**
 * @notice - Tests failure when KYC eligibility is false
 */
#[test(should_fail)]
fn test_main_fails_kyc_not_eligible() {
    // @dev - Test should fail when KYC eligibility is false
    let user_address: Field = 0x333333333;
    let user_balance: u64 = 1500;
    let yield_rate: u64 = 4;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100;
    let user_yield: u64 = user_balance * yield_rate * (epoch_end - epoch_start);
    let deposit_timestamps: u64 = 0;
    let kyc_eligibility_flags: bool = false; // KYC not eligible
    let optional_kyc_commitment: Field = 0x12345;
    let merkle_inclusion_proof: Field = 0;
    
    let expected_leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    
    let balance_root: u64 = user_balance;
    let total_yield: u64 = user_yield + 1000;
    
    // This should fail due to KYC constraint
    let (_leaf_hash, _new_merkle_root) = main(
        user_address,
        user_yield,
        user_balance,
        deposit_timestamps,
        kyc_eligibility_flags,
        optional_kyc_commitment,
        merkle_inclusion_proof,
        expected_leaf_hash,
        balance_root,
        yield_rate,
        epoch_start,
        epoch_end,
        total_yield
    );
}

/**
 * @notice - Tests failure when user yield exceeds total yield
 */
#[test(should_fail)]
fn test_main_fails_yield_exceeds_total() {
    // @dev - Test should fail when user_yield > total_yield
    let user_address: Field = 0x444444444;
    let user_balance: u64 = 3000;
    let yield_rate: u64 = 10;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100;
    let user_yield: u64 = user_balance * yield_rate * (epoch_end - epoch_start);
    let deposit_timestamps: u64 = 0;
    let kyc_eligibility_flags: bool = true;
    let optional_kyc_commitment: Field = 0x54321;
    let merkle_inclusion_proof: Field = 0;
    
    let expected_leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    
    let balance_root: u64 = user_balance;
    let total_yield: u64 = user_yield - 1; // Total yield less than user yield
    
    // This should fail due to conservation constraint
    let (_leaf_hash, _new_merkle_root) = main(
        user_address,
        user_yield,
        user_balance,
        deposit_timestamps,
        kyc_eligibility_flags,
        optional_kyc_commitment,
        merkle_inclusion_proof,
        expected_leaf_hash,
        balance_root,
        yield_rate,
        epoch_start,
        epoch_end,
        total_yield
    );
}

/**
 * @notice - Tests failure when yield calculation is incorrect
 */
#[test(should_fail)]
fn test_main_fails_incorrect_yield_calculation() {
    // @dev - Test should fail when yield calculation is incorrect
    let user_address: Field = 0x555555555;
    let user_balance: u64 = 1000;
    let yield_rate: u64 = 5;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 100;
    let user_yield: u64 = 12345; // Incorrect yield (should be 500000)
    let deposit_timestamps: u64 = 0;
    let kyc_eligibility_flags: bool = true;
    let optional_kyc_commitment: Field = 0x67890;
    let merkle_inclusion_proof: Field = 0;
    
    let expected_leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    
    let balance_root: u64 = user_balance;
    let total_yield: u64 = 1000000;
    
    // This should fail due to incorrect yield formula
    let (_leaf_hash, _new_merkle_root) = main(
        user_address,
        user_yield,
        user_balance,
        deposit_timestamps,
        kyc_eligibility_flags,
        optional_kyc_commitment,
        merkle_inclusion_proof,
        expected_leaf_hash,
        balance_root,
        yield_rate,
        epoch_start,
        epoch_end,
        total_yield
    );
}

/**
 * @notice - Tests failure when expected leaf hash doesn't match
 */
#[test(should_fail)]
fn test_main_fails_wrong_leaf_hash() {
    // @dev - Test should fail when expected leaf hash doesn't match
    let user_address: Field = 0x666666666;
    let user_balance: u64 = 750;
    let yield_rate: u64 = 8;
    let epoch_start: u64 = 0;
    let epoch_end: u64 = 50;
    let user_yield: u64 = user_balance * yield_rate * (epoch_end - epoch_start);
    let deposit_timestamps: u64 = 0;
    let kyc_eligibility_flags: bool = true;
    let optional_kyc_commitment: Field = 0x99999;
    let merkle_inclusion_proof: Field = 0;
    
    let expected_leaf_hash: Field = 0x1234567890; // Wrong hash
    
    let balance_root: u64 = user_balance;
    let total_yield: u64 = user_yield + 500;
    
    // This should fail due to leaf hash mismatch
    let (_leaf_hash, _new_merkle_root) = main(
        user_address,
        user_yield,
        user_balance,
        deposit_timestamps,
        kyc_eligibility_flags,
        optional_kyc_commitment,
        merkle_inclusion_proof,
        expected_leaf_hash,
        balance_root,
        yield_rate,
        epoch_start,
        epoch_end,
        total_yield
    );
}