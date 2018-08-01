export const ordersSchema = {
    id: '/OrdersSchema',
    type: 'array',
    items: { $ref: '/Order' },
};
