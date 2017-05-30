export const tokenSchema = {
    id: '/token',
    properties: {
        name: {type: 'string'},
        symbol: {type: 'string'},
        decimals: {type: 'number'},
        address: {type: 'string'},
        url: {type: 'string'},
    },
    required: ['name', 'symbol', 'decimals', 'address', 'url'],
    type: 'object',
};
