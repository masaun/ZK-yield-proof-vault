// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {RegistrationSMTReplicator} from "./RegistrationSMTReplicator.sol";

/**
 * @title ZkKycWithRarimo
 * @notice ZK-KYC verification contract using Rarimo's ZK Passport system
 * @dev This contract enables verification of ZK Passport proofs on Mantle 
 * without disclosing sensitive user information
 */
contract ZkKycWithRarimo {
    /// @notice The RegistrationSMTReplicator contract instance
    RegistrationSMTReplicator public immutable replicator;

    /// @notice Mapping of verified user nullifiers to prevent double verification
    mapping(bytes32 => bool) public verifiedNullifiers;

    /// @notice Mapping of user addresses to their verification status
    mapping(address => bool) public isVerified;

    /// @notice Emitted when a user is successfully verified
    event UserVerified(address indexed user, bytes32 indexed nullifier, bytes32 root);

    /// @notice Error thrown when the registration root is invalid
    error InvalidRoot(bytes32 root);

    /// @notice Error thrown when a nullifier has already been used
    error NullifierAlreadyUsed(bytes32 nullifier);

    /// @notice Error thrown when ZK proof verification fails
    error InvalidProof();

    /**
     * @notice Constructor
     * @param replicator_ Address of the RegistrationSMTReplicator contract
     */
    constructor(address replicator_) {
        replicator = RegistrationSMTReplicator(replicator_);
    }

    /**
     * @notice Verifies a ZK Passport proof and registers the user
     * @dev The proof should contain:
     *      - registrationRoot: The root of the Registration SMT at the time of proof generation
     *      - nullifier: A unique identifier derived from the passport to prevent double verification
     *      - proof: The actual ZK proof data
     * @param registrationRoot The root of the Registration SMT used in the proof
     * @param nullifier The unique nullifier for this verification
     * @param proof The ZK proof data (format depends on the verifier used)
     */
    function verifyZkPassport(
        bytes32 registrationRoot,
        bytes32 nullifier,
        bytes calldata proof
    ) external {
        // Check if the registration root is valid
        if (!replicator.isRootValid(registrationRoot)) {
            revert InvalidRoot(registrationRoot);
        }

        // Check if the nullifier has already been used
        if (verifiedNullifiers[nullifier]) {
            revert NullifierAlreadyUsed(nullifier);
        }

        // Verify the ZK proof
        // NOTE: In a production environment, you would integrate with an actual ZK verifier contract
        // For now, this is a placeholder that demonstrates the flow
        bool isValid = _verifyProof(registrationRoot, nullifier, proof);
        if (!isValid) {
            revert InvalidProof();
        }

        // Mark the nullifier as used
        verifiedNullifiers[nullifier] = true;

        // Mark the user as verified
        isVerified[msg.sender] = true;

        emit UserVerified(msg.sender, nullifier, registrationRoot);
    }

    /**
     * @notice Checks if a user has been verified
     * @param user The address to check
     * @return bool True if the user is verified
     */
    function checkVerification(address user) external view returns (bool) {
        return isVerified[user];
    }

    /**
     * @notice Internal function to verify the ZK proof
     * @dev This is a placeholder. In production, integrate with actual Rarimo verifier contracts
     * @param registrationRoot The registration root used in the proof
     * @param nullifier The nullifier for this verification
     * @param proof The ZK proof data
     * @return bool True if the proof is valid
     */
    function _verifyProof(
        bytes32 registrationRoot,
        bytes32 nullifier,
        bytes calldata proof
    ) internal view virtual returns (bool) {
        // PLACEHOLDER IMPLEMENTATION
        // In production, you would:
        // 1. Parse the proof data
        // 2. Extract public signals
        // 3. Call the appropriate Rarimo verifier contract (e.g., QueryVerifier)
        // 4. Verify the proof matches the expected format and parameters
        
        // For demonstration purposes, we perform basic validation
        if (proof.length == 0) {
            return false;
        }

        // The actual verification would look something like:
        // IQueryVerifier verifier = IQueryVerifier(QUERY_VERIFIER_ADDRESS);
        // bytes32[] memory publicSignals = new bytes32[](PUBLIC_SIGNALS_COUNT);
        // publicSignals[10] = registrationRoot; // The 11th public signal (index 10)
        // return verifier.verify(proof, publicSignals);

        return true; // Placeholder - replace with actual verification
    }
}
