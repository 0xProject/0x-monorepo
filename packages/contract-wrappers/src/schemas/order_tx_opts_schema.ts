export const orderTxOptsSchema = {
    id: '/OrderTxOpts',
    allOf: [{ $ref: '/TxOpts' }],
    properties: {
        shouldValidate: { type: 'boolean' },
    },
    type: 'object',
};
