export const relayerApiOrderbookChannelUpdateSchema = {
    id: '/RelayerApiOrderbookChannelUpdate',
    type: 'object',
    properties: {
        type: { enum: ['update'] },
        channel: { enum: ['orderbook'] },
        requestId: { type: 'number' },
        payload: { $ref: '/SignedOrder' },
    },
    required: ['type', 'channel', 'requestId', 'payload'],
};
