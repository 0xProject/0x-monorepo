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
    type: 'object',
    definitions: {
        signedOrderParam: {
            type: 'object',
            properties: {
                signedOrder: { $ref: '/signedOrderSchema' },
            },
            required: ['signedOrder'],
        },
        orderHashParam: {
            type: 'object',
            properties: {
                orderHash: { $ref: '/hexSchema' },
            },
            required: ['orderHash'],
        },
    },
    oneOf: [
        {
            type: 'object',
            properties: {
                id: { type: 'string' },
                jsonrpc: { type: 'string' },
                method: { enum: ['ADD_ORDER'] },
                params: { $ref: '#/definitions/signedOrderParam' },
            },
            required: ['id', 'jsonrpc', 'method', 'params'],
        },
        {
            type: 'object',
            properties: {
                id: { type: 'string' },
                jsonrpc: { type: 'string' },
                method: { enum: ['REMOVE_ORDER'] },
                params: { $ref: '#/definitions/orderHashParam' },
            },
            required: ['id', 'jsonrpc', 'method', 'params'],
        },
        {
            type: 'object',
            properties: {
                id: { type: 'string' },
                jsonrpc: { type: 'string' },
                method: { enum: ['GET_STATS'] },
                params: {},
            },
            required: ['id', 'jsonrpc', 'method'],
        },
    ],
};
