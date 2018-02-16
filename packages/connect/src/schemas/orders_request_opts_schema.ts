export const ordersRequestOptsSchema = {
    id: '/OrdersRequestOpts',
    type: 'object',
    properties: {
        exchangeContractAddress: { $ref: '/Address' },
        tokenAddress: { $ref: '/Address' },
        makerTokenAddress: { $ref: '/Address' },
        takerTokenAddress: { $ref: '/Address' },
        tokenA: { $ref: '/Address' },
        tokenB: { $ref: '/Address' },
        maker: { $ref: '/Address' },
        taker: { $ref: '/Address' },
        trader: { $ref: '/Address' },
        feeRecipient: { $ref: '/Address' },
    },
};
