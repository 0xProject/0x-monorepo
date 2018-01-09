export const relayerApiOrderbookChannelSnapshotSchema = {
    id: '/RelayerApiOrderbookChannelSnapshot',
    type: 'object',
    properties: {
        type: { enum: ['snapshot'] },
        channel: { enum: ['orderbook'] },
        requestId: { type: 'number' },
        payload: { $ref: '/RelayerApiOrderbookChannelSnapshotPayload' },
    },
    required: ['type', 'channel', 'requestId', 'payload'],
};

export const relayerApiOrderbookChannelSnapshotPayload = {
    id: '/RelayerApiOrderbookChannelSnapshotPayload',
    type: 'object',
    properties: {
        bids: { $ref: '/signedOrdersSchema' },
        asks: { $ref: '/signedOrdersSchema' },
    },
    required: ['bids', 'asks'],
};
