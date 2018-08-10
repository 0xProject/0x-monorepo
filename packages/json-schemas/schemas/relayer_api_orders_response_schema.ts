export const relayerApiOrdersResponseSchema = {
    id: '/relayerApiOrdersResponseSchema',
    type: 'object',
    allOf: [
        { $ref: '/paginatedCollectionSchema' },
        {
            properties: {
                records: { $ref: '/relayerApiOrdersSchema' },
            },
            required: ['records'],
        },
    ],
};
