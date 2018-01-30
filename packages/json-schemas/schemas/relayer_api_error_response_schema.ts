export const relayerApiErrorResponseSchema = {
    id: '/RelayerApiErrorResponse',
    type: 'object',
    properties: {
        code: { type: 'number' },
        reason: { type: 'string' },
        validationErrors: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    field: { type: 'string' },
                    code: { type: 'number' },
                    reason: { type: 'string' },
                },
                required: ['field', 'code', 'reason'],
            },
        },
    },
    required: ['code', 'reason'],
};
