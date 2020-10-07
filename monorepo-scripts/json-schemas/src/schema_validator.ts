import { Schema, Validator, ValidatorResult } from 'jsonschema';
import values = require('lodash.values');

import { schemas } from './schemas';

/**
 * A validator for [JSON-schemas](http://json-schema.org/)
 */
export class SchemaValidator {
    private readonly _validator: Validator;
    private static _assertSchemaDefined(schema: Schema): void {
        if (schema === undefined) {
            throw new Error(`Cannot add undefined schema`);
        }
    }
    /**
     * Instantiates a SchemaValidator instance
     */
    constructor() {
        this._validator = new Validator();
        for (const schema of values(schemas)) {
            SchemaValidator._assertSchemaDefined(schema);
            this._validator.addSchema(schema, schema.id);
        }
    }
    /**
     * Add a schema to the validator. All schemas and sub-schemas must be added to
     * the validator before the `validate` and `isValid` methods can be called with
     * instances of that schema.
     * @param schema The schema to add
     */
    public addSchema(schema: Schema): void {
        SchemaValidator._assertSchemaDefined(schema);
        this._validator.addSchema(schema, schema.id);
    }
    // In order to validate a complex JS object using jsonschema, we must replace any complex
    // sub-types (e.g BigNumber) with a simpler string representation. Since BigNumber and other
    // complex types implement the `toString` method, we can stringify the object and
    // then parse it. The resultant object can then be checked using jsonschema.
    /**
     * Validate the JS object conforms to a specific JSON schema
     * @param instance JS object in question
     * @param schema Schema to check against
     * @returns The results of the validation
     */
    public validate(instance: any, schema: Schema): ValidatorResult {
        SchemaValidator._assertSchemaDefined(schema);
        const jsonSchemaCompatibleObject = JSON.parse(JSON.stringify(instance));
        return this._validator.validate(jsonSchemaCompatibleObject, schema);
    }
    /**
     * Check whether an instance properly adheres to a JSON schema
     * @param instance JS object in question
     * @param schema Schema to check against
     * @returns Whether or not the instance adheres to the schema
     */
    public isValid(instance: any, schema: Schema): boolean {
        const isValid = this.validate(instance, schema).errors.length === 0;
        return isValid;
    }
}
