import { SchemaValidator } from '@0x/json-schemas';
import { orderMetadataSchema } from 'ts/schemas/metadata_schema';
import { portalOrderSchema } from 'ts/schemas/portal_order_schema';
import { portalTokenMetadataSchema } from 'ts/schemas/portal_token_metadata';

const validator = new SchemaValidator();
validator.addSchema(portalTokenMetadataSchema);
validator.addSchema(orderMetadataSchema);
validator.addSchema(portalOrderSchema);

export { validator };
