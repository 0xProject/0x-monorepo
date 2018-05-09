## 0x Devnet

A private, single-node PoA Ethereum network for testing purposes only. It uses
Geth and the PoA implementation called "Clique".

## Installation

The devnet requires Docker to run (the latest version is recommended).

In the package root directory, run:

```
docker build -t 0x-devnet .
```

## Usage

To start the network, run:

```
docker run -it --rm -p 8501:8501 0x-devnet
```

Depending on your OS and how you installed docker, you may need to prefix any
docker commands with `sudo`.

The Docker container exposes the JSON RPC API at port 8501, and this is the
primary way you are expected to interact with the devnet. The following
endpoints are supported: `personal,db,eth,net,web3,txpool,miner,debug`.

You can stop the network with `docker stop` and it will automatically clean up
after itself. (`docker stop` typically requires you to use `docker ps` to find
the name of the currently running container).

### Configuration

The devnet network only has a single node and using PoA instead of PoW. That
means that one node, called the "sealer", is the ultimate authority for
validating transactions and adding new blocks to the chain. Since there is no
PoW it also means that mining does not require significant computational
resources. You can learn more about PoA and the Geth-specific implementation
called "Clique" in [EIP-225](https://github.com/ethereum/EIPs/issues/225).

The address of the "sealer" is `35e52c375871faaa9923defbda5820dfa5aefc8f`. The
password associated with the account is "password0" and the private keys are
visible in the __node0/keystore__ directory. This account is already unlocked in
the Geth node by default, so you can do things like sign and send transactions
from this account using the JSON RPC endpoints directly.

There are also a number of other addresses that have hard-coded starting
balances for testing purposes. You can see the details in the __genesis.json__
file.

### Mining

The node does not start mining by default, so you will need to do this if you
want any new blocks to be added to the chain. To start mining, you can use the
[`miner.start`](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#miner_start)
JSON RPC method. The network is configured to mine one block every second and,
once started, will continue to mine until stopped.

To stop mining, use the
[`miner.stop`](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#miner_stop)
method.

## Contributing

We strongly recommend that the community help us make improvements and determine
the future direction of the protocol. To report bugs within this package, please
create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting
started.
