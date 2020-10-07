# Contracts Gen

This package allows you to generate boilerplate TypeScript code and configs for smart contracts packages.

## Installation

`yarn add -g @0x/contracts-gen`

## Usage

Run it from within your smart contracts packages.

```bash
contracts-gen
```

You should run this tool after each time you move your contracts around to regenerate boilerplate code and configs.

## What can it generate

This tool does the following:

-   Reads your `compiler.json`. Specifically the list of smart contracts.
-   Creates `wrapper.ts` file which exports all contract wrappers.
-   Creates `artifacts.ts` file which exports all contract artifacts.
-   Generates list of JSON artifact files in `tsconfig.json`
-   Generates a glob for abi-gen in `package.json`

On top of that - if your `compiler.json` has contracts referenced just by name - it will resolve the name to relative path and put it there.
It also sorts all the lists in it's output leading to smaller and cleaner diffs.

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
PKG=@0x/contracts-gen yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contracts-gen yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
