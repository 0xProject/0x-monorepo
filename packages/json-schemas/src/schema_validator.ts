import {Schema, Validator, ValidatorResult} from 'jsonschema';
import values = require('lodash.values');

import {schemas} from './schemas';

export class SchemaValidator {
    private validator: Validator;
    constructor() {
        this.validator = new Validator();
        for (const schema of values(schemas)) {
            this.validator.addSchema(schema, schema.id);
        }
    }
    public addSchema(schema: Schema) {
        this.validator.addSchema(schema, schema.id);
    }
    // In order to validate a complex JS object using jsonschema, we must replace any complex
    // sub-types (e.g BigNumber) with a simpler string representation. Since BigNumber and other
    // complex types implement the `toString` method, we can stringify the object and
    // then parse it. The resultant object can then be checked using jsonschema.
    public validate(instance: any, schema: Schema): ValidatorResult {
        const jsonSchemaCompatibleObject = JSON.parse(JSON.stringify(instance));
        return this.validator.validate(jsonSchemaCompatibleObject, schema);
    }
    public isValid(instance: any, schema: Schema): boolean {
        const isValid = this.validate(instance, schema).errors.length === 0;
        return isValid;
    }
}
