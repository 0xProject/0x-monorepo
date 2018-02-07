export const orderSchema = {
    id: '/Order',
    properties: {
        signedOrder: { $ref: '/SignedOrder' },
        metadata: { $ref: '/OrderMetadata' },
    },
    required: ['signedOrder', 'metadata'],
    type: 'object',
};
