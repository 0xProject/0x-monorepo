export const pagedRequestOptsSchema = {
    id: '/PagedRequestOpts',
    type: 'object',
    properties: {
        page: { type: 'number' },
        perPage: { type: 'number' },
    },
};
