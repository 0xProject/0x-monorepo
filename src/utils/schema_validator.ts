import {Validator, ValidatorResult} from 'jsonschema';
import {ECSignatureSchema, ECSignatureParameter} from '../schemas/ec_signature_schema';

export class SchemaValidator {
    private validator: Validator;
    constructor() {
        this.validator = new Validator();
        this.validator.addSchema(ECSignatureParameter, ECSignatureParameter.id);
        this.validator.addSchema(ECSignatureSchema, ECSignatureSchema.id);
    }
    public validate(instance: object, schema: Schema): ValidatorResult {
        return this.validator.validate(instance, schema);
    }
}
