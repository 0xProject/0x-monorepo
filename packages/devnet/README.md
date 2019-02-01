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

The devnet network only has a single node and uses PoA instead of PoW. That
means that one node, called the "sealer", is the ultimate authority for
validating transactions and adding new blocks to the chain. Since there is no
PoW it also means that mining does not require significant computational
resources. You can learn more about PoA and the Geth-specific implementation
called "Clique" in [EIP-225](https://github.com/ethereum/EIPs/issues/225).

The address of the "sealer" is `0xe8816898d851d5b61b7f950627d04d794c07ca37`. The
password associated with the account is "password" and the (encrypted) private
keys are visible in the **node0/keystore** directory. This account is already
"unlocked" in the Geth node by default, so you can do things like sign and send
transactions from this account using the JSON RPC endpoints directly.

There are also a number of other addresses that have hard-coded starting
balances for testing purposes. You can see the details in the **genesis.json**
file. All of these accounts are also unlocked by default.

### Additional JSON RPC Methods

In addition to the
[standard JSON RPC methods](https://github.com/ethereum/wiki/wiki/JSON-RPC) and
the
[Geth Management API](https://github.com/ethereum/go-ethereum/wiki/Management-APIs)
The devnet node supports some additional JSON RPC methods:

#### debug_increaseTime

Increases the timestamp of the next mined block.

##### Parameters

`Number` - The number of seconds by which to increase the time offset.

##### Returns

`Number` - The total number of seconds by which the time offset has been
increased (this includes all calls to `debug_increaseTime`).

##### Example

```js
// Request
curl -X POST --data '{"jsonrpc":"2.0","method":"debug_increaseTime","params":[100],"id":67}'

// Result
{
  "id":67,
  "jsonrpc": "2.0",
  "result": "5000"
}
```

### Mining

The node will automatically (nearly instantly) mine a block whenever new
transactions are added to the transaction pool. If there are no transactions in
the pool, it will wait.

To stop mining, use the
[`miner.stop`](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#miner_stop)
method.

To start mining again, you can use the
[`miner.start`](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#miner_start)
JSON RPC method.

## Contributing

We strongly recommend that the community help us make improvements and determine
the future direction of the protocol. To report bugs within this package, please
create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting
started.
