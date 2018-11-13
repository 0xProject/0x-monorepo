## @0x/abi-gen-wrappers

Low-level 0x smart contract wrappers generated using @0x/abi-gen. These
low-level wrappers are imported by other packages in the 0x monorepo and
application developers are not expected to import this package directly.

You may also be interested in the
[@0x/contract-wrappers](../contract-wrappers/README.md) package which
includes some higher-level features.

## Installation

```bash
yarn add @0x/abi-gen-wrappers
```

**Import**

```typescript
import * as wrappers from '@0x/abi-gen-wrappers';
```

or

```javascript
var wrappers = require('@0x/abi-gen-wrappers');
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
PKG=@0x/abi-gen-wrappers yarn build
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
