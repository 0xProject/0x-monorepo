export const orderTakerSchema = {
    id: '/OrderTaker',
    properties: {
        address: { type: 'string' },
        token: { $ref: '/Token' },
        amount: { type: 'string' },
    },
    required: ['address', 'token', 'amount'],
    type: 'object',
};
