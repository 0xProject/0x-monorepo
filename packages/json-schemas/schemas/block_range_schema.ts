export const blockParamSchema = {
    id: '/BlockParam',
    oneOf: [
        {
            type: 'number',
        },
        {
            enum: ['latest', 'earliest', 'pending'],
        },
    ],
};

export const blockRangeSchema = {
    id: '/BlockRange',
    properties: {
        fromBlock: { $ref: '/BlockParam' },
        toBlock: { $ref: '/BlockParam' },
    },
    type: 'object',
};
