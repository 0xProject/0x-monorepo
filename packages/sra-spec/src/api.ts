import { OpenApiSpec } from '@loopback/openapi-v3-types';

import { examples } from './examples';
import { schemas } from './json-schemas';
import { md } from './md';
import { generateParameters } from './parameters';
import { generateResponses } from './responses';

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
                    'Retrieves a list of available asset pairs and the information required to trade them (in any order). Setting only `assetDataA` or `assetDataB` returns pairs filtered by that asset only.',
                operationId: 'getAssetPairs',
                parameters: generateParameters(
                    [
                        {
                            name: 'assetDataA',
                            in: 'query',
                            description: 'The assetData value for the first asset in the pair.',
                            example: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'assetDataB',
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
                            description: `The maker asset proxy id (example: "0xf47261b0" for ERC20, "0x02571792" for ERC721).`,
                            example: '0xf47261b0',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'takerAssetProxyId',
                            in: 'query',
                            description: `The taker asset asset proxy id (example: "0xf47261b0" for ERC20, "0x02571792" for ERC721).`,
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
                            name: 'takerAddress',
                            in: 'query',
                            description: `Same as takerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)`,
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
                    `A collection of 0x orders with meta-data as specified by query params`,
                ),
            },
        },
        '/v2/order/{orderHash}': {
            get: {
                description: 'Retrieves the 0x order with meta info that is associated with the hash.',
                operationId: 'getOrder',
                parameters: generateParameters(
                    [
                        {
                            name: 'orderHash',
                            in: 'path',
                            description: 'The hash of the desired 0x order.',
                            example: '0xd4b103c42d2512eef3fee775e097f044291615d25f5d71e0ac70dbd49d223591',
                            schema: {
                                $ref: '#/components/schemas/orderHashSchema',
                            },
                        },
                    ],
                    false,
                ),
                responses: generateResponses(
                    'relayerApiOrderSchema',
                    examples.relayerApiOrder,
                    `The order and meta info associated with the orderHash`,
                ),
            },
        },
        '/v2/orderbook': {
            get: {
                description: `Retrieves the orderbook for a given asset pair. This endpoint should be [paginated](#section/Pagination). Bids will be sorted in descending order by price, and asks will be sorted in ascending order by price. Within the price sorted orders, the orders are further sorted by _taker fee price_ which is defined as the **takerFee** divided by **takerTokenAmount**. After _taker fee price_, orders are to be sorted by expiration in ascending order. The way pagination works for this endpoint is that the **page** and **perPage** query params apply to both \`bids\` and \`asks\` collections, and if \`page\` * \`perPage\` > \`total\` for a certain collection, the \`records\` for that collection should just be empty. `,
                operationId: 'getOrderbook',
                parameters: generateParameters(
                    [
                        {
                            name: 'baseAssetData',
                            in: 'query',
                            description: `assetData (makerAssetData or takerAssetData) designated as the base currency in the [currency pair calculation](https://en.wikipedia.org/wiki/Currency_pair) of price.`,
                            required: true,
                            example: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                        {
                            name: 'quoteAssetData',
                            in: 'query',
                            description: `assetData (makerAssetData or takerAssetData) designated as the quote currency in the currency pair calculation of price (required).`,
                            required: true,
                            example: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
                            schema: {
                                $ref: '#/components/schemas/hexSchema',
                            },
                        },
                    ],
                    true,
                ),
                responses: generateResponses(
                    'relayerApiOrderbookResponseSchema',
                    examples.relayerApiOrderbookResponse,
                    `The sorted order book for the specified asset pair.`,
                ),
            },
        },
        '/v2/order_config': {
            post: {
                description: `Relayers have full discretion over the orders that they are willing to host on their orderbooks (e.g what fees they charge, etc...). In order for traders to discover their requirements programmatically, they can send an incomplete order to this endpoint and receive the missing fields, specifc to that order. This gives relayers a large amount of flexibility to tailor fees to unique traders, trading pairs and volume amounts. Submit a partial order and receive information required to complete the order: \`senderAddress\`, \`feeRecipientAddress\`, \`makerFee\`, \`takerFee\`. `,
                operationId: 'getOrderConfig',
                parameters: generateParameters([], false),
                requestBody: {
                    description:
                        'The fields of a 0x order the relayer may want to decide what configuration to send back.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/relayerApiOrderConfigPayloadSchema',
                            },
                            example: examples.relayerApiOrderConfigPayload,
                        },
                    },
                },
                responses: generateResponses(
                    'relayerApiOrderConfigResponseSchema',
                    examples.relayerApiOrderConfigResponse,
                    `The additional fields necessary in order to submit an order to the relayer.`,
                ),
            },
        },
        '/v2/fee_recipients': {
            get: {
                description: `Retrieves a collection of all fee recipient addresses for a relayer. This endpoint should be [paginated](#section/Pagination).`,
                operationId: 'getFeeRecipients',
                parameters: generateParameters([], true),
                responses: generateResponses(
                    'relayerApiFeeRecipientsResponseSchema',
                    examples.relayerApiFeeRecipientsResponse,
                    `A collection of all used fee recipient addresses.`,
                ),
            },
        },
        '/v2/order': {
            post: {
                description: `Submit a signed order to the relayer.`,
                operationId: 'postOrder',
                parameters: generateParameters([], false),
                requestBody: {
                    description: 'A valid signed 0x order based on the schema.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/signedOrderSchema',
                            },
                            example: examples.signedOrder,
                        },
                    },
                },
                responses: generateResponses(),
            },
        },
    },
    components: {
        schemas,
    },
};
