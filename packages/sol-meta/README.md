## @0xproject/sol-meta

Sol-meta is a Solidity to Solidity compiler to automatically generate testing contracts. It has two modes:

**Mocking.** Given an interface contract (either a public interface or a mixin), it can generate a mock implementation.

**Exposing.** Given an implemented contract it generates a contract that exposes all internal functions with public wrappers.

**Flattening.** Given a contract it will pull in all inherited contracts and flatten them into a single contract without inheritance.

**Combined.** Flatten a contract and then generate a wrapper that adds mocks for all unimplemented functions and exposes all internal members.

## Architecture

Source --Parser--> AST --transform--> AST --unparser--> Source


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
PKG=@0xproject/sol-compiler yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0xproject/sol-compiler yarn watch
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
