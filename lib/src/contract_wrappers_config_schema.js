"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractWrappersConfigSchema = {
    id: '/ContractWrappersConfig',
    properties: {
        chainId: {
            type: 'number',
        },
        gasPrice: { $ref: '/numberSchema' },
        contractAddresses: {
            type: 'object',
            properties: {
                erc20Proxy: { $ref: '/addressSchema' },
                erc721Proxy: { $ref: '/addressSchema' },
                zrxToken: { $ref: '/addressSchema' },
                etherToken: { $ref: '/addressSchema' },
                exchange: { $ref: '/addressSchema' },
                assetProxyOwner: { $ref: '/addressSchema' },
                forwarder: { $ref: '/addressSchema' },
                staking: { $ref: '/addressSchema' },
            },
        },
        blockPollingIntervalMs: { type: 'number' },
    },
    type: 'object',
    required: ['chainId'],
};
//# sourceMappingURL=contract_wrappers_config_schema.js.map