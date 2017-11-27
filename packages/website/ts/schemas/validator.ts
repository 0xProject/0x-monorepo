import {Validator, Schema as JSONSchema} from 'jsonschema';
import {signatureDataSchema} from 'ts/schemas/signature_data_schema';
import {orderSchema} from 'ts/schemas/order_schema';
import {tokenSchema} from 'ts/schemas/token_schema';
import {orderTakerSchema} from 'ts/schemas/order_taker_schema';

export class SchemaValidator {
    private validator: Validator;
    constructor() {
        this.validator = new Validator();
        this.validator.addSchema(signatureDataSchema as JSONSchema, signatureDataSchema.id);
        this.validator.addSchema(tokenSchema as JSONSchema, tokenSchema.id);
        this.validator.addSchema(orderTakerSchema as JSONSchema, orderTakerSchema.id);
        this.validator.addSchema(orderSchema as JSONSchema, orderSchema.id);
    }
    public validate(instance: object, schema: Schema) {
        return this.validator.validate(instance, schema);
    }
}
