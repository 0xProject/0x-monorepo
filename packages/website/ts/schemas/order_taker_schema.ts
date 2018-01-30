export const orderTakerSchema = {
    id: '/OrderTaker',
    properties: {
        address: { type: 'string' },
        token: { $ref: '/Token' },
        amount: { type: 'string' },
        feeAmount: { type: 'string' },
    },
    required: ['address', 'token', 'amount', 'feeAmount'],
    type: 'object',
};
