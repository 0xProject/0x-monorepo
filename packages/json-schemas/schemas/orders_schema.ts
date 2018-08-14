export const ordersSchema = {
    id: '/ordersSchema',
    type: 'array',
    items: { $ref: '/orderSchema' },
};
