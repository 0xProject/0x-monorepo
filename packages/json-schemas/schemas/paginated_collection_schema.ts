export const paginatedCollectionSchema = {
    id: '/PaginatedCollection',
    type: 'object',
    properties: {
        total: { type: 'number' },
        perPage: { type: 'number' },
        page: { type: 'number' },
    },
    required: ['total', 'perPage', 'page'],
};
