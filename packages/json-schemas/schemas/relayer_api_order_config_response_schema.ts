export const relayerApiOrderConfigResponseSchema = {
    id: '/RelayerApiOrderConfigResponse',
    type: 'object',
    properties: {
        makerFee: { $ref: '/Number' },
        takerFee: { $ref: '/Number' },
        feeRecipientAddress: { $ref: '/Address' },
        senderAddress: { $ref: '/Address' },
    },
    required: ['makerFee', 'takerFee', 'feeRecipientAddress', 'senderAddress'],
};
