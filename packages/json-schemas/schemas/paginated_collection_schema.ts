export const paginatedCollectionSchema = {
    id: '/PaginatedCollection',
    type: 'object',
    properties: {
        total: { $ref: '/Number' },
        perPage: { $ref: '/Number' },
        page: { $ref: '/Number' },
    },
    required: ['total', 'perPage', 'page'],
};
