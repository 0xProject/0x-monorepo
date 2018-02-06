## @0xproject/json-schemas

Contains 0x-related json schemas

## Installation

```bash
yarn add @0xproject/json-schemas
```

## Usage

```javascript
import {SchemaValidator, ValidatorResult, schemas} from '@0xproject/json-schemas';

const {orderSchema} = schemas;
const validator = new SchemaValidator();

const order = {
    ...
};
const validatorResult: ValidatorResult = validator.validate(order, orderSchema); // Contains all errors
const isValid: boolean = validator.isValid(order, orderSchema); // Only returns boolean
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
