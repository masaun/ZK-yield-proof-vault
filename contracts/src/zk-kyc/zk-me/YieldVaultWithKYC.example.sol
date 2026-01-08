// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IZkKycWithZkMe.sol";

/**
 * @title YieldVaultWithKYC
 * @notice Example integration of zkMe KYC verification with a Yield Vault
 * @dev This is a reference implementation showing how to integrate ZkKycWithZkMe
 *      with your vault contract for KYC-gated operations
 * 
 * Key Integration Points:
 * 1. Require KYC for deposits
 * 2. Require KYC for withdrawals
 * 3. Optional: Auto-verify users on first interaction
 * 4. Optional: Grace period for expired KYC
 */
contract YieldVaultWithKYC {
    
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Address of the zkKYC verification contract
    IZkKycWithZkMe public immutable zkKyc;
    
    /// @notice Owner of the vault
    address public owner;
    
    /// @notice Total deposits in the vault
    uint256 public totalDeposits;
    
    /// @notice User balances
    mapping(address => uint256) public balances;
    
    /// @notice Whether KYC is required for deposits
    bool public kycRequiredForDeposits;
    
    /// @notice Whether KYC is required for withdrawals
    bool public kycRequiredForWithdrawals;
    
    /// @notice Grace period for expired KYC (in seconds)
    uint256 public kycGracePeriod;
    
    /// @notice Timestamp when user last had valid KYC
    mapping(address => uint256) public lastValidKycTimestamp;
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event KYCRequirementUpdated(bool depositsRequired, bool withdrawalsRequired);
    event UserKYCVerified(address indexed user);
    event GracePeriodUpdated(uint256 newPeriod);
    
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error Unauthorized();
    error KYCRequired();
    error KYCExpired();
    error InsufficientBalance();
    error ZeroAmount();
    
    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Initializes the vault with KYC integration
     * @param _zkKycAddress Address of the deployed ZkKycWithZkMe contract
     */
    constructor(address _zkKycAddress) {
        zkKyc = IZkKycWithZkMe(_zkKycAddress);
        owner = msg.sender;
        
        // Default: Require KYC for both deposits and withdrawals
        kycRequiredForDeposits = true;
        kycRequiredForWithdrawals = true;
        
        // Default: 7 days grace period for expired KYC
        kycGracePeriod = 7 days;
    }
    
    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    /**
     * @notice Modifier to check if user has valid KYC
     * @dev Includes grace period logic for expired KYC
     */
    modifier requireValidKYC() {
        if (!_hasValidKYCWithGracePeriod(msg.sender)) {
            revert KYCRequired();
        }
        _;
    }
    
    /*//////////////////////////////////////////////////////////////
                        DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Deposit funds into the vault
     * @dev Requires KYC if kycRequiredForDeposits is true
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external payable {
        if (amount == 0) revert ZeroAmount();
        
        // Check KYC if required
        if (kycRequiredForDeposits) {
            if (!_hasValidKYCWithGracePeriod(msg.sender)) {
                revert KYCRequired();
            }
            _updateLastValidKycTimestamp(msg.sender);
        }
        
        balances[msg.sender] += amount;
        totalDeposits += amount;
        
        emit Deposit(msg.sender, amount);
    }
    
    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Withdraw funds from the vault
     * @dev Requires KYC if kycRequiredForWithdrawals is true
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        
        // Check KYC if required
        if (kycRequiredForWithdrawals) {
            if (!_hasValidKYCWithGracePeriod(msg.sender)) {
                revert KYCRequired();
            }
            _updateLastValidKycTimestamp(msg.sender);
        }
        
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        
        // Transfer funds
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdraw(msg.sender, amount);
    }
    
    /*//////////////////////////////////////////////////////////////
                        KYC MANAGEMENT
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Verify a user's KYC status
     * @dev Callable by anyone, but zkKyc contract will enforce permissions
     * @param user Address of the user to verify
     */
    function verifyUserKYC(address user) external {
        // This will revert if not authorized or if verification fails
        zkKyc.verifyUserKYC(user);
        
        _updateLastValidKycTimestamp(user);
        
        emit UserKYCVerified(user);
    }
    
    /**
     * @notice Check if a user has valid KYC
     * @param user Address to check
     * @return valid True if user has valid KYC (including grace period)
     */
    function hasValidKYC(address user) external view returns (bool valid) {
        return _hasValidKYCWithGracePeriod(user);
    }
    
    /**
     * @notice Get user's KYC status details
     * @param user Address to check
     * @return isVerified Whether user is currently verified
     * @return isInGracePeriod Whether user is in grace period
     * @return lastValid Timestamp of last valid KYC
     */
    function getKYCStatus(address user) external view returns (
        bool isVerified,
        bool isInGracePeriod,
        uint256 lastValid
    ) {
        isVerified = zkKyc.hasValidKYC(user);
        lastValid = lastValidKycTimestamp[user];
        
        if (!isVerified && lastValid > 0) {
            isInGracePeriod = (block.timestamp - lastValid) <= kycGracePeriod;
        } else {
            isInGracePeriod = false;
        }
    }
    
    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Update KYC requirements for deposits and withdrawals
     * @param _depositsRequired Whether KYC is required for deposits
     * @param _withdrawalsRequired Whether KYC is required for withdrawals
     */
    function setKYCRequirements(
        bool _depositsRequired,
        bool _withdrawalsRequired
    ) external onlyOwner {
        kycRequiredForDeposits = _depositsRequired;
        kycRequiredForWithdrawals = _withdrawalsRequired;
        
        emit KYCRequirementUpdated(_depositsRequired, _withdrawalsRequired);
    }
    
    /**
     * @notice Update the grace period for expired KYC
     * @param _newPeriod New grace period in seconds
     */
    function setKYCGracePeriod(uint256 _newPeriod) external onlyOwner {
        kycGracePeriod = _newPeriod;
        emit GracePeriodUpdated(_newPeriod);
    }
    
    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Internal function to check KYC with grace period
     * @param user Address to check
     * @return valid True if user has valid KYC or is in grace period
     */
    function _hasValidKYCWithGracePeriod(address user) internal view returns (bool valid) {
        // Check if currently verified
        if (zkKyc.hasValidKYC(user)) {
            return true;
        }
        
        // Check grace period
        uint256 lastValid = lastValidKycTimestamp[user];
        if (lastValid > 0 && (block.timestamp - lastValid) <= kycGracePeriod) {
            return true;
        }
        
        return false;
    }
    
    /**
     * @notice Updates the last valid KYC timestamp for a user
     * @param user Address of the user
     */
    function _updateLastValidKycTimestamp(address user) internal {
        if (zkKyc.hasValidKYC(user)) {
            lastValidKycTimestamp[user] = block.timestamp;
        }
    }
    
    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get user's balance
     * @param user Address to check
     * @return balance User's balance
     */
    function getBalance(address user) external view returns (uint256 balance) {
        return balances[user];
    }
    
    /**
     * @notice Get vault statistics
     * @return total Total deposits in vault
     * @return depositsKycRequired Whether KYC is required for deposits
     * @return withdrawalsKycRequired Whether KYC is required for withdrawals
     * @return gracePeriod Grace period in seconds
     */
    function getVaultInfo() external view returns (
        uint256 total,
        bool depositsKycRequired,
        bool withdrawalsKycRequired,
        uint256 gracePeriod
    ) {
        return (
            totalDeposits,
            kycRequiredForDeposits,
            kycRequiredForWithdrawals,
            kycGracePeriod
        );
    }
}

/**
 * @title Integration Notes
 * 
 * ## Basic Integration Pattern
 * 
 * 1. Deploy ZkKycWithZkMe contract
 * 2. Deploy your vault with zkKyc address
 * 3. Configure KYC requirements
 * 4. Users complete KYC through zkMe
 * 5. Verify users before they can use vault
 * 
 * ## Advanced Features
 * 
 * ### Grace Period
 * Allows users to continue using the vault for a period after KYC expires.
 * Useful for preventing sudden loss of access.
 * 
 * ### Configurable Requirements
 * Can enable/disable KYC for deposits vs withdrawals separately.
 * Example: Allow deposits without KYC but require KYC for withdrawals.
 * 
 * ### Auto-Verification
 * Can implement auto-verification where users are verified on first interaction.
 * Requires admin approval mechanism.
 * 
 * ## Security Considerations
 * 
 * 1. **Access Control**: Only owner can change KYC settings
 * 2. **Grace Period**: Prevents immediate lockout but maintains compliance
 * 3. **Timestamp Tracking**: Records when users last had valid KYC
 * 4. **Immutable KYC Contract**: Cannot be changed after deployment
 * 
 * ## Gas Optimization
 * 
 * - Use immutable for zkKyc address
 * - Cache KYC checks when possible
 * - Batch KYC verifications if handling multiple users
 * 
 * ## Testing Recommendations
 * 
 * 1. Test deposit/withdrawal with and without KYC
 * 2. Test grace period functionality
 * 3. Test KYC requirement updates
 * 4. Test with expired KYC
 * 5. Test edge cases (zero amounts, insufficient balance, etc.)
 */
