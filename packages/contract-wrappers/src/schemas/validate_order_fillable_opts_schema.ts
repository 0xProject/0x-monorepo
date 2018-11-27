export const validateOrderFillableOptsSchema = {
    id: '/ValidateOrderFillableOpts',
    properties: {
        expectedFillTakerTokenAmount: { $ref: '/wholeNumberSchema' },
    },
    type: 'object',
};
