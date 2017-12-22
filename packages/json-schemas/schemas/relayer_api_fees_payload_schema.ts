export const relayerApiFeesPayloadSchema = {
    id: '/RelayerApiFeesPayload',
    type: 'object',
    properties: {
        exchangeContractAddress: { $ref: '/Address' },
        maker: { $ref: '/Address' },
        taker: { $ref: '/Address' },
        makerTokenAddress: { $ref: '/Address' },
        takerTokenAddress: { $ref: '/Address' },
        makerTokenAmount: { $ref: '/Number' },
        takerTokenAmount: { $ref: '/Number' },
        expirationUnixTimestampSec: { $ref: '/Number' },
        salt: { $ref: '/Number' },
    },
    required: [
        'exchangeContractAddress',
        'maker',
        'taker',
        'makerTokenAddress',
        'takerTokenAddress',
        'expirationUnixTimestampSec',
        'salt',
    ],
};
