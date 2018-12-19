import * as _ from 'lodash';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class SpyResolver extends Resolver {
    public resolvedContractSources: ContractSource[] = [];
    private readonly _resolver: Resolver;
    constructor(resolver: Resolver) {
        super();
        this._resolver = resolver;
    }
    public resolveIfExists(importPath: string): ContractSource | undefined {
        const contractSourceIfExists = this._resolver.resolveIfExists(importPath);
        if (!_.isUndefined(contractSourceIfExists)) {
            this.resolvedContractSources.push(contractSourceIfExists);
        }
        return contractSourceIfExists;
    }
}
