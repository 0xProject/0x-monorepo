export const blockParamSchema = {
    id: '/blockParam',
    oneOf: [
        {
            type: 'number',
        },
        {
            enum: ['latest', 'earliest', 'pending'],
        },
    ],
};

export const subscriptionOptsSchema = {
    id: '/subscriptionOpts',
    properties: {
        fromBlock: {$ref: '/blockParam'},
        toBlock: {$ref: '/blockParam'},
    },
    type: 'object',
};
