export const zeroExConfigSchema = {
    id: '/ZeroExConfig',
    oneOf: [{ $ref: '/ZeroExPrivateNetworkConfig' }, { $ref: '/ZeroExPublicNetworkConfig' }],
    type: 'object',
};
