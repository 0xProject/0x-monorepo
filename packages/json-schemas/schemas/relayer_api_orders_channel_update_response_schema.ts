export const relayerApiOrdersChannelUpdateSchema = {
    id: '/RelayerApiOrdersChannelUpdate',
    type: 'object',
    properties: {
        type: { enum: ['update'] },
        channel: { enum: ['orders'] },
        requestId: { type: 'string' },
        payload: { $ref: '/RelayerApiOrders' },
    },
    required: ['type', 'channel', 'requestId', 'payload'],
};
