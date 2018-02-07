export const orderTakerSchema = {
    id: '/OrderTaker',
    properties: {
        address: { type: 'string' },
        token: { $ref: '/Token' },
    },
    required: ['address', 'token'],
    type: 'object',
};
