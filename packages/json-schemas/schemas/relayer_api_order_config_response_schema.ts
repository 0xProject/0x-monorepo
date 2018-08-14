export const relayerApiOrderConfigResponseSchema = {
    id: '/relayerApiOrderConfigResponseSchema',
    type: 'object',
    properties: {
        makerFee: { $ref: '/numberSchema' },
        takerFee: { $ref: '/numberSchema' },
        feeRecipientAddress: { $ref: '/addressSchema' },
        senderAddress: { $ref: '/addressSchema' },
    },
    required: ['makerFee', 'takerFee', 'feeRecipientAddress', 'senderAddress'],
};
