export const relayerApiOrdersResponseSchema = {
    id: '/RelayerApiOrdersResponse',
    type: 'object',
    allOf: [
        { $ref: '/PaginatedCollection' },
        {
            properties: {
                records: { $ref: '/RelayerApiOrders' },
            },
            required: ['records'],
        },
    ],
};
