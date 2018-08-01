export const signedOrdersSchema = {
    id: '/SignedOrdersSchema',
    type: 'array',
    items: { $ref: '/SignedOrder' },
};
