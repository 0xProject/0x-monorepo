export const pagedRequestOptsSchema = {
    id: '/PagedRequestOpts',
    type: 'object',
    properties: {
        page: { type: 'number' },
        per_page: { type: 'number' },
    },
};
