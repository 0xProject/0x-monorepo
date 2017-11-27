export const signatureDataSchema = {
    id: '/SignatureData',
    properties: {
        hash: {type: 'string'},
        r: {type: 'string'},
        s: {type: 'string'},
        v: {type: 'number'},
    },
    required: ['hash', 'r', 's', 'v'],
    type: 'object',
};
