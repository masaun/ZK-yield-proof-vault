// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../../../src/zk-kyc/zk-me/ZkKycWithZkMe.sol";

/**
 * @title ZkKycWithZkMeTest
 * @notice Test suite for ZkKycWithZkMe contract
 * @dev Tests zkMe integration for privacy-preserving KYC verification on Mantle Testnet
 */
contract ZkKycWithZkMeTest is Test {
    
    ZkKycWithZkMe public zkKyc;
    
    // Mock contract addresses (replace with actual Mantle Testnet addresses when deploying)
    address public zkMeSBTContract;
    address public zkMeVerifyContract;
    
    // Test accounts
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    
    // Events to test
    event KYCVerified(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event KYCRevoked(address indexed user, uint256 timestamp);
    event SBTContractUpdated(address indexed oldAddress, address indexed newAddress);
    event VerifyContractUpdated(address indexed oldAddress, address indexed newAddress);
    event MinValidityPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event RequiredQuestionsUpdated(string[] questions);
    
    function setUp() public {
        // Set up test accounts
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // Deploy mock zkMe contracts
        zkMeSBTContract = address(new MockZKMESBT());
        zkMeVerifyContract = address(new MockZKMEVerify());
        
        // Deploy ZkKycWithZkMe contract
        zkKyc = new ZkKycWithZkMe(zkMeSBTContract, zkMeVerifyContract);
        
        // Set up mock data for testing
        MockZKMESBT(zkMeSBTContract).setTokenId(user1, 1);
        MockZKMESBT(zkMeSBTContract).setTokenId(user2, 2);
        MockZKMESBT(zkMeSBTContract).setKycData(1, 30 days);
        MockZKMESBT(zkMeSBTContract).setKycData(2, 60 days);
        
        MockZKMEVerify(zkMeVerifyContract).setVerificationStatus(user1, true);
        MockZKMEVerify(zkMeVerifyContract).setVerificationStatus(user2, true);
        MockZKMEVerify(zkMeVerifyContract).setVerificationStatus(user3, false);
    }
    
    /*//////////////////////////////////////////////////////////////
                        CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_Constructor_Success() public {
        ZkKycWithZkMe newKyc = new ZkKycWithZkMe(zkMeSBTContract, zkMeVerifyContract);
        
        assertEq(newKyc.zkMeSBTContract(), zkMeSBTContract);
        assertEq(newKyc.zkMeVerifyContract(), zkMeVerifyContract);
        assertEq(newKyc.minValidityPeriod(), 30 days);
        assertEq(newKyc.owner(), owner);
    }
    
    function test_Constructor_RevertInvalidSBTAddress() public {
        vm.expectRevert(ZkKycWithZkMe.InvalidAddress.selector);
        new ZkKycWithZkMe(address(0), zkMeVerifyContract);
    }
    
    function test_Constructor_RevertInvalidVerifyAddress() public {
        vm.expectRevert(ZkKycWithZkMe.InvalidAddress.selector);
        new ZkKycWithZkMe(zkMeSBTContract, address(0));
    }
    
    /*//////////////////////////////////////////////////////////////
                    KYC VERIFICATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_VerifyUserKYC_Success() public {
        assertFalse(zkKyc.isKYCVerified(user1));
        
        vm.expectEmit(true, true, false, true);
        emit KYCVerified(user1, 1, block.timestamp);
        
        bool success = zkKyc.verifyUserKYC(user1);
        
        assertTrue(success);
        assertTrue(zkKyc.isKYCVerified(user1));
        assertEq(zkKyc.userTokenIds(user1), 1);
    }
    
    function test_VerifyUserKYC_RevertInvalidAddress() public {
        vm.expectRevert(ZkKycWithZkMe.InvalidAddress.selector);
        zkKyc.verifyUserKYC(address(0));
    }
    
    function test_VerifyUserKYC_RevertAlreadyVerified() public {
        zkKyc.verifyUserKYC(user1);
        
        vm.expectRevert(ZkKycWithZkMe.AlreadyVerified.selector);
        zkKyc.verifyUserKYC(user1);
    }
    
    function test_VerifyUserKYC_RevertNoSBT() public {
        vm.expectRevert(ZkKycWithZkMe.NoSBTFound.selector);
        zkKyc.verifyUserKYC(user3);
    }
    
    function test_VerifyUserKYC_RevertVerificationFailed() public {
        address user4 = makeAddr("user4");
        MockZKMESBT(zkMeSBTContract).setTokenId(user4, 4);
        MockZKMESBT(zkMeSBTContract).setKycData(4, 30 days);
        
        vm.expectRevert(ZkKycWithZkMe.VerificationFailed.selector);
        zkKyc.verifyUserKYC(user4);
    }
    
    function test_VerifyUserKYC_RevertExpiredKYC() public {
        address user5 = makeAddr("user5");
        MockZKMESBT(zkMeSBTContract).setTokenId(user5, 5);
        MockZKMESBT(zkMeSBTContract).setKycData(5, 0); // Expired
        MockZKMEVerify(zkMeVerifyContract).setVerificationStatus(user5, true);
        
        vm.expectRevert(ZkKycWithZkMe.KYCExpired.selector);
        zkKyc.verifyUserKYC(user5);
    }
    
    function test_HasValidKYC_True() public {
        zkKyc.verifyUserKYC(user1);
        assertTrue(zkKyc.hasValidKYC(user1));
    }
    
    function test_HasValidKYC_False_NotVerified() public {
        assertFalse(zkKyc.hasValidKYC(user1));
    }
    
    function test_HasValidKYC_False_Expired() public {
        zkKyc.verifyUserKYC(user1);
        
        // Simulate time passing beyond validity period
        vm.warp(block.timestamp + 61 days);
        
        assertFalse(zkKyc.hasValidKYC(user1));
    }
    
    /*//////////////////////////////////////////////////////////////
                    RE-VERIFICATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_ReVerifyKYC_Success() public {
        // Initial verification
        zkKyc.verifyUserKYC(user1);
        
        // Revoke
        zkKyc.revokeKYC(user1);
        assertFalse(zkKyc.isKYCVerified(user1));
        
        // Re-verify
        bool success = zkKyc.reVerifyKYC(user1);
        
        assertTrue(success);
        assertTrue(zkKyc.isKYCVerified(user1));
    }
    
    function test_ReVerifyKYC_AfterExpiry() public {
        // Initial verification
        zkKyc.verifyUserKYC(user1);
        
        // Update KYC data with new validity
        MockZKMESBT(zkMeSBTContract).setKycData(1, 90 days);
        
        // Re-verify
        bool success = zkKyc.reVerifyKYC(user1);
        
        assertTrue(success);
        assertTrue(zkKyc.isKYCVerified(user1));
    }
    
    /*//////////////////////////////////////////////////////////////
                    KYC REVOCATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_RevokeKYC_Success() public {
        zkKyc.verifyUserKYC(user1);
        assertTrue(zkKyc.isKYCVerified(user1));
        
        vm.expectEmit(true, false, false, true);
        emit KYCRevoked(user1, block.timestamp);
        
        zkKyc.revokeKYC(user1);
        
        assertFalse(zkKyc.isKYCVerified(user1));
        assertEq(zkKyc.userTokenIds(user1), 0);
    }
    
    function test_RevokeKYC_RevertInvalidAddress() public {
        vm.expectRevert(ZkKycWithZkMe.InvalidAddress.selector);
        zkKyc.revokeKYC(address(0));
    }
    
    function test_RevokeKYC_RevertNotVerified() public {
        vm.expectRevert(ZkKycWithZkMe.UserNotKYCVerified.selector);
        zkKyc.revokeKYC(user1);
    }
    
    function test_RevokeKYC_OnlyOwner() public {
        zkKyc.verifyUserKYC(user1);
        
        vm.prank(user2);
        vm.expectRevert();
        zkKyc.revokeKYC(user1);
    }
    
    /*//////////////////////////////////////////////////////////////
                    ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_UpdateSBTContract_Success() public {
        address newSBT = makeAddr("newSBT");
        
        vm.expectEmit(true, true, false, false);
        emit SBTContractUpdated(zkMeSBTContract, newSBT);
        
        zkKyc.updateSBTContract(newSBT);
        
        assertEq(zkKyc.zkMeSBTContract(), newSBT);
    }
    
    function test_UpdateSBTContract_RevertInvalidAddress() public {
        vm.expectRevert(ZkKycWithZkMe.InvalidAddress.selector);
        zkKyc.updateSBTContract(address(0));
    }
    
    function test_UpdateSBTContract_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        zkKyc.updateSBTContract(makeAddr("newSBT"));
    }
    
    function test_UpdateVerifyContract_Success() public {
        address newVerify = makeAddr("newVerify");
        
        vm.expectEmit(true, true, false, false);
        emit VerifyContractUpdated(zkMeVerifyContract, newVerify);
        
        zkKyc.updateVerifyContract(newVerify);
        
        assertEq(zkKyc.zkMeVerifyContract(), newVerify);
    }
    
    function test_UpdateMinValidityPeriod_Success() public {
        uint256 newPeriod = 60 days;
        
        vm.expectEmit(false, false, false, true);
        emit MinValidityPeriodUpdated(30 days, newPeriod);
        
        zkKyc.updateMinValidityPeriod(newPeriod);
        
        assertEq(zkKyc.minValidityPeriod(), newPeriod);
    }
    
    function test_UpdateMinValidityPeriod_RevertZero() public {
        vm.expectRevert(ZkKycWithZkMe.InvalidValidityPeriod.selector);
        zkKyc.updateMinValidityPeriod(0);
    }
    
    function test_SetRequiredQuestions_Success() public {
        string[] memory questions = new string[](2);
        questions[0] = "IsAdult";
        questions[1] = "NotSanctioned";
        
        zkKyc.setRequiredQuestions(questions);
        
        string[] memory retrieved = zkKyc.getRequiredQuestions();
        assertEq(retrieved.length, 2);
        assertEq(retrieved[0], "IsAdult");
        assertEq(retrieved[1], "NotSanctioned");
    }
    
    /*//////////////////////////////////////////////////////////////
                    VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_GetUserTokenId() public {
        zkKyc.verifyUserKYC(user1);
        assertEq(zkKyc.getUserTokenId(user1), 1);
    }
    
    function test_GetZkMeContracts() public {
        (address sbt, address verify) = zkKyc.getZkMeContracts();
        assertEq(sbt, zkMeSBTContract);
        assertEq(verify, zkMeVerifyContract);
    }
    
    /*//////////////////////////////////////////////////////////////
                    INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_FullKYCWorkflow() public {
        // Step 1: Verify user1
        zkKyc.verifyUserKYC(user1);
        assertTrue(zkKyc.hasValidKYC(user1));
        
        // Step 2: Check valid KYC
        assertTrue(zkKyc.isKYCVerified(user1));
        
        // Step 3: Revoke KYC
        zkKyc.revokeKYC(user1);
        assertFalse(zkKyc.hasValidKYC(user1));
        
        // Step 4: Re-verify
        zkKyc.reVerifyKYC(user1);
        assertTrue(zkKyc.hasValidKYC(user1));
    }
    
    function test_MultipleUserVerification() public {
        zkKyc.verifyUserKYC(user1);
        zkKyc.verifyUserKYC(user2);
        
        assertTrue(zkKyc.isKYCVerified(user1));
        assertTrue(zkKyc.isKYCVerified(user2));
        assertEq(zkKyc.userTokenIds(user1), 1);
        assertEq(zkKyc.userTokenIds(user2), 2);
    }
}

/*//////////////////////////////////////////////////////////////
                    MOCK CONTRACTS
//////////////////////////////////////////////////////////////*/

/**
 * @notice Mock zkMe SBT contract for testing
 */
contract MockZKMESBT {
    mapping(address => uint256) public tokenIds;
    mapping(uint256 => uint256) public validities;
    
    function setTokenId(address user, uint256 tokenId) external {
        tokenIds[user] = tokenId;
    }
    
    function setKycData(uint256 tokenId, uint256 validityPeriod) external {
        validities[tokenId] = block.timestamp + validityPeriod;
    }
    
    function tokenIdOf(address user) external view returns (uint256) {
        return tokenIds[user];
    }
    
    function getKycData(uint256 tokenId) external view returns (
        string memory key,
        uint256 validity,
        string memory data,
        string[] memory questions
    ) {
        key = "mockKey";
        validity = validities[tokenId];
        data = "mockData";
        questions = new string[](1);
        questions[0] = "IsAdult";
    }
}

/**
 * @notice Mock zkMe Verify contract for testing
 */
contract MockZKMEVerify {
    mapping(address => bool) public verificationStatus;
    
    function setVerificationStatus(address user, bool status) external {
        verificationStatus[user] = status;
    }
    
    function verify(address, address user) external view returns (bool) {
        return verificationStatus[user];
    }
}
