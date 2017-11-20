json-schemas
------------

Contains 0x-related json schemas

## Install:

```bash
npm install @0xproject/json-schemas --save
```

## Usage:
```
import {SchemaValidator, ValidatorResult, schemas} from '@0xproject/json-schemas';

const {orderSchema} = schemas;
const validator = new SchemaValidator();

const order = {
    ...
};
const validatorResult: ValidatorResult = validator.validate(order, orderSchema); // Contains all errors
const isValid: boolean = validator.isValid(order, orderSchema); // Only returns boolean
```
