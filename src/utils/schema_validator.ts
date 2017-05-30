import {Validator, ValidatorResult} from 'jsonschema';
import {ecSignatureSchema, ecSignatureParameter} from '../schemas/ec_signature_schema';
import {addressSchema, bigNumberSchema, orderSchema, signedOrderSchema} from '../schemas/signed_order_schema';

export class SchemaValidator {
    private validator: Validator;
    constructor() {
        this.validator = new Validator();
        this.validator.addSchema(orderSchema, orderSchema.id);
        this.validator.addSchema(addressSchema, addressSchema.id);
        this.validator.addSchema(bigNumberSchema, bigNumberSchema.id);
        this.validator.addSchema(ecSignatureSchema, ecSignatureSchema.id);
        this.validator.addSchema(signedOrderSchema, signedOrderSchema.id);
        this.validator.addSchema(ecSignatureParameter, ecSignatureParameter.id);
    }
    public validate(instance: object, schema: Schema): ValidatorResult {
        return this.validator.validate(instance, schema);
    }
}
