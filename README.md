## @0x/order-utils

0x order-related utilities for those developing on top of 0x protocol.

### Read the [Documentation](https://0x.org/docs/tools/order-utils).

## Installation

```bash
yarn add @0x/order-utils
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
PKG=@0x/order-utils yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/order-utils yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
