export const orderFillRequestsSchema = {
    id: '/OrderFillRequests',
    type: 'array',
    items: {
        properties: {
            signedOrder: {$ref: '/SignedOrder'},
            takerTokenFillAmount: {$ref: '/Number'},
        },
        required: ['signedOrder', 'takerTokenFillAmount'],
        type: 'object',
    },
};
