#### CLI Usage

```bash
$ 0x-deployer --help
0x-deployer [command]

Commands:
  0x-deployer compile  compile contracts
  0x-deployer deploy   deploy a single contract with provided arguments

Options:
  --version          Show version number                               [boolean]
  --contracts-dir    path of contracts directory to compile   [string] [default:
   "/path/to/contracts"]
  --network-id       mainnet=1, kovan=42, testrpc=50      [number] [default: 50]
  --should-optimize  enable optimizer                 [boolean] [default: false]
  --artifacts-dir    path to write contracts artifacts to     [string] [default:
   "/path/to/artifacts"]
  --jsonrpc-port     port connected to JSON RPC         [number] [default: 8545]
  --gas-price        gasPrice to be used for transactions
                                                [string] [default: "2000000000"]
  --account          account to use for deploying contracts             [string]
  --contracts        comma separated list of contracts to compile
                                                         [string] [default: "*"]
  --help             Show help                                         [boolean]
```

#### API Usage

##### Migrations

You can write migration scripts (similar to `truffle migrate`), that deploys multiple contracts and configures them. Below you'll find a simple example of such a script to help you get started.

```typescript
import { Deployer } from '@0xproject/deployer';
import * as path from 'path';

const deployerOpts = {
    artifactsDir: path.resolve('src', 'artifacts'),
    jsonrpcUrl: 'http://localhost:8545',
    networkId: 50,
    defaults: {
        gas: 1000000,
    },
};

const deployer = new Deployer(deployerOpts);

(async () => {
    const etherToken = await deployer.deployAndSaveAsync('WETH9');
})().catch(console.log);
```

**Tip:** Be sure to start an Ethereum node at the supplied `jsonrpcUrl`. We recommend testing with [Ganache-cli](https://github.com/trufflesuite/ganache-cli)

A more sophisticated example can be found [here](https://github.com/0xProject/0x-monorepo/tree/development/packages/contracts/migrations)
