export const paginatedCollectionSchema = {
    id: '/PaginatedCollection',
    type: 'object',
    properties: {
        total: { $ref: '/Number' },
        per_page: { $ref: '/Number' },
        page: { $ref: '/Number' },
    },
    required: ['total', 'per_page', 'page'],
};
