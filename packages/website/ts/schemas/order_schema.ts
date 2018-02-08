export const orderSchema = {
    id: '/PortalOrder',
    properties: {
        signedOrder: { $ref: '/SignedOrder' },
        metadata: { $ref: '/OrderMetadata' },
    },
    required: ['signedOrder', 'metadata'],
    type: 'object',
};
