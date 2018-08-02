export const relayerApiOrderSchema = {
    id: '/relayerApiOrderSchema',
    type: 'object',
    properties: {
        order: { $ref: '/orderSchema' },
        remainingFillableAmount: { $ref: '/numberSchema' },
    },
    required: ['order', 'remainingFillableAmount'],
};
