export const ECSignatureSchema = {
    id: '/ECSignature',
    properties: {
        v: {type: 'number'},
        r: {type: 'string'},
        s: {type: 'string'},
    },
    required: ['v', 'r', 's'],
    type: 'object',
};
