export const relayerApiFeeRecipientsResponseSchema = {
    id: '/relayerApiFeeRecipientsResponseSchema',
    type: 'object',
    allOf: [
        { $ref: '/paginatedCollectionSchema' },
        {
            properties: {
                records: {
                    id: '/relayerApiFeeRecipientsSchema',
                    type: 'array',
                    items: { $ref: '/addressSchema' },
                },
            },
            required: ['records'],
        },
    ],
};