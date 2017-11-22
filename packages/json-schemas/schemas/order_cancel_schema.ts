export const orderCancellationRequestsSchema = {
    id: '/OrderCancellationRequests',
    type: 'array',
    items: {
        properties: {
            order: {$ref: '/Order'},
            takerTokenCancelAmount: {$ref: '/Number'},
        },
        required: ['order', 'takerTokenCancelAmount'],
        type: 'object',
    },
};
