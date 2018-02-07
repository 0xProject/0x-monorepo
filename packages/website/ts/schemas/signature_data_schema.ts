export const signatureDataSchema = {
    id: '/SignatureData',
    properties: {
        r: { type: 'string' },
        s: { type: 'string' },
        v: { type: 'number' },
    },
    required: ['r', 's', 'v'],
    type: 'object',
};
