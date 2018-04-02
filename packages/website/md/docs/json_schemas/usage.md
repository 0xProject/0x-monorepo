The following example shows you how to validate a 0x order using the `@0xproject/json-schemas` package.

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
