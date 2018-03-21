## @0xproject/deployer

This repository contains a CLI tool that facilitates compiling and deployment of smart contracts.

### Read the [Documentation](0xproject.com/docs/deployer).

## Installation

#### CLI Installation

```bash
npm install @0xproject/deployer -g
```

#### API Installation

```bash
npm install @0xproject/deployer --save
```

**Import**

```typescript
import { Deployer, Compiler } from '@0xproject/deployer';
```

or

```javascript
var Deployer = require('@0xproject/deployer').Deployer;
var Compiler = require('@0xproject/deployer').Compiler;
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

```bash
yarn build
```

or

```bash
yarn build:watch
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
