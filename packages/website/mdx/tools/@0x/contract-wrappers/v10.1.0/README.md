## @0x/contract-wrappers

Smart TS wrappers for 0x smart contracts. The wrappers have simplified interfaces, perform client-side validation on transactions and throw helpful error messages.

### Read the [Documentation](https://0xproject.com/docs/0x.js).

## Installation

**Install**

```bash
npm install @0x/contract-wrappers --save
```

**Import**

```javascript
import { ContractWrappers } from '@0x/contract-wrappers';
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
```

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

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
PKG=@0x/contract-wrappers yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contract-wrappers yarn watch
```

```bash
yarn build
```

or continuously rebuild on change:

```bash
yarn watch
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