export const ContractWrappersConfigSchema = {
    id: '/ContractWrappersConfig',
    oneOf: [{ $ref: '/ZeroExContractPrivateNetworkConfig' }, { $ref: '/ZeroExContractPublicNetworkConfig' }],
    type: 'object',
};
