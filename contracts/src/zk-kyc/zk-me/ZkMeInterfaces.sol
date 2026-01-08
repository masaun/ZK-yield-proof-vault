// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IZKMEContracts
 * @notice Interfaces for zkMe smart contracts
 * @dev These interfaces are based on zkMe's deployed contracts
 * Reference: https://github.com/zkMeLabs/zkme-contracts
 */

/**
 * @notice Interface for zkMe SBT (Soul Bound Token) contract
 * @dev This represents the zkMe Delegate contract deployed on Mantle Testnet
 */
interface IZKMESBT {
    
    /// @notice Emitted when a new SBT is minted
    event Attest(address indexed to, uint256 indexed tokenId);
    
    /// @notice Emitted when an SBT is revoked
    event Revoke(address indexed from, uint256 indexed tokenId);
    
    /// @notice Emitted when an SBT is burned
    event Burn(address indexed from, uint256 indexed tokenId);
    
    /// @notice Gets the token ID for a user's SBT
    /// @param from Address of the user
    /// @return tokenId The user's SBT token ID (reverts if none)
    function tokenIdOf(address from) external view returns (uint256 tokenId);
    
    /// @notice Gets the owner of a specific SBT
    /// @param tokenId The SBT token ID
    /// @return owner Address of the token owner
    function ownerOf(uint256 tokenId) external view returns (address owner);
    
    /// @notice Checks if a user has an SBT
    /// @param owner Address to check
    /// @return balance 1 if user has SBT, 0 otherwise
    function balanceOf(address owner) external view returns (uint256 balance);
    
    /// @notice Checks if a user's SBT balance passes (exists)
    /// @param owner Address to check
    /// @return pass 1 if SBT exists, 0 otherwise
    function isBalancePass(address owner) external view returns (uint256 pass);
    
    /// @notice Gets the KYC data for a token ID
    /// @param tokenId The SBT token ID
    /// @return userData The user's KYC data
    function getKycData(uint256 tokenId) external view returns (UserData memory userData);
    
    /// @notice Total supply of SBTs
    /// @return total Total number of SBTs minted
    function totalSupply() external view returns (uint256 total);
}

/**
 * @notice Interface for zkMe Verify contract
 * @dev Used to verify user eligibility based on credential requirements
 */
interface IZKMEVerify {
    
    /// @notice Emitted when a role is granted
    event Grant(address indexed to, uint256 indexed grantType);
    
    /// @notice Emitted when a user approves their SBT to a cooperator
    event Approve(address indexed to, uint256 indexed tokenId);
    
    /// @notice Emitted when approval is revoked
    event Revoke(address indexed from, uint256 indexed tokenId);
    
    /// @notice Verifies if a user meets the cooperator's requirements
    /// @param cooperator Address of the cooperating dApp/service
    /// @param user Address of the user to verify
    /// @return verified True if user meets requirements
    function verify(address cooperator, address user) external view returns (bool verified);
    
    /// @notice Checks if a user has approved their credentials to a cooperator
    /// @param cooperator Address of the cooperating dApp/service
    /// @param user Address of the user
    /// @return approved True if user has approved
    function hasApproved(address cooperator, address user) external view returns (bool approved);
    
    /// @notice Gets the user's token ID if approved to cooperator
    /// @param user Address of the user
    /// @return tokenId The approved token ID (0 if not approved)
    function getUserTokenId(address user) external view returns (uint256 tokenId);
    
    /// @notice Gets the user's KYC data if approved
    /// @param user Address of the user
    /// @return userData The user's KYC data
    function getUserData(address user) external view returns (UserData memory userData);
    
    /// @notice Approves user's SBT to a cooperator
    /// @param cooperator Address of the cooperating dApp/service
    /// @param tokenId User's SBT token ID
    /// @param cooperatorThresholdKey Threshold key for the cooperator
    function approve(
        address cooperator,
        uint256 tokenId,
        string memory cooperatorThresholdKey
    ) external;
    
    /// @notice Checks if address is an operator
    /// @param account Address to check
    /// @return isOp True if account is operator
    function isOperator(address account) external view returns (bool isOp);
    
    /// @notice Checks if address is a cooperator
    /// @param account Address to check
    /// @return isCoop True if account is cooperator
    function isCooperator(address account) external view returns (bool isCoop);
}

/**
 * @notice Interface for zkMe Configuration contract
 * @dev Used to set and retrieve cooperator requirements
 */
interface IZKMEConf {
    
    /// @notice Emitted when an operator is granted
    event Grant(address indexed to, uint256 indexed grantType);
    
    /// @notice Emitted when questions are set
    event SetQuestion(address indexed to);
    
    /// @notice Gets the verification questions for a cooperator
    /// @param cooperator Address of the cooperating dApp/service
    /// @return questions Array of question identifiers
    function getQuestions(address cooperator) external view returns (string[] memory questions);
    
    /// @notice Sets verification questions for a cooperator
    /// @param cooperator Address of the cooperating dApp/service
    /// @param questions Array of question identifiers
    function setQuestions(address cooperator, string[] memory questions) external;
    
    /// @notice Checks if address is an operator
    /// @param account Address to check
    /// @return isOp True if account is operator
    function isOperator(address account) external view returns (bool isOp);
}

/**
 * @notice KYC Data structure used by zkMe contracts
 */
struct UserData {
    string key;              // Encryption key for user data
    uint256 validity;        // Expiration timestamp
    string data;            // Encrypted credential data
    string[] questions;     // Verification questions answered
}

/**
 * @title ZkMeHelper
 * @notice Helper library for interacting with zkMe contracts
 * @dev Provides convenient wrapper functions for common zkMe operations
 */
library ZkMeHelper {
    
    /**
     * @notice Checks if a user has a valid, non-expired zkMe SBT
     * @param sbtContract Address of zkMe SBT contract
     * @param user Address of the user
     * @return hasValid True if user has valid SBT
     */
    function hasValidSBT(address sbtContract, address user) internal view returns (bool hasValid) {
        try IZKMESBT(sbtContract).isBalancePass(user) returns (uint256 balance) {
            return balance > 0;
        } catch {
            return false;
        }
    }
    
    /**
     * @notice Gets user's SBT token ID safely
     * @param sbtContract Address of zkMe SBT contract
     * @param user Address of the user
     * @return tokenId The user's token ID (0 if none)
     */
    function getSafeTokenId(address sbtContract, address user) internal view returns (uint256 tokenId) {
        try IZKMESBT(sbtContract).tokenIdOf(user) returns (uint256 id) {
            return id;
        } catch {
            return 0;
        }
    }
    
    /**
     * @notice Checks if KYC data is still valid (not expired)
     * @param sbtContract Address of zkMe SBT contract
     * @param tokenId The SBT token ID
     * @return isValid True if KYC data is valid
     */
    function isKYCDataValid(address sbtContract, uint256 tokenId) internal view returns (bool isValid) {
        try IZKMESBT(sbtContract).getKycData(tokenId) returns (UserData memory data) {
            return data.validity > block.timestamp;
        } catch {
            return false;
        }
    }
    
    /**
     * @notice Verifies user meets cooperator requirements
     * @param verifyContract Address of zkMe Verify contract
     * @param cooperator Address of the cooperating dApp
     * @param user Address of the user
     * @return verified True if user meets requirements
     */
    function verifyUser(
        address verifyContract,
        address cooperator,
        address user
    ) internal view returns (bool verified) {
        try IZKMEVerify(verifyContract).verify(cooperator, user) returns (bool result) {
            return result;
        } catch {
            return false;
        }
    }
    
    /**
     * @notice Gets remaining validity period for KYC data
     * @param sbtContract Address of zkMe SBT contract
     * @param tokenId The SBT token ID
     * @return remaining Remaining validity in seconds (0 if expired)
     */
    function getRemainingValidity(
        address sbtContract,
        uint256 tokenId
    ) internal view returns (uint256 remaining) {
        try IZKMESBT(sbtContract).getKycData(tokenId) returns (UserData memory data) {
            if (data.validity > block.timestamp) {
                return data.validity - block.timestamp;
            }
        } catch {}
        return 0;
    }
}
