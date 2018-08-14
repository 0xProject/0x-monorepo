export const orderFillOrKillRequestsSchema = {
    id: '/orderFillOrKillRequestsSchema',
    type: 'array',
    items: {
        properties: {
            signedOrder: { $ref: '/signedOrderSchema' },
            fillTakerAmount: { $ref: '/numberSchema' },
        },
        required: ['signedOrder', 'fillTakerAmount'],
        type: 'object',
    },
};
