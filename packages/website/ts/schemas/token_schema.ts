export const tokenSchema = {
	id: '/Token',
	properties: {
		name: { type: 'string' },
		symbol: { type: 'string' },
		decimals: { type: 'number' },
		address: { type: 'string' },
	},
	required: ['name', 'symbol', 'decimals', 'address'],
	type: 'object',
};
