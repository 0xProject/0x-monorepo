export const ecSignatureParameterSchema = {
    id: '/ECSignatureParameter',
    type: 'string',
    pattern: '^0[xX][0-9A-Fa-f]{64}$',
};

export const ecSignatureSchema = {
    id: '/ECSignature',
    properties: {
        v: {
            type: 'number',
            minimum: 27,
            maximum: 28,
        },
        r: {$ref: '/ECSignatureParameter'},
        s: {$ref: '/ECSignatureParameter'},
    },
    required: ['v', 'r', 's'],
    type: 'object',
};
