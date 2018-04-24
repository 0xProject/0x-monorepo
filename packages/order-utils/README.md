## @0xproject/order-utils

0x order-related utilities for those developing on top of 0x protocol.

### Read the [Documentation](https://0xproject.com/docs/order-utils).

## Installation

```bash
yarn add @0xproject/order-utils
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0xproject/typescript-typings/types", "node_modules/@types"],
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

If this is your **first** time building this package, you must first build **all** packages within the monorepo. This is because packages that depend on other packages located inside this monorepo are symlinked when run from **within** the monorepo. This allows you to make changes across multiple packages without first publishing dependent packages to NPM. To build all packages, run the following from the monorepo root directory:

```bash
yarn lerna:rebuild
```

Or continuously rebuild on change:

```bash
yarn dev
```

You can also build this specific package by running the following from within its directory:

```bash
yarn build
```

or continuously rebuild on change:

```bash
yarn build:watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
