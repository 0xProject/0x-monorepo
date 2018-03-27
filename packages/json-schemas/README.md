## @0xproject/json-schemas

Contains 0x-related json schemas

### Read the [Documentation](0xproject.com/docs/json-schemas).

## Installation

```bash
yarn add @0xproject/json-schemas
```

**Import**

```typescript
import { SchemaValidator, ValidatorResult, schemas } from '@0xproject/json-schemas';
```

or

```javascript
var schemas = require('@0xproject/json-schemas').schemas;
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0xproject/typescript-typings/types", "node_modules/@types"],
}
```

## Contributing

We strongly encourage that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

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
