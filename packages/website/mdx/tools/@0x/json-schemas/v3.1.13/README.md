## @0x/json-schemas

Contains 0x-related json schemas

### Read the [Documentation](https://0xproject.com/docs/json-schemas).

## Installation

```bash
yarn add @0x/json-schemas
```

**Import**

```typescript
import { SchemaValidator, ValidatorResult, schemas } from '@0x/json-schemas';
```

or

```javascript
var schemas = require('@0x/json-schemas').schemas;
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
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
PKG=@0x/json-schemas yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/json-schemas yarn watch
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