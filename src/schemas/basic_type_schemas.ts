export const addressSchema = {
    id: '/addressSchema',
    type: 'string',
    pattern: '^0x[0-9a-f]{40}$',
};

export const numberSchema = {
    id: '/numberSchema',
    type: 'string',
    pattern: '^\\d+(\\.\\d+)?$',
};
