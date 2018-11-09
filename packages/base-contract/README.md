## @0x/base-contract

BaseContract to derive all auto-generated wrappers from

## Installation

```bash
yarn add @0x/base-contract
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
```

## Usage

```javascript
import { BaseContract } from '@0x/base-contract';
```

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Dependencies

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
PKG=@0x/base-contract yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/base-contract yarn watch
```

### Lint

```bash
yarn lint
```
