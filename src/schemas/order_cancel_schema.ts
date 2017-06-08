export const orderCancellationRequestsSchema = {
    id: '/OrderCancellationRequests',
    type: 'array',
    items: {
        properties: {
            order: {$ref: '/orderSchema'},
            takerTokenFillAmount: {type: '/numberSchema'},
        },
        required: ['order', 'takerTokenFillAmount'],
        type: 'object',
    },
};
