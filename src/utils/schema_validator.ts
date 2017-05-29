import {Validator, ValidatorResult} from 'jsonschema';
import {ecSignatureSchema, ecSignatureParameter} from '../schemas/ec_signature_schema';

export class SchemaValidator {
    private validator: Validator;
    constructor() {
        this.validator = new Validator();
        this.validator.addSchema(ecSignatureParameter, ecSignatureParameter.id);
        this.validator.addSchema(ecSignatureSchema, ecSignatureSchema.id);
    }
    public validate(instance: object, schema: Schema): ValidatorResult {
        return this.validator.validate(instance, schema);
    }
}
