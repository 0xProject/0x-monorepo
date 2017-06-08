export const addressSchema = {
    id: '/addressSchema',
    type: 'string',
    pattern: '^0[xX][0-9A-Fa-f]{40}$',
};

export const numberSchema = {
    id: '/numberSchema',
    type: 'string',
    pattern: '^\\d+(\\.\\d+)?$',
};
