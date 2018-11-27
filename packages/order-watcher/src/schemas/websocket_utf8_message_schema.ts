export const webSocketUtf8MessageSchema = {
    id: '/WebSocketUtf8MessageSchema',
    properties: {
        utf8Data: { type: 'string' },
    },
    type: 'object',
    required: ['utf8Data'],
};
