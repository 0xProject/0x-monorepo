## @0x/contract-artifacts

Smart contract compilation artifacts for the latest version of the 0x Protocol.

## Installation

```bash
yarn add @0x/contract-artifacts
```

**Import**

```typescript
import * as artifacts from '@0x/contract-artifacts';
```

or

```javascript
var artifacts = require('@0x/contract-artifacts');
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
PKG=@0x/contract-artifacts yarn build
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
