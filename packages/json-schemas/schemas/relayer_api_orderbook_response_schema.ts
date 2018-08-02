export const relayerApiOrderBookResponseSchema = {
    id: '/relayerApiOrderBookResponseSchema',
    type: 'object',
    properties: {
        bids: { $ref: '/relayerApiOrdersResponseSchema' },
        asks: { $ref: '/relayerApiOrdersResponseSchema' },
    },
    required: ['bids', 'asks'],
};
