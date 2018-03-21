## @0xproject/sol-cov

A Solidity code coverage tool.

### Read the [Documentation](0xproject.com/docs/sol-cov).

## Installation

```bash
npm install @0xproject/sol-cov --save
```

**Import**

```javascript
import { CoverageSubprovider } from '@0xproject/sol-cov';
```

or

```javascript
var CoverageSubprovider = require('@0xproject/sol-cov').CoverageSubprovider;
```

## Contributing

We strongly encourage the community to help us make improvements. To report bugs within this package, please create an issue in this repository.

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

### Lint

```bash
yarn lint
```
