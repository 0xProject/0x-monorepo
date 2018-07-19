export const callDataSchema = {
    id: '/CallData',
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
    required: [],
    type: 'object',
    additionalProperties: false,
};
