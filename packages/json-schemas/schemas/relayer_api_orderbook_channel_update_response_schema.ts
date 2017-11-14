export const relayerApiOrderbookChannelUpdateSchema = {
    id: '/RelayerApiOrderbookChannelUpdate',
    type: 'object',
    properties: {
        type: {enum: ['update']},
        channel: {enum: ['orderbook']},
        channelId: {type: 'number'},
        payload: {$ref: '/SignedOrder'},
    },
    required: ['type', 'channel', 'channelId', 'payload'],
};
