## Dev utils

Dev utils to be shared across 0x projects and packages

## Configuration

Some env variables might be set to change the behaviour of created web3 providers/instances.

```
VERBOSE_GANACHE: boolean. Enables verbose Ganache logging. Every request/response payload. Slightly slower, but useful for testing.
SOLIDITY_COVERAGE: boolean. If set - adds coverage subprovider which intercepts all calls/transactions and can be later used to compute code coverage.
```

Boolean env variables should be either `true` or `false`. Defaults to `false` if not set.

## Install

```bash
yarn add @0x/dev-utils
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
```

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
PKG=@0x/dev-utils yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/dev-utils yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
