export const jsNumber = {
    id: '/JsNumber',
    type: 'number',
    minimum: 0,
};

export const txDataSchema = {
    id: '/TxData',
    properties: {
        from: { $ref: '/Address' },
        to: { $ref: '/Address' },
        value: {
            oneOf: [{ $ref: '/Number' }, { $ref: '/JsNumber' }],
        },
        gas: {
            oneOf: [{ $ref: '/Number' }, { $ref: '/JsNumber' }],
        },
        gasPrice: {
            oneOf: [{ $ref: '/Number' }, { $ref: '/JsNumber' }],
        },
        data: {
            type: 'string',
            pattern: '^0x[0-9a-f]*$',
        },
        nonce: {
            type: 'number',
            minimum: 0,
        },
    },
    required: ['from'],
    type: 'object',
    additionalProperties: false,
};
