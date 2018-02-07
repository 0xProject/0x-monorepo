export const orderMetadataSchema = {
    id: '/OrderMetadata',
    properties: {
        makerToken: { $ref: '/Token' },
        takerToken: { $ref: '/Token' },
        networkId: { type: 'number' },
    },
    required: ['makerToken', 'takerToken', 'networkId'],
    type: 'object',
};
