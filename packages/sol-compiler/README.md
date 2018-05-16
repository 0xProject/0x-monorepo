## @0xproject/sol-compiler

This repository contains a CLI tool that facilitates compiling smart contracts.

### Read the [Documentation](https://0xproject.com/docs/sol-compiler).

## Installation

#### CLI Installation

```bash
yarn global add @0xproject/sol-compiler
```

#### API Installation

```bash
yarn add @0xproject/sol-compiler
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0xproject/typescript-typings/types", "node_modules/@types"],
}
```

**Import**

```typescript
import { Compiler } from '@0xproject/sol-compiler';
```

or

```javascript
var Compiler = require('@0xproject/sol-compiler').Compiler;
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
