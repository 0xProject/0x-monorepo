export const nodeWebSocketOrderbookChannelConfigSchema = {
    id: '/NodeWebSocketOrderbookChannelConfig',
    type: 'object',
    properties: {
        heartbeatIntervalMs: {
            type: 'number',
            minimum: 10,
        },
    },
};
