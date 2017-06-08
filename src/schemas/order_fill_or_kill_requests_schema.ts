export const orderFillOrKillRequestsSchema = {
    id: '/OrderFillOrKillRequests',
    type: 'array',
    items: {
        properties: {
            signedOrder: {$ref: '/signedOrderSchema'},
            fillTakerAmount: {type: '/numberSchema'},
        },
        required: ['signedOrder', 'fillTakerAmount'],
        type: 'object',
    },
};
