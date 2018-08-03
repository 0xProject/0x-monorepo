import { ResponsesObject } from '@loopback/openapi-v3-types';

import { errorResponses } from './errors';
import { headers } from './headers';

export const generateResponses = (schemaName: string, example: any): ResponsesObject => ({
    '200': {
        headers,
        description: 'OK',
        content: {
            'application/json': {
                schema: { $ref: `#/components/schemas/${schemaName}` },
            },
        },
    },
    ...errorResponses,
});
