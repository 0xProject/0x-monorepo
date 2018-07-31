export const relayerApiOrdersSchema = {
    id: '/RelayerApiOrders',
    type: 'array',
    items: { $ref: '/RelayerApiOrder' },
};
