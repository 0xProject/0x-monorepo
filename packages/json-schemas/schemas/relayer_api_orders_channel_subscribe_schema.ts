export const relayerApiOrdersChannelSubscribeSchema = {
    id: '/RelayerApiOrdersChannelSubscribe',
    type: 'object',
    properties: {
        type: { enum: ['subscribe'] },
        channel: { enum: ['orders'] },
        requestId: { type: 'string' },
        payload: { $ref: '/RelayerApiOrdersChannelSubscribePayload' },
    },
    required: ['type', 'channel', 'requestId'],
};

export const relayerApiOrdersChannelSubscribePayload = {
    id: '/RelayerApiOrdersChannelSubscribePayload',
    type: 'object',
    properties: {
        makerAssetProxyId: { $ref: '/Hex' },
        takerAssetProxyId: { $ref: '/Hex' },
        networkId: { type: 'number' },
        makerAssetAddress: { $ref: '/Address' },
        takerAssetAddress: { $ref: '/Address' },
        makerAssetData: { $ref: '/Hex' },
        takerAssetData: { $ref: '/Hex' },
        traderAssetData: { $ref: '/Hex' },
    },
};
