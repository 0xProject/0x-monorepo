import { schemas } from '@0xproject/json-schemas';
import { OpenApiSpec } from '@loopback/openapi-v3-types';

import { examples } from './examples';
// We need to replace the `$ref`s to be openAPI compliant.
const openApiSchemas = JSON.parse(JSON.stringify(schemas).replace(/(\/\w+)/g, match => `#/components/schemas${match}`));

const paginationParameters = [
    {
        name: 'page',
        in: 'query',
        description: 'The number of the page to request in the collection.',
        example: 3,
        schema: {
            type: 'number',
        },
    },
    {
        name: 'per_page',
        in: 'query',
        description: 'The number of records to return per page.',
        example: 10,
        schema: {
            type: 'number',
        },
    },
];

const networkdIdParameter = {
    name: 'network_id',
    in: 'query',
    description: 'The id of the Ethereum network',
    example: 42,
    default: 1,
    schema: {
        type: 'number',
    },
};

const headers = {
    'X-Rate-Limit-Limit': {
        description: `The maximum number of requests you're permitted to make per hour.`,
        schema: {
            type: 'integer',
        },
    },
    'X-Rate-Limit-Remaining': {
        description: 'The number of requests remaining in the current rate limit window.',
        schema: {
            type: 'integer',
        },
    },
    'X-Rate-Limit-Reset': {
        description: 'The time at which the current rate limit window resets in UTC epoch seconds.',
        schema: {
            type: 'integer',
        },
    },
};

const errorResponses = {
    '400': {
        description: 'Validation error',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/relayerApiErrorResponseSchema' },
                example: examples.validationError,
            },
        },
    },
    '404': {
        description: 'Not found',
    },
    '429': {
        description: 'Too many requests - Rate limit exceeded',
    },
    '500': {
        description: 'Internal Server Error',
    },
    '501': {
        description: 'Not implemented.',
    },
};

export const api: OpenApiSpec = {
    openapi: '3.0.0',
    info: {
        version: '1.0.0',
        title: 'Standard Relayer REST API',
        description:
            '0x Protocol is an open standard. Because of this, we expect many independent applications to be built that will want to use the protocol. In order to make it easier for anyone to source liquidity that conforms to the 0x order format, relayers can opt-in to implementing a set of standard relayer API endpoints. In doing so, they allow clients of the standard relayer API to access the orders on their orderbook.',
        license: {
            name: 'Apache 2.0',
            url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
    },
    servers: [
        // TODO: Use relayer registry information here?
    ],
    paths: {
        '/asset_pairs': {
            get: {
                description:
                    'Retrieves a list of available asset pairs and the information required to trade them (in any order). Setting only `asset_data_a` or `asset_data_b` returns pairs filtered by that asset only.',
                operationId: 'getAssetPairs',
                parameters: [
                    networkdIdParameter,
                    ...paginationParameters,
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
                responses: {
                    '200': {
                        headers,
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/relayerApiAssetDataPairsResponseSchema' },
                                example: examples.relayerApiAssetDataPairsResponseSchema,
                            },
                        },
                    },
                    ...errorResponses,
                },
            },
        },
    },
    components: {
        schemas: openApiSchemas,
    },
};
