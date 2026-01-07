mod tests;
mod libs;

use poseidon::poseidon2;         // @dev - Poseidon Hash
//use std::hash::pedersen_hash;  // @dev - Pedersen Hash function

use libs::{
    merkle_tree_manager::{
        update_merkle_tree
    }
};

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

fn main(
    user_address: Field,
    latest_user_balance: u64,                     // @dev - New user balance to be inserted into the Merkle tree
    expected_latest_user_balance_root: pub Field, // @dev - Expected new Merkle root after update
    last_user_balance_root: Field,                // @dev - Merkle root of the user balance, which is measured in the last time.
    latest_block_number: pub u64,                 // @dev - Current block number
    
    //deposit_timestamps: u64,
    kyc_eligibility_flags: bool,       // @dev - zkMe credential proof (hash) or flag in boolean
    //optional_kyc_commitment: Field,  // @dev - Optional KYC commitment hash
    //merkle_inclusion_proof: Field,

    latest_user_yield: u64,
    yield_rate: pub u64,
    epoch_start: pub u64,              // @dev - block.number at the start of the epoch
    epoch_end: pub u64,                // @dev - block.number at the end of the epoch
    latest_total_yield: pub u64,
    expected_nullifier: pub Field

    //rwa_certificate: pub Field       // @dev - Hash of RWA certificate, which is signed by an trusted authority.
) -> pub (Field, Field) {
    // @dev - Hash
    let inputs_for_leaf = [user_address, latest_user_balance as Field, latest_block_number as Field]; // @dev - [TODO]: Add a salt value for better security
    let latest_user_balance_leaf = poseidon2::Poseidon2::hash(inputs_for_leaf, inputs_for_leaf.len());

    // @dev - Update the Merkle tree with the user's balance and retrieve the new Merkle root of the user balances as the return value
    let latest_user_balance_root = update_merkle_tree(latest_user_balance_leaf, last_user_balance_root, []);

    // @dev - Constraint: Correct merkle root of new user balance after update
    assert_eq(latest_user_balance_root, expected_latest_user_balance_root);

    // @dev - Constraint: Correct Yield Formula
    assert_eq(latest_user_yield, latest_user_balance * yield_rate * (epoch_end - epoch_start));

    // @dev - Constraint: Compliance Constraint (Optional)
    assert_eq(kyc_eligibility_flags, true);

    // @dev - Constraint: A single user's yield should not exceed the total yield of the Vault
    assert(latest_user_yield <= latest_total_yield);

    // @dev - Calculate a nullifier in order for each deposit to prevent double-spending
    let inputs_for_nullifier = [user_address, latest_block_number as Field, latest_user_balance_leaf, latest_user_balance_root];
    let nullifier = poseidon2::Poseidon2::hash(inputs_for_nullifier, inputs_for_nullifier.len());

    // @dev - Constraint: Correct nullifier
    assert_eq(nullifier, expected_nullifier);

    // @dev - Return value
    (nullifier, latest_user_balance_root)
}
