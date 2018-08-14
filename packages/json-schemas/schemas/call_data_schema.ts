export const callDataSchema = {
    id: '/callDataSchema',
    properties: {
        from: { $ref: '/addressSchema' },
        to: { $ref: '/addressSchema' },
        value: {
            oneOf: [{ $ref: '/numberSchema' }, { $ref: '/jsNumber' }],
        },
        gas: {
            oneOf: [{ $ref: '/numberSchema' }, { $ref: '/jsNumber' }],
        },
        gasPrice: {
            oneOf: [{ $ref: '/numberSchema' }, { $ref: '/jsNumber' }],
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
