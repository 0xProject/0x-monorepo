export const relayerApiOrderBookResponseSchema = {
    id: '/RelayerApiOrderBookResponse',
    type: 'object',
    properties: {
        bids: { $ref: '/RelayerApiOrdersResponse' },
        asks: { $ref: '/RelayerApiOrdersResponse' },
    },
    required: ['bids', 'asks'],
};
