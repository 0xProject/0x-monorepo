export const eip712TypedDataSchema = {
    id: '/eip712TypedData',
    type: 'object',
    properties: {
        types: {
            type: 'object',
            properties: {
                EIP712Domain: { type: 'array' },
            },
            additionalProperties: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                    },
                    required: ['name', 'type'],
                },
            },
            required: ['EIP712Domain'],
        },
        primaryType: { type: 'string' },
        domain: { type: 'object' },
        message: { type: 'object' },
    },
    required: ['types', 'primaryType', 'domain', 'message'],
};
