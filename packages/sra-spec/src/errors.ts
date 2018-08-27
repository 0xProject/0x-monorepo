import { examples } from './examples';
export const errorResponses = {
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
