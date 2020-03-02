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

### Development

This package needs to be updated manually when deploying a new contract.
Post-deployment workflow:

1. Update `@0x/contract-addresses`
2. Copy the contract artifact into `@0x/contract-artifacts`. If updating all the artifacts at once, you can use `yarn artifacts_update`. If manually coping an artifact, make sure to use `yarn artifacts_transform` to remove unwanted fields.
3. Regenerate the wrappers. `cd ../contract-wrappers && yarn rebuild`
