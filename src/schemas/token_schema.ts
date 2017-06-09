export const tokenSchema = {
    id: '/token',
    properties: {
        name: {type: 'string'},
        symbol: {type: 'string'},
        decimals: {type: 'number'},
        address: {$ref: '/addressSchema'},
        url: {
            type: 'string',
            format: 'uri',
        },
    },
    required: ['name', 'symbol', 'decimals', 'address', 'url'],
    type: 'object',
};
