export const orderFillRequestsSchema = {
    id: '/OrderFillRequests',
    type: 'array',
    items: {
        properties: {
            signedOrder: {$ref: '/signedOrderSchema'},
            takerTokenFillAmount: {$ref: '/numberSchema'},
        },
        required: ['signedOrder', 'takerTokenFillAmount'],
        type: 'object',
    },
};
