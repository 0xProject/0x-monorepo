export const relayerApiOrdersChannelSubscribeSchema = {
    id: '/relayerApiOrdersChannelSubscribeSchema',
    type: 'object',
    properties: {
        type: { enum: ['subscribe'] },
        channel: { enum: ['orders'] },
        requestId: { type: 'string' },
        payload: { $ref: '/relayerApiOrdersChannelSubscribePayload' },
    },
    required: ['type', 'channel', 'requestId'],
};

export const relayerApiOrdersChannelSubscribePayload = {
    id: '/relayerApiOrdersChannelSubscribePayload',
    type: 'object',
    properties: {
        makerAssetProxyId: { $ref: '/hexSchema' },
        takerAssetProxyId: { $ref: '/hexSchema' },
        networkId: { type: 'number' },
        makerAssetAddress: { $ref: '/addressSchema' },
        takerAssetAddress: { $ref: '/addressSchema' },
        makerAssetData: { $ref: '/hexSchema' },
        takerAssetData: { $ref: '/hexSchema' },
        traderAssetData: { $ref: '/hexSchema' },
    },
};
