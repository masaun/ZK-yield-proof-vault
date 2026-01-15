// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { YieldProofVerifier } from "./circuits/YieldProofVerifier.sol";

/**
 * @title YieldVault
 * @notice A yield-bearing vault that uses ZK proofs to verify yield calculations
 * @dev Users deposit funds, epochs are tracked, and yields are claimed after ZK proof verification
 */
contract YieldVault {
    
    // ============ Errors ============
    
    error InvalidDeposit();
    error InsufficientBalance();
    error EpochNotEnded();
    error EpochAlreadyEnded();
    error InvalidProof();
    error AlreadyClaimed();
    error NullifierAlreadyUsed();
    error InvalidYieldAmount();
    error Unauthorized();
    error TransferFailed();
    
    // ============ Events ============
    
    event Deposited(address indexed user, uint256 amount, uint256 timestamp, uint256 blockNumber);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp, uint256 blockNumber);
    event EpochSnapshotted(uint256 indexed epochId, uint256 startBlock, uint256 endBlock, uint256 totalDeposits, uint256 totalYield);
    event YieldClaimed(address indexed user, uint256 indexed epochId, uint256 yieldAmount, bytes32 nullifier);
    event YieldRateUpdated(uint256 newYieldRate);
    event VerifierUpdated(address newVerifier);
    
    // ============ Structs ============
    
    struct Epoch {
        uint256 epochId;
        uint64 startBlock;
        uint64 endBlock;
        uint256 totalDeposits;
        uint64 totalYield;   // @dev - Total yield generated in the epoch  
        bytes32 balanceRoot; // @dev - Merkle root of user's deposited balances at snapshot
        bool snapshotted;
    }
    
    struct UserDeposit {
        uint256 balance;     // @dev - User's deposited balance
        uint256 lastDepositBlock;
        mapping(uint256 => bool) claimedEpochs;
    }
    
    // ============ State Variables ============
    
    YieldProofVerifier public verifier;
    address public owner;
    
    // Yield rate (per block per unit of deposit)
    uint64 public yieldRate;
    
    // Current epoch ID
    uint256 public currentEpochId;
    
    // Total deposits in the vault
    uint256 public totalDeposits;
    
    // Mapping from epoch ID to Epoch data
    mapping(uint256 => Epoch) public epochs;
    
    // Mapping from user address to their deposit info
    mapping(address => UserDeposit) private userDeposits;
    
    // Array of all depositor addresses
    address[] public depositors;
    
    // Mapping to check if address is already in depositors array
    mapping(address => bool) private isDepositor;
    
    // Mapping from nullifier to prevent double claiming
    mapping(bytes32 => bool) public usedNullifiers;
    
    // Merkle root of user balances
    bytes32 public currentBalanceRoot;
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _verifier, uint64 _initialYieldRate) {
        verifier = YieldProofVerifier(_verifier);
        owner = msg.sender;
        yieldRate = _initialYieldRate;
        currentEpochId = 0;
        
        // Initialize first epoch
        epochs[0].epochId = 0;
        epochs[0].startBlock = uint64(block.number);
    }
    
    // ============ Deposit Functions ============
    
    /**
     * @notice Deposit ETH into the vault
     */
    function deposit() external payable {
        if (msg.value == 0) revert InvalidDeposit();
        
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        
        // Add to depositors array if first deposit
        if (!isDepositor[msg.sender]) {
            depositors.push(msg.sender);
            isDepositor[msg.sender] = true;
        }
        
        userDeposit.balance += msg.value;
        userDeposit.lastDepositBlock = block.number;
        
        totalDeposits += msg.value;
        
        emit Deposited(msg.sender, msg.value, block.timestamp, block.number);
    }
    
    /**
     * @notice Withdraw deposited funds from the vault
     * @param amount The amount to withdraw
     */
    function withdraw(uint256 amount) external {
        if (amount == 0) revert InvalidDeposit();
        
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        
        if (userDeposit.balance < amount) revert InsufficientBalance();
        
        // Update balances
        userDeposit.balance -= amount;
        totalDeposits -= amount;
        
        // Transfer funds to user
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawn(msg.sender, amount, block.timestamp, block.number);
    }
    
    /**
     * @notice Get user's current balance
     * @param user The user address
     * @return The user's balance
     */
    function getUserBalance(address user) external view returns (uint256) {
        return userDeposits[user].balance;
    }
    
    /**
     * @notice Check if user has claimed yield for a specific epoch
     * @param user The user address
     * @param epochId The epoch ID
     * @return Whether the user has claimed
     */
    function hasClaimedEpoch(address user, uint256 epochId) external view returns (bool) {
        return userDeposits[user].claimedEpochs[epochId];
    }
    
    /**
     * @notice Get all depositor addresses
     * @return Array of all depositor addresses
     */
    function getAllDepositors() external view returns (address[] memory) {
        return depositors;
    }
    
    /**
     * @notice Get balances for multiple users
     * @param users Array of user addresses
     * @return balances Array of user balances
     */
    function getUserBalances(address[] calldata users) external view returns (uint256[] memory balances) {
        balances = new uint256[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            balances[i] = userDeposits[users[i]].balance;
        }
    }
    
    /**
     * @notice Get all depositors with their balances
     * @return addresses Array of depositor addresses
     * @return balances Array of corresponding balances
     */
    function getAllDepositorsWithBalances() external view returns (
        address[] memory addresses,
        uint256[] memory balances
    ) {
        uint256 length = depositors.length;
        addresses = new address[](length);
        balances = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            addresses[i] = depositors[i];
            balances[i] = userDeposits[depositors[i]].balance;
        }
    }
    
    // ============ Epoch Management ============
    
    /**
     * @notice Take a snapshot of the current epoch and start a new one (anyone can call)
     * @param _balanceRoot The Merkle root of all user balances
     * @param _totalYield The total yield for this epoch
     */
    function snapshotEpoch(bytes32 _balanceRoot, uint64 _totalYield) external {
        _snapshotEpoch(_balanceRoot, _totalYield);
    }
    
    /**
     * @notice Internal function to snapshot the current epoch
     * @param _balanceRoot The Merkle root of all user balances
     * @param _totalYield The total yield for this epoch
     */
    function _snapshotEpoch(bytes32 _balanceRoot, uint64 _totalYield) internal {
        Epoch storage currentEpoch = epochs[currentEpochId];
        
        if (currentEpoch.snapshotted) revert EpochAlreadyEnded();
        
        // Finalize current epoch
        currentEpoch.endBlock = uint64(block.number);
        currentEpoch.totalDeposits = totalDeposits;
        currentEpoch.totalYield = _totalYield;
        currentEpoch.balanceRoot = _balanceRoot;
        currentEpoch.snapshotted = true;
        
        // Update global balance root
        currentBalanceRoot = _balanceRoot;
        
        emit EpochSnapshotted(
            currentEpochId,
            currentEpoch.startBlock,
            currentEpoch.endBlock,
            currentEpoch.totalDeposits,
            currentEpoch.totalYield
        );
        
        // Start new epoch
        currentEpochId++;
        epochs[currentEpochId].epochId = currentEpochId;
        epochs[currentEpochId].startBlock = uint64(block.number);
    }
    
    /**
     * @notice Get epoch information
     * @param epochId The epoch ID
     * @return id The epoch ID
     * @return startBlock The epoch start block number
     * @return endBlock The epoch end block number
     * @return totalDepositsAtSnapshot Total deposits at snapshot time
     * @return totalYield Total yield for the epoch
     * @return balanceRoot Merkle root of user balances
     * @return snapshotted Whether the epoch has been snapshotted
     */
    function getEpoch(uint256 epochId) external view returns (
        uint256 id,
        uint64 startBlock,
        uint64 endBlock,
        uint256 totalDepositsAtSnapshot,
        uint64 totalYield,
        bytes32 balanceRoot,
        bool snapshotted
    ) {
        Epoch storage epoch = epochs[epochId];
        return (
            epoch.epochId,
            epoch.startBlock,
            epoch.endBlock,
            epoch.totalDeposits,
            epoch.totalYield,
            epoch.balanceRoot,
            epoch.snapshotted
        );
    }
    
    // ============ Yield Claiming ============
    
    /**
     * @notice Claim yield using a ZK proof
     * @param proof The ZK proof bytes
     * @param publicInputs The public inputs for the proof
     * @dev Public inputs order (from the circuit):
     *      [0] expected_latest_user_balance_root (Field)
     *      [1] latest_block_number (u64)
     *      [2] yield_rate (u64)
     *      [3] epoch_start (u64)
     *      [4] epoch_end (u64)
     *      [5] latest_total_yield (u64)
     *      [6] expected_nullifier (Field)
     */
    function claimYield(
        uint256 epochId,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external {
        Epoch storage epoch = epochs[epochId];

        // Validate epoch is snapshotted before allowing claims
        if (!epoch.snapshotted) revert EpochNotEnded();
        
        // Check if already claimed
        if (userDeposits[msg.sender].claimedEpochs[epochId]) revert AlreadyClaimed();
        
        // Verify public inputs match epoch data
        _validatePublicInputs(epochId, publicInputs);
        
        // Extract nullifier from public inputs
        bytes32 nullifier = publicInputs[6];
        
        // Check if nullifier has been used
        if (usedNullifiers[nullifier]) revert NullifierAlreadyUsed();
        
        // Verify the ZK proof
        bool isValid = verifier.verifyYieldProof(proof, publicInputs);
        if (!isValid) revert InvalidProof();
        
        // Calculate yield amount from the proof
        // The circuit proves: latest_user_yield = latest_user_balance * yield_rate * (epoch_end - epoch_start)
        // We extract the user balance and calculate yield
        uint256 yieldAmount = _calculateYieldFromProof(publicInputs);
        
        // Mark as claimed
        userDeposits[msg.sender].claimedEpochs[epochId] = true;
        usedNullifiers[nullifier] = true;
        
        // Transfer yield to user
        _transferYield(msg.sender, yieldAmount);
        
        emit YieldClaimed(msg.sender, epochId, yieldAmount, nullifier);
    }
    
    /**
     * @notice Validate that public inputs match the epoch data
     * @param epochId The epoch ID
     * @param publicInputs The public inputs array
     */
    function _validatePublicInputs(uint256 epochId, bytes32[] calldata publicInputs) private view {
        Epoch storage epoch = epochs[epochId];
        
        // Validate balance root (index 0)
        if (publicInputs[0] != epoch.balanceRoot) revert InvalidProof();
        
        // Validate yield rate (index 2)
        if (uint64(uint256(publicInputs[2])) != yieldRate) revert InvalidProof();
        
        // Validate epoch start (index 3)
        if (uint64(uint256(publicInputs[3])) != epoch.startBlock) revert InvalidProof();
        
        // Validate epoch end (index 4)
        if (uint64(uint256(publicInputs[4])) != epoch.endBlock) revert InvalidProof();
        
        // Validate total yield (index 5)
        if (uint64(uint256(publicInputs[5])) != epoch.totalYield) revert InvalidProof();
    }

    // ============ Yield Calculation ============

    /**
     * @notice Calculate yield amount from public inputs
     * @param publicInputs The public inputs array
     * @return The yield amount
     */
    function _calculateYieldFromProof(bytes32[] calldata publicInputs) private view returns (uint256) {
        // Extract values from public inputs
        // uint64 blockNumber = uint64(uint256(publicInputs[1])); // Currently unused
        uint64 _yieldRate = uint64(uint256(publicInputs[2]));
        uint64 epochStart = uint64(uint256(publicInputs[3]));
        uint64 epochEnd = uint64(uint256(publicInputs[4]));
        
        // Get user balance (this should match what was proven in the circuit)
        uint256 userBalance = userDeposits[msg.sender].balance;
        
        // Calculate yield: balance * yieldRate * (epochEnd - epochStart)
        // Note: In production, consider scaling factors for precision
        uint256 yieldAmount = (userBalance * _yieldRate * (epochEnd - epochStart)) / 1e18;
        
        if (yieldAmount == 0) revert InvalidYieldAmount();
        
        return yieldAmount;
    }
    
    /**
     * @notice Transfer yield to user
     * @param user The user address
     * @param amount The amount to transfer
     */
    function _transferYield(address user, uint256 amount) private {
        // In a real implementation, this might mint yield tokens or transfer from a yield pool
        // For this example, we'll transfer ETH from the contract balance
        if (address(this).balance < amount) revert InsufficientBalance();
        
        (bool success, ) = user.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update the yield rate
     * @param newYieldRate The new yield rate
     */
    function setYieldRate(uint64 newYieldRate) external onlyOwner {
        yieldRate = newYieldRate;
        emit YieldRateUpdated(newYieldRate);
    }
    
    /**
     * @notice Update the verifier contract
     * @param newVerifier The new verifier address
     */
    function setVerifier(address newVerifier) external onlyOwner {
        verifier = YieldProofVerifier(newVerifier);
        emit VerifierUpdated(newVerifier);
    }
    
    /**
     * @notice Fund the vault with yield rewards (owner only)
     */
    function fundVault() external payable onlyOwner {
        // Owner can fund the vault to pay out yields
    }
    
    /**
     * @notice Withdraw excess funds (owner only)
     * @param amount The amount to withdraw
     */
    function withdrawExcess(uint256 amount) external onlyOwner {
        if (address(this).balance < amount) revert InsufficientBalance();
        
        (bool success, ) = owner.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Transfer ownership
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}