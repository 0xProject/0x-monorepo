export const tokenSchema = {
    id: '/token',
    properties: {
        name: {type: 'string'},
        symbol: {type: 'string'},
        decimals: {type: 'number'},
        address: {$ref: '/addressSchema'},
        url: {
            oneOf: [
                {
                    type: 'string',
                    format: 'uri',
                },
                {
                    enum: [''],
                },
            ],
        },
    },
    required: ['name', 'symbol', 'decimals', 'address', 'url'],
    type: 'object',
};
