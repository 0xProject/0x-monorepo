import { ContractSource } from '../types';

import { Resolver } from './resolver';

/**
 * This resolver is a passthrough proxy to any resolver that records all the resolved contracts sources.
 * You can access them later using the `resolvedContractSources` public field.
 */
export class SpyResolver extends Resolver {
    public resolvedContractSources: ContractSource[] = [];
    private readonly _resolver: Resolver;
    constructor(resolver: Resolver) {
        super();
        this._resolver = resolver;
    }
    public resolveIfExists(importPath: string): ContractSource | undefined {
        const contractSourceIfExists = this._resolver.resolveIfExists(importPath);
        if (contractSourceIfExists !== undefined) {
            this.resolvedContractSources.push(contractSourceIfExists);
        }
        return contractSourceIfExists;
    }
}
