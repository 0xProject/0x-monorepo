export const relayerApiFeeRecipientsResponseSchema = {
    id: '/relayerApiFeeRecipientsResponseSchema',
    type: 'object',
    allOf: [
        { $ref: '/paginatedCollectionSchema' },
        {
            properties: {
                records: { $ref: '/addressSchema' },
            },
            required: ['records'],
        },
    ],
};
