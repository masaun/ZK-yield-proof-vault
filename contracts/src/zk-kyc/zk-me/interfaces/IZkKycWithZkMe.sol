// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IZkKycWithZkMe
 * @notice Interface for ZkKycWithZkMe contract
 * @dev Use this interface to interact with the zkKYC verification system
 */
interface IZkKycWithZkMe {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event KYCVerified(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event KYCRevoked(address indexed user, uint256 timestamp);
    event SBTContractUpdated(address indexed oldAddress, address indexed newAddress);
    event VerifyContractUpdated(address indexed oldAddress, address indexed newAddress);
    event MinValidityPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event RequiredQuestionsUpdated(string[] questions);
    
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error InvalidAddress();
    error UserNotKYCVerified();
    error NoSBTFound();
    error KYCExpired();
    error InvalidValidityPeriod();
    error VerificationFailed();
    error AlreadyVerified();
    
    /*//////////////////////////////////////////////////////////////
                        EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Verifies a user's KYC status using zkMe Delegate
    /// @param user Address of the user to verify
    /// @return success True if verification is successful
    function verifyUserKYC(address user) external returns (bool success);
    
    /// @notice Revokes a user's KYC verification status
    /// @param user Address of the user whose verification should be revoked
    function revokeKYC(address user) external;
    
    /// @notice Checks if a user has valid KYC verification
    /// @param user Address of the user to check
    /// @return valid True if user has valid KYC
    function hasValidKYC(address user) external view returns (bool valid);
    
    /// @notice Re-verifies a user's KYC status
    /// @param user Address of the user to re-verify
    /// @return success True if re-verification is successful
    function reVerifyKYC(address user) external returns (bool success);
    
    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Updates the zkMe SBT contract address
    /// @param _newAddress New zkMe SBT contract address
    function updateSBTContract(address _newAddress) external;
    
    /// @notice Updates the zkMe Verify contract address
    /// @param _newAddress New zkMe Verify contract address
    function updateVerifyContract(address _newAddress) external;
    
    /// @notice Updates the minimum validity period for KYC credentials
    /// @param _newPeriod New minimum validity period in seconds
    function updateMinValidityPeriod(uint256 _newPeriod) external;
    
    /// @notice Sets the required verification questions/criteria
    /// @param _questions Array of question identifiers required for verification
    function setRequiredQuestions(string[] calldata _questions) external;
    
    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Gets the user's zkMe SBT token ID
    /// @param user Address of the user
    /// @return tokenId The user's token ID
    function getUserTokenId(address user) external view returns (uint256 tokenId);
    
    /// @notice Gets all required verification questions
    /// @return questions Array of required questions
    function getRequiredQuestions() external view returns (string[] memory questions);
    
    /// @notice Gets the zkMe contract addresses
    /// @return sbtContract Address of zkMe SBT contract
    /// @return verifyContract Address of zkMe Verify contract
    function getZkMeContracts() external view returns (
        address sbtContract,
        address verifyContract
    );
    
    /// @notice Returns the zkMe SBT contract address
    /// @return Address of zkMe SBT contract
    function zkMeSBTContract() external view returns (address);
    
    /// @notice Returns the zkMe Verify contract address
    /// @return Address of zkMe Verify contract
    function zkMeVerifyContract() external view returns (address);
    
    /// @notice Returns the minimum validity period
    /// @return Minimum validity period in seconds
    function minValidityPeriod() external view returns (uint256);
    
    /// @notice Checks if a user is KYC verified
    /// @param user Address to check
    /// @return True if user is verified
    function isKYCVerified(address user) external view returns (bool);
    
    /// @notice Gets the token ID for a verified user
    /// @param user Address to check
    /// @return Token ID (0 if not verified)
    function userTokenIds(address user) external view returns (uint256);
}
