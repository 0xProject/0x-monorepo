export const orderMetadataSchema = {
    id: '/OrderMetadata',
    properties: {
        makerToken: { $ref: '/PortalTokenMetadata' },
        takerToken: { $ref: '/PortalTokenMetadata' },
    },
    required: ['makerToken', 'takerToken'],
    type: 'object',
};
