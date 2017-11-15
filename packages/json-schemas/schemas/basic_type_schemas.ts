export const addressSchema = {
    id: '/Address',
    type: 'string',
    pattern: '^0x[0-9a-f]{40}$',
};

export const numberSchema = {
    id: '/Number',
    type: 'string',
    pattern: '^\\d+(\\.\\d+)?$',
};
