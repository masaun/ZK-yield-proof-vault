mod tests;
mod libs;

use std::hash::pedersen_hash;  // @dev - Pedersen Hash function
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
    // @dev - Private Inputs
    user_address: Field,
    user_yield: u64,
    user_balance: u64,
    deposit_timestamps: u64,
    kyc_eligibility_flags: bool,    // zkMe credential proof (hash) or flag in boolean
    optional_kyc_commitment: Field, // Optional KYC commitment hash
    merkle_inclusion_proof: Field,
    expected_leaf_hash: Field,
    // @dev - Public Inputs
    balance_root: pub u64,              // Merkle root of user balance
    yield_rate: pub u64,
    epoch_start: pub u64,
    epoch_end: pub u64,
    total_yield: pub u64
    // x: u64, 
    // y: pub u64
) -> pub (Field, Field) {
    // @dev - Update the Merkle tree with the user's balance and retrieve the new Merkle root as the return value
    let new_merkle_root = update_merkle_tree(user_balance as Field, balance_root as Field, []);

    // @dev - Constraint: Merkle Inclusion
    assert_eq(user_balance as Field, balance_root as Field);

    // @dev - Constraint: Correct Yield Formula
    assert_eq(user_yield, user_balance * yield_rate * (epoch_end - epoch_start));

    // @dev - Constraint: Compliance Constraint (Optional)
    assert_eq(kyc_eligibility_flags, true);

    // @dev - Constraint: Conservation of Yield
    assert(user_yield <= total_yield);

    // @dev - All user balances are inserted into a Merkle tree. Here is how a leaf is computed (TODO: Should do below on FE):
    let leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    assert_eq(leaf_hash, expected_leaf_hash);

    //assert(x != y);

    // @dev - [TODO]: Add the logic for calculating a nullifier in order for each deposit to prevent double-spending

    // @dev - Return value
    (leaf_hash, new_merkle_root)
}
