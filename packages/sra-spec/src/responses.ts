import { ResponsesObject } from '@loopback/openapi-v3-types';

import { errorResponses } from './errors';
import { headers } from './headers';

export const generateResponses = (schemaName?: string, example?: any, description: string = 'OK'): ResponsesObject => {
    const responses = {
        '200': {
            headers,
            description,
            content: {},
        },
        ...errorResponses,
    };
    if (schemaName) {
        responses['200'].content = {
            'application/json': {
                schema: { $ref: `#/components/schemas/${schemaName}` },
                example,
            },
        };
    }
    return responses;
};
