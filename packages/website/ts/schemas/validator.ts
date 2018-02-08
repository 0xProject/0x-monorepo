import { SchemaValidator } from '@0xproject/json-schemas';
import { Schema as JSONSchema, Validator } from 'jsonschema';
import { orderMetadataSchema } from 'ts/schemas/metadata_schema';
import { orderSchema } from 'ts/schemas/order_schema';
import { tokenSchema } from 'ts/schemas/token_schema';

const validator = new SchemaValidator();
validator.addSchema(tokenSchema);
validator.addSchema(orderMetadataSchema);
validator.addSchema(orderSchema);

export { validator };
