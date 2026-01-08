// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "../src/zk-kyc/zk-me/ZkKycWithZkMe.sol";

/**
 * @title DeployZkKycWithZkMe
 * @notice Deployment script for ZkKycWithZkMe contract on Mantle Testnet
 * @dev Run with: forge script script/DeployZkKycWithZkMe.s.sol:DeployZkKycWithZkMe --rpc-url $MANTLE_TESTNET_RPC --broadcast --verify
 */
contract DeployZkKycWithZkMe is Script {
    
    // Mantle Testnet zkMe Contract Addresses
    // NOTE: These are placeholder addresses - update with actual deployed zkMe contracts on Mantle Testnet
    // Contact zkMe team at contact@zk.me for Mantle Testnet deployment addresses
    address constant ZKME_SBT_MANTLE_TESTNET = address(0); // TODO: Update with actual address
    address constant ZKME_VERIFY_MANTLE_TESTNET = address(0); // TODO: Update with actual address
    
    function run() external {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Validate addresses
        require(ZKME_SBT_MANTLE_TESTNET != address(0), "Invalid zkMe SBT address");
        require(ZKME_VERIFY_MANTLE_TESTNET != address(0), "Invalid zkMe Verify address");
        
        // Deploy ZkKycWithZkMe
        ZkKycWithZkMe zkKyc = new ZkKycWithZkMe(
            ZKME_SBT_MANTLE_TESTNET,
            ZKME_VERIFY_MANTLE_TESTNET
        );
        
        console.log("====================================");
        console.log("ZkKycWithZkMe deployed to:", address(zkKyc));
        console.log("zkMe SBT Contract:", ZKME_SBT_MANTLE_TESTNET);
        console.log("zkMe Verify Contract:", ZKME_VERIFY_MANTLE_TESTNET);
        console.log("Owner:", zkKyc.owner());
        console.log("Min Validity Period:", zkKyc.minValidityPeriod(), "seconds");
        console.log("====================================");
        
        // Optional: Set up initial configuration
        // Example: Set required questions
        string[] memory questions = new string[](3);
        questions[0] = "IsAdult"; // User is 18+ years old
        questions[1] = "NotSanctioned"; // User is not on sanctions list
        questions[2] = "ValidID"; // User has valid government ID
        
        zkKyc.setRequiredQuestions(questions);
        console.log("Required questions set");
        
        vm.stopBroadcast();
        
        // Output deployment info for integration
        console.log("\n=== Integration Information ===");
        console.log("Add the following to your .env file:");
        console.log("ZKKYC_CONTRACT_ADDRESS=", address(zkKyc));
    }
}
