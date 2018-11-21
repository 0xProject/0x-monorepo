export const txOptsSchema = {
    id: '/TxOpts',
    properties: {
        gasPrice: { $ref: '/numberSchema' },
        gasLimit: { type: 'number' },
        nonce: { type: 'number' },
    },
    type: 'object',
};
