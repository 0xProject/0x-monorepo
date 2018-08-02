export const jsNumber = {
    id: '/jsNumber',
    type: 'number',
    minimum: 0,
};

export const txDataSchema = {
    id: '/txDataSchema',
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
    required: ['from'],
    type: 'object',
    additionalProperties: false,
};
