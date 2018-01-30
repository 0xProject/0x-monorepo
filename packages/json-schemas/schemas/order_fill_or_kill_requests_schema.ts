export const orderFillOrKillRequestsSchema = {
    id: '/OrderFillOrKillRequests',
    type: 'array',
    items: {
        properties: {
            signedOrder: { $ref: '/SignedOrder' },
            fillTakerAmount: { $ref: '/Number' },
        },
        required: ['signedOrder', 'fillTakerAmount'],
        type: 'object',
    },
};
