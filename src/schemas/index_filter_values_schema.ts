export const indexFilterValuesSchema = {
    id: '/indexFilterValues',
    additionalProperties: {
        oneOf: [
            {$ref: '/numberSchema'},
            {$ref: '/addressSchema'},
            {$ref: '/orderHashSchema'},
        ],
    },
    type: 'object',
};
