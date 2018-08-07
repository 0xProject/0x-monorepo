import { schemas } from '@0xproject/json-schemas';
import { OpenApiSpec } from '@loopback/openapi-v3-types';

import { examples } from './examples';
import { md } from './md';
import { generateParameters } from './parameters';
import { generateResponses } from './responses';
// We need to replace the `$ref`s to be openAPI compliant.
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
    servers: [
        // TODO: Use relayer registry information here?
    ],
    paths: {
        '/asset_pairs': {
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
                    examples.relayerApiAssetDataPairsResponseSchema,
                ),
            },
        },
    },
    components: {
        schemas: openApiSchemas,
    },
};
