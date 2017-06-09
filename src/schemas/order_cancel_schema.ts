export const orderCancellationRequestsSchema = {
    id: '/OrderCancellationRequests',
    type: 'array',
    items: {
        properties: {
            order: {$ref: '/orderSchema'},
            takerTokenCancelAmount: {$ref: '/numberSchema'},
        },
        required: ['order', 'takerTokenCancelAmount'],
        type: 'object',
    },
};
