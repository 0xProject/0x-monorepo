import {Validator, ValidatorResult} from 'jsonschema';
import {ecSignatureSchema, ecSignatureParameter} from '../schemas/ec_signature_schema';
import {tokenSchema} from '../schemas/token_schema';

export class SchemaValidator {
    private validator: Validator;
    constructor() {
        this.validator = new Validator();
        this.validator.addSchema(ecSignatureParameter, ecSignatureParameter.id);
        this.validator.addSchema(ecSignatureSchema, ecSignatureSchema.id);
        this.validator.addSchema(tokenSchema, tokenSchema.id);
    }
    public validate(instance: object, schema: Schema): ValidatorResult {
        return this.validator.validate(instance, schema);
    }
}
