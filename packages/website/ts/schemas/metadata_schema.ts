export const orderMetadataSchema = {
    id: '/OrderMetadata',
    properties: {
        makerToken: { $ref: '/Token' },
        takerToken: { $ref: '/Token' },
    },
    required: ['makerToken', 'takerToken'],
    type: 'object',
};
