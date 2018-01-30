export const relayerOrderBookRequestSchema = {
	id: '/RelayerOrderBookRequest',
	type: 'object',
	properties: {
		baseTokenAddress: { $ref: '/Address' },
		quoteTokenAddress: { $ref: '/Address' },
	},
};
