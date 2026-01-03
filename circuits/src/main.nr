mod tests;

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

fn main(
    // @dev - Private Inputs
    user_address: Field,
    user_yield: u64,
    user_balance: u64,
    deposit_timestamps: u64,
    kyc_eligibility_flags: bool,    // zkMe credential proof (hash) or flag in boolean
    optional_kyc_commitment: Field, // Optional KYC commitment hash
    merkle_inclusion_proof: Field,
    // @dev - Public Inputs
    balance_root: u64,              // Merkle root of user balance
    yield_rate: u64,
    epoch_start: u64,
    epoch_end: u64,
    total_yield: u64,
    expected_leaf_hash: Field
    // x: u64, 
    // y: pub u64
) {
    // @dev - Constraint: Merkle Inclusion
    assert(user_balance == balance_root);

    // @dev - Constraint: Correct Yield Formula
    assert(user_yield == user_balance * yield_rate * (epoch_end - epoch_start));

    // @dev - Constraint: Compliance Constraint (Optional)
    assert(kyc_eligibility_flags == true);

    // @dev - Constraint: Conservation of Yield
    assert(user_yield <= total_yield);

    // @dev - All user balances are inserted into a Merkle tree. Here is how a leaf is computed (TODO: Should do below on FE):
    let leaf_hash = pedersen_hash([user_address, user_balance as Field, optional_kyc_commitment]);
    assert(leaf_hash == expected_leaf_hash);

    //assert(x != y);
}
