export const txOptsSchema = {
    id: '/TxOpts',
    properties: {
        gasPrice: { $ref: '/numberSchema' },
        gasLimit: { type: 'number' },
    },
    type: 'object',
};
