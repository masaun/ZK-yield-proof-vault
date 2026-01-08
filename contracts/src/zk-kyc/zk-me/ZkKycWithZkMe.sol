// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZkKycWithZkMe
 * @author ZK-Yield-Proof-Vault Team
 * @notice This contract implements zkKYC verification using zkMe Delegate on Mantle Testnet
 * @dev Integrates with zkMe's decentralized identity verification system to verify users
 *      without disclosing sensitive personal information. Uses zkMe's Soul Bound Tokens (SBT)
 *      and Zero-Knowledge Proofs for privacy-preserving KYC compliance.
 * 
 * References:
 * - zkMe zkKYC: https://docs.zk.me/hub/what/zkkyc
 * - zkMe Smart Contracts: https://docs.zk.me/hub/how/modules/smart-contracts
 * - zkMe Delegate: https://docs.zk.me/hub/how/modules/smart-contracts#zkme-delegate
 * - zkMe GitHub: https://github.com/zkMeLabs/zkme-contracts
 */
contract ZkKycWithZkMe is Ownable {
    
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Address of the zkMe SBT contract (delegate copy on Mantle)
    /// @dev This is the zkMe Delegate contract address on Mantle Testnet
    address public zkMeSBTContract;
    
    /// @notice Address of the zkMe Verify contract
    /// @dev Used to verify user credentials and eligibility
    address public zkMeVerifyContract;
    
    /// @notice Mapping to track KYC verification status for users
    /// @dev Maps user address => verification status
    mapping(address => bool) public isKYCVerified;
    
    /// @notice Mapping to track user token IDs from zkMe SBT
    /// @dev Maps user address => zkMe SBT token ID
    mapping(address => uint256) public userTokenIds;
    
    /// @notice Minimum validity period for KYC credentials (in seconds)
    /// @dev Default: 30 days
    uint256 public minValidityPeriod;
    
    /// @notice Array of required verification questions/criteria
    /// @dev These are the eligibility criteria that users must satisfy
    string[] public requiredQuestions;
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emitted when a user's KYC verification is approved
    /// @param user Address of the verified user
    /// @param tokenId zkMe SBT token ID associated with the user
    /// @param timestamp Time of verification
    event KYCVerified(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    
    /// @notice Emitted when a user's KYC verification is revoked
    /// @param user Address of the user whose verification was revoked
    /// @param timestamp Time of revocation
    event KYCRevoked(address indexed user, uint256 timestamp);
    
    /// @notice Emitted when zkMe SBT contract address is updated
    /// @param oldAddress Previous contract address
    /// @param newAddress New contract address
    event SBTContractUpdated(address indexed oldAddress, address indexed newAddress);
    
    /// @notice Emitted when zkMe Verify contract address is updated
    /// @param oldAddress Previous contract address
    /// @param newAddress New contract address
    event VerifyContractUpdated(address indexed oldAddress, address indexed newAddress);
    
    /// @notice Emitted when minimum validity period is updated
    /// @param oldPeriod Previous period
    /// @param newPeriod New period
    event MinValidityPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    
    /// @notice Emitted when required questions are updated
    /// @param questions New array of required questions
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
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Initializes the ZkKycWithZkMe contract
     * @param _zkMeSBTContract Address of zkMe SBT Delegate contract on Mantle
     * @param _zkMeVerifyContract Address of zkMe Verify contract on Mantle
     */
    constructor(
        address _zkMeSBTContract,
        address _zkMeVerifyContract
    ) Ownable(msg.sender) {
        if (_zkMeSBTContract == address(0) || _zkMeVerifyContract == address(0)) {
            revert InvalidAddress();
        }
        
        zkMeSBTContract = _zkMeSBTContract;
        zkMeVerifyContract = _zkMeVerifyContract;
        minValidityPeriod = 30 days; // Default minimum validity
    }
    
    /*//////////////////////////////////////////////////////////////
                        EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Verifies a user's KYC status using zkMe Delegate
     * @dev Checks if user has valid zkMe SBT and meets verification criteria
     * @param user Address of the user to verify
     * @return success True if verification is successful
     */
    function verifyUserKYC(address user) external returns (bool success) {
        if (user == address(0)) revert InvalidAddress();
        if (isKYCVerified[user]) revert AlreadyVerified();
        
        // Check if user has zkMe SBT (delegate copy on Mantle)
        uint256 tokenId = _getUserTokenId(user);
        if (tokenId == 0) revert NoSBTFound();
        
        // Verify using zkMe Verify contract
        bool verified = _verifyWithZkMe(user);
        if (!verified) revert VerificationFailed();
        
        // Check KYC data validity
        if (!_checkKYCValidity(tokenId)) revert KYCExpired();
        
        // Update verification status
        isKYCVerified[user] = true;
        userTokenIds[user] = tokenId;
        
        emit KYCVerified(user, tokenId, block.timestamp);
        
        return true;
    }
    
    /**
     * @notice Revokes a user's KYC verification status
     * @dev Only callable by contract owner
     * @param user Address of the user whose verification should be revoked
     */
    function revokeKYC(address user) external onlyOwner {
        if (user == address(0)) revert InvalidAddress();
        if (!isKYCVerified[user]) revert UserNotKYCVerified();
        
        isKYCVerified[user] = false;
        delete userTokenIds[user];
        
        emit KYCRevoked(user, block.timestamp);
    }
    
    /**
     * @notice Checks if a user has valid KYC verification
     * @param user Address of the user to check
     * @return valid True if user has valid KYC
     */
    function hasValidKYC(address user) external view returns (bool valid) {
        if (!isKYCVerified[user]) return false;
        
        uint256 tokenId = userTokenIds[user];
        if (tokenId == 0) return false;
        
        // Check if KYC is still valid (not expired)
        return _checkKYCValidity(tokenId);
    }
    
    /**
     * @notice Re-verifies a user's KYC status (for expired or updated credentials)
     * @param user Address of the user to re-verify
     * @return success True if re-verification is successful
     */
    function reVerifyKYC(address user) external returns (bool success) {
        if (user == address(0)) revert InvalidAddress();
        
        // Reset current status
        isKYCVerified[user] = false;
        delete userTokenIds[user];
        
        // Get updated token ID
        uint256 tokenId = _getUserTokenId(user);
        if (tokenId == 0) revert NoSBTFound();
        
        // Verify with zkMe
        bool verified = _verifyWithZkMe(user);
        if (!verified) revert VerificationFailed();
        
        // Check validity
        if (!_checkKYCValidity(tokenId)) revert KYCExpired();
        
        // Update status
        isKYCVerified[user] = true;
        userTokenIds[user] = tokenId;
        
        emit KYCVerified(user, tokenId, block.timestamp);
        
        return true;
    }
    
    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Updates the zkMe SBT contract address
     * @param _newAddress New zkMe SBT contract address
     */
    function updateSBTContract(address _newAddress) external onlyOwner {
        if (_newAddress == address(0)) revert InvalidAddress();
        
        address oldAddress = zkMeSBTContract;
        zkMeSBTContract = _newAddress;
        
        emit SBTContractUpdated(oldAddress, _newAddress);
    }
    
    /**
     * @notice Updates the zkMe Verify contract address
     * @param _newAddress New zkMe Verify contract address
     */
    function updateVerifyContract(address _newAddress) external onlyOwner {
        if (_newAddress == address(0)) revert InvalidAddress();
        
        address oldAddress = zkMeVerifyContract;
        zkMeVerifyContract = _newAddress;
        
        emit VerifyContractUpdated(oldAddress, _newAddress);
    }
    
    /**
     * @notice Updates the minimum validity period for KYC credentials
     * @param _newPeriod New minimum validity period in seconds
     */
    function updateMinValidityPeriod(uint256 _newPeriod) external onlyOwner {
        if (_newPeriod == 0) revert InvalidValidityPeriod();
        
        uint256 oldPeriod = minValidityPeriod;
        minValidityPeriod = _newPeriod;
        
        emit MinValidityPeriodUpdated(oldPeriod, _newPeriod);
    }
    
    /**
     * @notice Sets the required verification questions/criteria
     * @param _questions Array of question identifiers required for verification
     */
    function setRequiredQuestions(string[] calldata _questions) external onlyOwner {
        delete requiredQuestions;
        
        for (uint256 i = 0; i < _questions.length; i++) {
            requiredQuestions.push(_questions[i]);
        }
        
        emit RequiredQuestionsUpdated(_questions);
    }
    
    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Gets the zkMe SBT token ID for a user
     * @dev Calls the zkMe SBT contract to retrieve the user's token ID
     * @param user Address of the user
     * @return tokenId The user's zkMe SBT token ID (0 if none)
     */
    function _getUserTokenId(address user) internal view returns (uint256 tokenId) {
        // Call zkMe SBT contract's tokenIdOf function
        (bool success, bytes memory data) = zkMeSBTContract.staticcall(
            abi.encodeWithSignature("tokenIdOf(address)", user)
        );
        
        if (success && data.length >= 32) {
            tokenId = abi.decode(data, (uint256));
        } else {
            tokenId = 0;
        }
    }
    
    /**
     * @notice Verifies user with zkMe Verify contract
     * @dev Calls the zkMe Verify contract to check if user meets verification criteria
     * @param user Address of the user to verify
     * @return verified True if user passes verification
     */
    function _verifyWithZkMe(address user) internal view returns (bool verified) {
        // Call zkMe Verify contract's verify function
        // The verify function checks if user's SBT meets the cooperator's requirements
        (bool success, bytes memory data) = zkMeVerifyContract.staticcall(
            abi.encodeWithSignature("verify(address,address)", address(this), user)
        );
        
        if (success && data.length >= 32) {
            verified = abi.decode(data, (bool));
        } else {
            verified = false;
        }
    }
    
    /**
     * @notice Checks if a user's KYC data is still valid
     * @dev Retrieves KYC data from zkMe SBT and checks expiration
     * @param tokenId The zkMe SBT token ID
     * @return valid True if KYC data is still valid
     */
    function _checkKYCValidity(uint256 tokenId) internal view returns (bool valid) {
        // Call zkMe SBT contract's getKycData function
        (bool success, bytes memory data) = zkMeSBTContract.staticcall(
            abi.encodeWithSignature("getKycData(uint256)", tokenId)
        );
        
        if (!success || data.length < 128) {
            return false;
        }
        
        // Decode the UserData struct
        // UserData structure: (string key, uint256 validity, string data, string[] questions)
        (, uint256 validity, ,) = abi.decode(data, (string, uint256, string, string[]));
        
        // Check if validity is in the future and meets minimum period
        if (validity <= block.timestamp) {
            return false;
        }
        
        // Check if remaining validity meets minimum period requirement
        uint256 remainingValidity = validity - block.timestamp;
        return remainingValidity >= minValidityPeriod;
    }
    
    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Gets the user's zkMe SBT token ID
     * @param user Address of the user
     * @return tokenId The user's token ID
     */
    function getUserTokenId(address user) external view returns (uint256 tokenId) {
        return userTokenIds[user];
    }
    
    /**
     * @notice Gets all required verification questions
     * @return questions Array of required questions
     */
    function getRequiredQuestions() external view returns (string[] memory questions) {
        return requiredQuestions;
    }
    
    /**
     * @notice Gets the zkMe contract addresses
     * @return sbtContract Address of zkMe SBT contract
     * @return verifyContract Address of zkMe Verify contract
     */
    function getZkMeContracts() external view returns (
        address sbtContract,
        address verifyContract
    ) {
        return (zkMeSBTContract, zkMeVerifyContract);
    }
}
