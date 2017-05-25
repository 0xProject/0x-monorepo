import {Validator as V, ValidatorResult} from 'jsonschema';
import {ECSignatureSchema} from '../schemas/ec_signature_schema';

export class SchemaValidator {
    private v: V;
    constructor() {
        this.v = new V();
        this.v.addSchema(ECSignatureSchema, ECSignatureSchema.id);
    }
    public validate(instance: object, schema: Schema): ValidatorResult {
        return this.v.validate(instance, schema);
    }
}
