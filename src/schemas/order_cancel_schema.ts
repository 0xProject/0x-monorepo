export const orderCancellationRequestsSchema = {
    id: '/OrderCancellationRequests',
    type: 'array',
    items: {
        properties: {
            order: {$ref: '/orderSchema'},
            takerTokenCancellAmount: {type: '/numberSchema'},
        },
        required: ['order', 'takerTokenCancellAmount'],
        type: 'object',
    },
};
