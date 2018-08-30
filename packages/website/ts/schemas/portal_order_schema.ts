export const portalOrderSchema = {
    id: '/PortalOrder',
    properties: {
        signedOrder: { $ref: '/signedOrderSchema' },
        metadata: { $ref: '/OrderMetadata' },
    },
    required: ['signedOrder', 'metadata'],
    type: 'object',
};
