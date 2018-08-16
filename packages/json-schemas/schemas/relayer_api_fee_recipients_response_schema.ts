export const relayerApiFeeRecipientsResponseSchema = {
    id: '/relayerApiFeeRecipientsResponseSchema',
    type: 'object',
    allOf: [
        { $ref: '/paginatedCollectionSchema' },
        {
            properties: {
                records: { $ref: '/relayerApiFeeRecipientsSchema' },
            },
            required: ['records'],
        },
    ],
};

export const relayerApiFeeRecipientsSchema = {
    id: '/relayerApiFeeRecipientsSchema',
    type: 'array',
    items: { $ref: '/addressSchema' },
};
