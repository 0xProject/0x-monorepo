export const relayerApiOrderBookResponseSchema = {
    id: '/RelayerApiOrderBookResponse',
    type: 'object',
    properties: {
        bids: { $ref: '/signedOrdersSchema' },
        asks: { $ref: '/signedOrdersSchema' },
    },
    required: ['bids', 'asks'],
};
