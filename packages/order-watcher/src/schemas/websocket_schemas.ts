export const webSocketUtf8MessageSchema = {
    id: '/webSocketUtf8MessageSchema',
    properties: {
        utf8Data: { type: 'string' },
    },
    type: 'object',
    required: ['utf8Data'],
};

export const webSocketRequestSchema = {
    id: '/webSocketRequestSchema',
    properties: {
        action: { enum: ['GET_STATS', 'ADD_ORDER', 'REMOVE_ORDER'] },
        signedOrder: { $ref: '/signedOrderSchema' },
        orderHash: { type: 'string' },
    },
    anyOf: [
        {
            properties: { action: { enum: ['ADD_ORDER'] } },
            required: ['signedOrder'],
        },
        {
            properties: { action: { enum: ['REMOVE_ORDER'] } },
            required: ['orderHash'],
        },
        {
            properties: { action: { enum: ['GET_STATS'] } },
            required: [],
        },
    ],
    type: 'object',
};
