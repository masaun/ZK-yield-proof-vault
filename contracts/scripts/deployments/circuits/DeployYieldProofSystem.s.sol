// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import {HonkVerifier} from "../../../src/circuits/honk-verifier/honk_vk.sol";
import {YieldProofVerifier} from "../../../src/circuits/YieldProofVerifier.sol";
import {YieldVault} from "../../../src/YieldVault.sol";

/**
 * @title DeployYieldProofSystem
 * @notice Deployment script for HonkVerifier, YieldProofVerifier, and YieldVault contracts
 * @dev Run with: forge script script/deployments/circuits/DeployYieldProofSystem.s.sol:DeployYieldProofSystem --rpc-url $MANTLE_TESTNET_RPC_URL --broadcast --verify
 */
contract DeployYieldProofSystem is Script {
    // Initial yield rate: 0.001 per block (1000000000000000 wei)
    uint64 constant INITIAL_YIELD_RATE = 1000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy HonkVerifier
        HonkVerifier honkVerifier = new HonkVerifier();
        console.log("HonkVerifier deployed to:", address(honkVerifier));

        // Deploy YieldProofVerifier
        YieldProofVerifier yieldProofVerifier = new YieldProofVerifier(honkVerifier);
        console.log("YieldProofVerifier deployed to:", address(yieldProofVerifier));

        // Deploy YieldVault
        YieldVault yieldVault = new YieldVault(address(yieldProofVerifier), INITIAL_YIELD_RATE);
        console.log("YieldVault deployed to:", address(yieldVault));

        vm.stopBroadcast();

        // Log deployment information
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("HonkVerifier:", address(honkVerifier));
        console.log("YieldProofVerifier:", address(yieldProofVerifier));
        console.log("YieldVault:", address(yieldVault));
        console.log("Initial Yield Rate:", INITIAL_YIELD_RATE);
        
        console.log("\nPlease save these addresses to your .env files:");
        console.log("HONK_VERIFIER_ADDRESS=", address(honkVerifier));
        console.log("YIELD_PROOF_VERIFIER_ADDRESS=", address(yieldProofVerifier));
        console.log("YIELD_VAULT_ADDRESS=", address(yieldVault));
    }
}
