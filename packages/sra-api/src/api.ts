import { schemas } from '@0xproject/json-schemas';
import { OpenApiSpec } from '@loopback/openapi-v3-types';

import { examples } from './examples';
import { md } from './md';
import { generateParameters } from './parameters';
import { generateResponses } from './responses';
// We need to replace the `$ref`s to be OpenAPI compliant.
const openApiSchemas = JSON.parse(JSON.stringify(schemas).replace(/(\/\w+)/g, match => `#/components/schemas${match}`));

export const api: OpenApiSpec = {
    openapi: '3.0.0',
    info: {
        version: '2.0.0',
        title: 'Standard Relayer REST API',
        description: md.introduction,
        license: {
            name: 'Apache 2.0',
            url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
    },
    paths: {
        '/v2/asset_pairs': {
            get: {
                description:
                    'Retrieves a list of available asset pairs and the information required to trade them (in any order). Setting only `asset_data_a` or `asset_data_b` returns pairs filtered by that asset only.',
                operationId: 'getAssetPairs',
                parameters: generateParameters(
                    [
                        {
                            name: 'asset_data_a',
                            in: 'query',
                            description: 'The assetData value for the first asset in the pair.',
                            example: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'asset_data_b',
                            in: 'query',
                            description: 'The assetData value for the second asset in the pair.',
                            example: '0x0257179264389b814a946f3e92105513705ca6b990',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                    ],
                    true,
                ),
                responses: generateResponses(
                    'relayerApiAssetDataPairsResponseSchema',
                    examples.relayerApiAssetDataPairsResponse,
                    `Returns a collection of available asset pairs with some meta info`,
                ),
            },
        },
        '/v2/orders': {
            get: {
                description:
                    'Retrieves a list of orders given query parameters. This endpoint should be [paginated](#section/Pagination). For querying an entire orderbook snapshot, the [orderbook endpoint](#operation/getOrderbook) is recommended. If both makerAssetData and takerAssetData are specified, returned orders will be sorted by price determined by (takerTokenAmount/makerTokenAmount) in ascending order. By default, orders returned by this endpoint are unsorted.',
                operationId: 'getOrders',
                parameters: generateParameters(
                    [
                        {
                            name: 'makerAssetProxyId',
                            in: 'query',
                            description: `The maker [asset proxy id](https://0xproject.com/docs/0x.js#types-AssetProxyId) (example: "0xf47261b0" for ERC20, "0x02571792" for ERC721).`,
                            example: '0xf47261b0',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'takerAssetProxyId',
                            in: 'query',
                            description: `The taker asset [asset proxy id](https://0xproject.com/docs/0x.js#types-AssetProxyId) (example: "0xf47261b0" for ERC20, "0x02571792" for ERC721).`,
                            example: '0x02571792',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'makerAssetAddress',
                            in: 'query',
                            description: `The contract address for the maker asset.`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/addressSchema',
                            },
                        },
                        {
                            name: 'takerAssetAddress',
                            in: 'query',
                            description: `The contract address for the taker asset.`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/addressSchema',
                            },
                        },
                        {
                            name: 'exchangeAddress',
                            in: 'query',
                            description: `Same as exchangeAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/addressSchema',
                            },
                        },
                        {
                            name: 'senderAddress',
                            in: 'query',
                            description: `Same as senderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/addressSchema',
                            },
                        },
                        {
                            name: 'makerAssetData',
                            in: 'query',
                            description: `Same as makerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'takerAssetData',
                            in: 'query',
                            description: `Same as takerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'traderAssetData',
                            in: 'query',
                            description: `Same as traderAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'makerAddress',
                            in: 'query',
                            description: `Same as makerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/addressSchema',
                            },
                        },
                        {
                            name: 'traderAddress',
                            in: 'query',
                            description: `Same as traderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/addressSchema',
                            },
                        },
                        {
                            name: 'feeRecipientAddress',
                            in: 'query',
                            description: `Same as feeRecipientAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
                            example: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                            schema: {
                                $ref: '#/components/schemas/addressSchema',
                            },
                        },
                    ],
                    true,
                ),
                responses: generateResponses(
                    'relayerApiOrdersResponseSchema',
                    examples.relayerApiOrdersResponse,
                    `Returns a collection of 0x orders with meta-data as specified by query params`,
                ),
            },
        },
    },
    components: {
        schemas: openApiSchemas,
    },
};
