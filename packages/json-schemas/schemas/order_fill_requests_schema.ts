export const orderFillRequestsSchema = {
    id: '/orderFillRequestsSchema',
    type: 'array',
    items: {
        properties: {
            signedOrder: { $ref: '/signedOrderSchema' },
            takerTokenFillAmount: { $ref: '/numberSchema' },
        },
        required: ['signedOrder', 'takerTokenFillAmount'],
        type: 'object',
    },
};
