export const relayerApiOrderbookChannelSubscribeSchema = {
    id: '/RelayerApiOrderbookChannelSubscribe',
    type: 'object',
    properties: {
        type: {enum: ['subscribe']},
        channel: {enum: ['orderbook']},
        payload: {$ref: '/RelayerApiOrderbookChannelSubscribePayload'},
    },
    required: ['type', 'channel', 'payload'],
};

export const relayerApiOrderbookChannelSubscribePayload = {
    id: '/RelayerApiOrderbookChannelSubscribePayload',
    type: 'object',
    properties: {
        baseTokenAddress: {$ref: '/Address'},
        quoteTokenAddress: {$ref: '/Address'},
        snapshot: {type: 'boolean'},
        limit: {type: 'number'},
    },
    required: ['baseTokenAddress', 'quoteTokenAddress'],
};
