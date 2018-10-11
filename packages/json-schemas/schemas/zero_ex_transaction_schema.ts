export const zeroExTransactionSchema = {
    id: '/zeroExTransactionSchema',
    properties: {
        data: { $ref: '/hexSchema' },
        signerAddress: { $ref: '/addressSchema' },
        salt: { $ref: '/numberSchema' },
    },
    required: ['data', 'salt', 'signerAddress'],
    type: 'object',
};
