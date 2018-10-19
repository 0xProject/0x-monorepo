## Migrations

Migrate the 0x system of smart contracts on the network of your choice using these migrations.

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

### Build

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0x/migrations yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/migrations yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Migrate

#### V2-beta smart contracts

In order to migrate the V2-beta 0x smart contracts to Kovan using a Ledger Nano S, run:

```bash
yarn migrate:v2-beta-testnet
```

**Note:** Ledger settings `contract data` must be `on`, and `browser support` must be set to `off`.

Post-publish steps:

1.  Since we don't re-deploy the `WETH9` nor `ZRXToken` contracts, manually copy over the artifacts for them from `2.0.0` into `2.0.0-beta-testnet` and add the Kovan & ganache addresses to both of their `networks` sections.
2.  We now need to copy over the network `50` settings from the `2.0.0` artifacts to the `2.0.0-beta-testnet` artifacts for the newly deployed contracts (e.g `Exchange`, `ERC20Proxy`, `ERC721Proxy` and `AssetProxyOwner`)

#### V2 (under development) smart contracts

In order to migrate the V2 (under development) 0x smart contracts to TestRPC/Ganache running at `http://localhost:8545`, run:

```bash
yarn migrate:v2
```

#### V1 smart contracts

In order to migrate the V1 0x smart contracts to TestRPC/Ganache running at `http://localhost:8545`, run:

```bash
yarn migrate:v1
```
