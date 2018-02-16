export const webSocketOrderbookChannelConfigSchema = {
    id: '/WebSocketOrderbookChannelConfig',
    type: 'object',
    properties: {
        heartbeatIntervalMs: {
            type: 'number',
            minimum: 10,
        },
    },
};
