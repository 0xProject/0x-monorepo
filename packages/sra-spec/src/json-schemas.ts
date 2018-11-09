import { schemas as jsonSchemas } from '@0x/json-schemas';

// Only include schemas we actually need
const {
    wholeNumberSchema,
    numberSchema,
    addressSchema,
    hexSchema,
    orderHashSchema,
    orderSchema,
    signedOrderSchema,
    signedOrdersSchema,
    ordersSchema,
    paginatedCollectionSchema,
    relayerApiErrorResponseSchema,
    relayerApiFeeRecipientsResponseSchema,
    relayerApiOrderSchema,
    relayerApiOrdersSchema,
    relayerApiOrderConfigPayloadSchema,
    relayerApiOrderConfigResponseSchema,
    relayerApiOrderbookResponseSchema,
    relayerApiAssetDataPairsResponseSchema,
    relayerApiAssetDataTradeInfoSchema,
    relayerApiOrdersChannelSubscribeSchema,
    relayerApiOrdersChannelSubscribePayloadSchema,
    relayerApiOrdersChannelUpdateSchema,
    relayerApiOrdersResponseSchema,
    relayerApiAssetDataPairsSchema,
} = jsonSchemas;

const usedSchemas = {
    wholeNumberSchema,
    numberSchema,
    addressSchema,
    hexSchema,
    orderHashSchema,
    orderSchema,
    signedOrderSchema,
    signedOrdersSchema,
    ordersSchema,
    paginatedCollectionSchema,
    relayerApiErrorResponseSchema,
    relayerApiFeeRecipientsResponseSchema,
    relayerApiOrderSchema,
    relayerApiOrdersSchema,
    relayerApiOrderConfigPayloadSchema,
    relayerApiOrderConfigResponseSchema,
    relayerApiOrderbookResponseSchema,
    relayerApiAssetDataPairsResponseSchema,
    relayerApiAssetDataTradeInfoSchema,
    relayerApiOrdersChannelSubscribeSchema,
    relayerApiOrdersChannelSubscribePayloadSchema,
    relayerApiOrdersChannelUpdateSchema,
    relayerApiOrdersResponseSchema,
    relayerApiAssetDataPairsSchema,
};

// We need to replace the `$ref`s to be OpenAPI compliant.
const openApiSchemas = JSON.parse(
    JSON.stringify(usedSchemas).replace(/(\/\w+)/g, match => `#/components/schemas${match}`),
);
// The json schema used by OpenAPI does not accept ids
Object.keys(openApiSchemas).forEach(key => delete openApiSchemas[key].id);

export const schemas = openApiSchemas;
