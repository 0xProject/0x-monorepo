export const relayerApiErrorResponseSchema = {
    id: '/relayerApiErrorResponseSchema',
    type: 'object',
    properties: {
        code: { type: 'number', minimum: 100, maximum: 103 },
        reason: { type: 'string' },
        validationErrors: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    field: { type: 'string' },
                    code: { type: 'number', minimum: 1000, maximum: 1006 },
                    reason: { type: 'string' },
                },
                required: ['field', 'code', 'reason'],
            },
        },
    },
    required: ['code', 'reason'],
};
