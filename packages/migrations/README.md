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

#### V2 smart contracts

In order to migrate the V2 0x smart contracts to TestRPC/Ganache running at `http://localhost:8545`, run:

```bash
yarn migrate:v2
```
