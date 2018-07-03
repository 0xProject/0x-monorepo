export const txOptsSchema = {
    id: '/TxOpts',
    properties: {
        gasPrice: { $ref: '/Number' },
        gasLimit: { type: 'number' },
    },
    type: 'object',
};
