// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title RegistrationSMTReplicator
 * @notice State Replicator for Registration Sparse Merkle Tree (SMT)
 * @dev This contract replicates the ZK Passport Registry state from Rarimo L2 to Mantle
 * The owner can set a set of oracles that can transition the root.
 */
contract RegistrationSMTReplicator is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @notice Time period for which a root is considered valid (1 hour)
    uint256 public constant ROOT_VALIDITY = 1 hours;
    
    /// @notice Prefix used when signing root state transitions
    string public constant REGISTRATION_ROOT_PREFIX = "Rarimo root";

    /// @notice Address of the source SMT contract on Rarimo L2
    /// @dev This is the original ZK Passport Registry on Rarimo L2: 0x479F84502Db545FA8d2275372E0582425204A879
    address public sourceSMT;

    /// @notice Latest root of the Registration SMT
    bytes32 public latestRoot;
    
    /// @notice Timestamp when the latest root was transitioned
    uint256 public latestTimestamp;

    /// @notice Mapping of roots to their transition timestamps
    mapping(bytes32 => uint256) internal _roots;

    /// @notice Set of oracle addresses authorized to submit roots
    EnumerableSet.AddressSet internal _oracles;

    /// @notice Emitted when a new root is transitioned
    event RootTransitioned(bytes32 indexed newRoot, uint256 transitionTimestamp);

    /// @notice Error thrown when caller is not an oracle
    error NotAnOracle(address sender);

    /// @notice Modifier to restrict function access to oracles only
    modifier onlyOracle() {
        if (!isOracle(msg.sender)) {
            revert NotAnOracle(msg.sender);
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract
     * @param oracles_ Initial set of oracle addresses
     * @param sourceSMT_ Address of the source SMT on Rarimo L2
     */
    function __RegistrationSMTReplicator_init(
        address[] memory oracles_,
        address sourceSMT_
    ) external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        sourceSMT = sourceSMT_;

        for (uint256 i = 0; i < oracles_.length; i++) {
            _oracles.add(oracles_[i]);
        }
    }

    /**
     * @notice Adds new oracles to the authorized set
     * @param oracles_ Array of oracle addresses to add
     */
    function addOracles(address[] memory oracles_) external onlyOwner {
        for (uint256 i = 0; i < oracles_.length; i++) {
            _oracles.add(oracles_[i]);
        }
    }

    /**
     * @notice Removes oracles from the authorized set
     * @param oracles_ Array of oracle addresses to remove
     */
    function removeOracles(address[] memory oracles_) external onlyOwner {
        for (uint256 i = 0; i < oracles_.length; i++) {
            _oracles.remove(oracles_[i]);
        }
    }

    /**
     * @notice Updates the source SMT address
     * @param newSourceSMT_ New source SMT address
     */
    function setSourceSMT(address newSourceSMT_) external onlyOwner {
        sourceSMT = newSourceSMT_;
    }

    /**
     * @notice Transitions the root of the Registration SMT (oracle only)
     * @param newRoot_ The new root to be set
     * @param transitionTimestamp_ The timestamp of the transition
     */
    function transitionRoot(
        bytes32 newRoot_,
        uint256 transitionTimestamp_
    ) external virtual onlyOracle {
        if (_roots[newRoot_] != 0) {
            return;
        }

        _updateRoot(newRoot_, transitionTimestamp_);
    }

    /**
     * @notice Transitions the root of the Registration SMT with signature verification
     * @param newRoot_ The new root to be set
     * @param transitionTimestamp_ The timestamp of the transition
     * @param signature_ The signature from the oracle verifying the root transition
     */
    function transitionRootWithSignature(
        bytes32 newRoot_,
        uint256 transitionTimestamp_,
        bytes memory signature_
    ) external virtual {
        if (_roots[newRoot_] != 0) {
            return;
        }

        bytes32 messageHash_ = keccak256(
            abi.encodePacked(
                REGISTRATION_ROOT_PREFIX,
                sourceSMT,
                address(this),
                newRoot_,
                transitionTimestamp_
            )
        );

        address signer_ = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(messageHash_),
            signature_
        );

        if (!isOracle(signer_)) {
            revert NotAnOracle(signer_);
        }

        _updateRoot(newRoot_, transitionTimestamp_);
    }

    /**
     * @notice Checks if a root is currently valid
     * @param root_ The root to check
     * @return bool True if the root is valid
     */
    function isRootValid(bytes32 root_) external view returns (bool) {
        uint256 timestamp_ = _roots[root_];
        
        if (timestamp_ == 0) {
            return false;
        }

        return block.timestamp <= timestamp_ + ROOT_VALIDITY;
    }

    /**
     * @notice Checks if an address is an authorized oracle
     * @param oracle_ Address to check
     * @return bool True if the address is an oracle
     */
    function isOracle(address oracle_) public view returns (bool) {
        return _oracles.contains(oracle_);
    }

    /**
     * @notice Returns all oracle addresses
     * @return address[] Array of oracle addresses
     */
    function getOracles() external view returns (address[] memory) {
        return _oracles.values();
    }

    /**
     * @notice Returns the implementation address
     * @return address Implementation address
     */
    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    /**
     * @notice Internal function to update the root
     * @param newRoot_ The new root to be set
     * @param transitionTimestamp_ The timestamp of the transition
     */
    function _updateRoot(bytes32 newRoot_, uint256 transitionTimestamp_) internal virtual {
        if (transitionTimestamp_ > latestTimestamp) {
            _roots[latestRoot] = transitionTimestamp_;

            (latestRoot, latestTimestamp) = (newRoot_, transitionTimestamp_);
        } else {
            _roots[newRoot_] = transitionTimestamp_;
        }

        emit RootTransitioned(newRoot_, transitionTimestamp_);
    }

    /**
     * @notice Authorizes an upgrade (owner only)
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}
}
