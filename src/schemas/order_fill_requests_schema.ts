export const orderFillRequestsSchema = {
    id: '/OrderFillRequests',
    type: 'array',
    items: {
        properties: {
            signedOrder: {$ref: '/signedOrderSchema'},
            takerTokenFillAmount: {type: '/numberSchema'},
        },
        required: ['signedOrder', 'takerTokenFillAmount'],
        type: 'object',
    },
};
