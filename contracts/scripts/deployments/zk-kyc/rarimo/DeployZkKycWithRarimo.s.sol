// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {RegistrationSMTReplicator} from "../../../../src/zk-kyc/rarimo/RegistrationSMTReplicator.sol";
import {ZkKycWithRarimo} from "../../../../src/zk-kyc/rarimo/ZkKycWithRarimo.sol";

contract DeployZkKycWithRarimo is Script {
    // Rarimo L2 ZK Passport Registry address (source SMT)
    address constant RARIMO_SOURCE_SMT = 0x479F84502Db545FA8d2275372E0582425204A879;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy RegistrationSMTReplicator implementation
        RegistrationSMTReplicator replicatorImpl = new RegistrationSMTReplicator();
        console.log("RegistrationSMTReplicator Implementation deployed to:", address(replicatorImpl));

        // Prepare initialization data
        address[] memory oracles = new address[](1);
        oracles[0] = oracleAddress;

        bytes memory initData = abi.encodeWithSelector(
            RegistrationSMTReplicator.__RegistrationSMTReplicator_init.selector,
            oracles,
            RARIMO_SOURCE_SMT
        );

        // Deploy proxy
        ERC1967Proxy replicatorProxy = new ERC1967Proxy(
            address(replicatorImpl),
            initData
        );
        console.log("RegistrationSMTReplicator Proxy deployed to:", address(replicatorProxy));

        // Deploy ZkKycWithRarimo
        ZkKycWithRarimo zkKyc = new ZkKycWithRarimo(address(replicatorProxy));
        console.log("ZkKycWithRarimo deployed to:", address(zkKyc));

        vm.stopBroadcast();

        // Log deployment information
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("RegistrationSMTReplicator Proxy:", address(replicatorProxy));
        console.log("ZkKycWithRarimo:", address(zkKyc));
        console.log("Oracle Address:", oracleAddress);
        console.log("Source SMT (Rarimo L2):", RARIMO_SOURCE_SMT);
        
        console.log("\nPlease save these addresses to your .env files:");
        console.log("REGISTRATION_SMT_REPLICATOR_ADDRESS=", address(replicatorProxy));
        console.log("ZK_KYC_RARIMO_ADDRESS=", address(zkKyc));
    }
}
