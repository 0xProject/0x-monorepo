## @0x/sol-resolver

A Solidity import resolver used by [sol-compiler](https://github.com/0xProject/0x-monorepo/tree/development/packages/sol-compiler).

## Installation

```bash
yarn add @0x/sol-resolver
```

**Import**

```javascript
import { Resolver } from '@0x/sol-resolver';
```

or

```javascript
var Resolver = require('@0x/sol-resolver').Resolver;
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
PKG=@0x/sol-resolver yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/sol-resolver yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
