export const orderSchema = {
	id: '/Order',
	properties: {
		maker: { $ref: '/OrderTaker' },
		taker: { $ref: '/OrderTaker' },
		salt: { type: 'string' },
		signature: { $ref: '/SignatureData' },
		expiration: { type: 'string' },
		feeRecipient: { type: 'string' },
		exchangeContract: { type: 'string' },
		networkId: { type: 'number' },
	},
	required: ['maker', 'taker', 'salt', 'signature', 'expiration', 'feeRecipient', 'exchangeContract', 'networkId'],
	type: 'object',
};
