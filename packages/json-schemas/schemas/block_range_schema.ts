export const blockParamSchema = {
    id: '/blockParamSchema',
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
    id: '/blockRangeSchema',
    properties: {
        fromBlock: { $ref: '/blockParamSchema' },
        toBlock: { $ref: '/blockParamSchema' },
    },
    type: 'object',
};
