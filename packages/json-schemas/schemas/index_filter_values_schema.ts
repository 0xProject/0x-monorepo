export const indexFilterValuesSchema = {
    id: '/IndexFilterValues',
    additionalProperties: {
        oneOf: [
            {$ref: '/Number'},
            {$ref: '/Address'},
            {$ref: '/OrderHashSchema'},
        ],
    },
    type: 'object',
};
