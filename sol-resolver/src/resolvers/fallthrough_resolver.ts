import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class FallthroughResolver extends Resolver {
    private readonly _resolvers: Resolver[] = [];
    public appendResolver(resolver: Resolver): void {
        this._resolvers.push(resolver);
    }
    public resolveIfExists(importPath: string): ContractSource | undefined {
        for (const resolver of this._resolvers) {
            const contractSourceIfExists = resolver.resolveIfExists(importPath);
            if (contractSourceIfExists !== undefined) {
                return contractSourceIfExists;
            }
        }
        return undefined;
    }
}
