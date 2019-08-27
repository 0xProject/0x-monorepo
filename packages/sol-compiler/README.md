## @0x/sol-compiler

Sol-compiler is a wrapper around [solc-js](https://www.npmjs.com/package/solc) that adds:

-   Smart re-compilation: Only recompiles when smart contracts have changed
-   Ability to compile an entire project instead of only individual `.sol` files
-   Compilation using the Solidity version specified at the top of each individual `.sol` file
-   Proper parsing of Solidity version ranges
-   Support for the standard [input description](https://solidity.readthedocs.io/en/develop/using-the-compiler.html#input-description) for what information you'd like added to the resulting `artifacts` file (i.e 100% configurable artifacts content).

### Read the [Documentation](https://0xproject.com/docs/tools/sol-compiler).

## Installation

#### CLI Installation

```bash
yarn global add @0x/sol-compiler
```

#### API Installation

```bash
yarn add @0x/sol-compiler
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
```

**Import**

```typescript
import { Compiler } from '@0x/sol-compiler';
```

or

```javascript
var Compiler = require('@0x/sol-compiler').Compiler;
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
PKG=@0x/sol-compiler yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/sol-compiler yarn watch
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
