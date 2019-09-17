## @0x/sol-trace

Prints a stack trace when a revert is encountered.

### Read the [Documentation](https://0x.org/docs/tools/sol-trace).

## Installation

```bash
yarn add @0x/sol-trace
```

**Import**

```javascript
import { RevertTraceSubprovider } from '@0x/sol-trace';
```

or

```javascript
var RevertTraceSubprovider = require('@0x/sol-trace').RevertTraceSubprovider;
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
PKG=@0x/sol-trace yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/sol-trace yarn watch
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
