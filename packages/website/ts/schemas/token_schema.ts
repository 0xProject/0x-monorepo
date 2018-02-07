export const tokenSchema = {
    id: '/Token',
    properties: {
        name: { type: 'string' },
        symbol: { type: 'string' },
        decimals: { type: 'number' },
    },
    required: ['name', 'symbol', 'decimals'],
    type: 'object',
};
