export const addressSchema = {
    id: '/addressSchema',
    type: 'string',
    pattern: '^0x[0-9a-f]{40}$',
};

export const hexSchema = {
    id: '/hexSchema',
    type: 'string',
    pattern: '^0x([0-9a-f][0-9a-f])+$',
};

export const numberSchema = {
    id: '/numberSchema',
    type: 'string',
    pattern: '^\\d+(\\.\\d+)?$',
};
