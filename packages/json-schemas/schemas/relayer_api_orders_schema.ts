export const relayerApiOrdersSchema = {
    id: '/relayerApiOrdersSchema',
    type: 'array',
    items: { $ref: '/relayerApiOrderSchema' },
};
