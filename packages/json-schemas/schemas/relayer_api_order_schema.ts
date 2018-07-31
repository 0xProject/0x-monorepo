export const relayerApiOrderSchema = {
    id: '/RelayerApiOrder',
    type: 'object',
    properties: {
        order: { $ref: '/Order' },
        remainingFillableAmount: { $ref: '/Number' },
    },
    required: ['order', 'remainingFillableAmount'],
};
