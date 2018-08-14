export const ordersRequestOptsSchema = {
    id: '/OrdersRequestOpts',
    type: 'object',
    properties: {
        exchangeAddress: { $ref: '/Address' },
        tokenAddress: { $ref: '/Address' },
        makerTokenAddress: { $ref: '/Address' },
        takerTokenAddress: { $ref: '/Address' },
        assetDataA: { $ref: '/Address' },
        assetDataB: { $ref: '/Address' },
        maker: { $ref: '/Address' },
        taker: { $ref: '/Address' },
        trader: { $ref: '/Address' },
        feeRecipient: { $ref: '/Address' },
    },
};
