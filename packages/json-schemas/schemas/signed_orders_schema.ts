export const signedOrdersSchema = {
    id: '/signedOrdersSchema',
    type: 'array',
    items: { $ref: '/SignedOrder' },
};
