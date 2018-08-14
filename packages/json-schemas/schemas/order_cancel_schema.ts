export const orderCancellationRequestsSchema = {
    id: '/orderCancellationRequestsSchema',
    type: 'array',
    items: {
        properties: {
            order: { $ref: '/orderSchema' },
            takerTokenCancelAmount: { $ref: '/numberSchema' },
        },
        required: ['order', 'takerTokenCancelAmount'],
        type: 'object',
    },
};
