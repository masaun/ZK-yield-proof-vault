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
    new_user_balance: u64,                // @dev - New user balance to be inserted into the Merkle tree
    expected_new_balance_root: pub Field, // @dev - Expected new Merkle root after update
    current_balance_root: Field,          // @dev - Merkle root of the user balance, which is measured in the last time.
    current_block_number: pub u64,        // @dev - Current block number
    
    deposit_timestamps: u64,
    kyc_eligibility_flags: bool,    // zkMe credential proof (hash) or flag in boolean
    optional_kyc_commitment: Field, // Optional KYC commitment hash
    merkle_inclusion_proof: Field,

    new_user_yield: u64,
    yield_rate: pub u64,
    epoch_start: pub u64, // @dev - block.number at the start of the epoch
    epoch_end: pub u64,   // @dev - block.number at the end of the epoch
    total_yield: pub u64
) -> pub (Field, Field) {
    // @dev - Hash
    let inputs = [user_address, new_user_balance as Field, current_block_number as Field]; // @dev - [TODO]: Add a salt value for better security
    let new_balance_leaf = poseidon2::Poseidon2::hash(inputs, inputs.len());

    // @dev - Update the Merkle tree with the user's balance and retrieve the new Merkle root of the user balances as the return value
    let new_balance_root = update_merkle_tree(new_balance_leaf, current_balance_root, []);

    // @dev - Constraint: Correct merkle root of new user balance after update
    assert_eq(new_balance_root, expected_new_balance_root);

    // @dev - Constraint: Correct Yield Formula
    assert_eq(new_user_yield, new_user_balance * yield_rate * (epoch_end - epoch_start));

    // @dev - Constraint: Compliance Constraint (Optional)
    assert_eq(kyc_eligibility_flags, true);

    // @dev - Constraint: A single user's yield should not exceed the total yield of the Vault
    assert(new_user_yield <= total_yield);

    // @dev - Calculate a nullifier in order for each deposit to prevent double-spending
    let inputs_for_nullifier = [user_address, current_block_number as Field, new_balance_leaf, new_balance_root];
    let nullifier = poseidon2::Poseidon2::hash(inputs_for_nullifier, inputs_for_nullifier.len());

    // @dev - Return value
    (nullifier, new_balance_root)
}
