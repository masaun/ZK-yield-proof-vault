# ZK Yield Proof Vault - Smart Contract

## Overview
- TBD on Mantle

<br>

## Tech Stack

- ZK circuit: `Noir` (`v1.0.0-beta.17`)
- ZK KYC: `zkMe`
- Blockchain: `Mantle` Testnet

<br>

## Resources

- Mantle:
  - Deployment:
    - Testnet: https://docs.mantle.xyz/network/for-node-operators/deployment-guides/testnet-v1.4.1


<br>

<hr>

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
