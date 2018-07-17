import Web3ProviderEngine = require('web3-provider-engine');

import { Subprovider } from '../subproviders/subprovider';

/**
 * Prepends a subprovider to a provider
 * @param provider    Given provider
 * @param subprovider Subprovider to prepend
 */
export function prependSubprovider(provider: Web3ProviderEngine, subprovider: Subprovider): void {
    subprovider.setEngine(provider);
    // HACK: We use implementation details of provider engine here
    // https://github.com/MetaMask/provider-engine/blob/master/index.js#L68
    (provider as any)._providers = [subprovider, ...(provider as any)._providers];
}
