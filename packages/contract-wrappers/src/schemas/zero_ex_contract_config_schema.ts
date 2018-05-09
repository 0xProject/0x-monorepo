export const zeroExContractConfigSchema = {
    id: '/ZeroExContractConfig',
    oneOf: [{ $ref: '/ZeroExContractPrivateNetworkConfig' }, { $ref: '/ZeroExContractPublicNetworkConfig' }],
    type: 'object',
};
