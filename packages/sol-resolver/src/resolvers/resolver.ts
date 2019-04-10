import { ContractSource } from '../types';

export abstract class Resolver {
    public abstract resolveIfExists(importPath: string): ContractSource | undefined;
    public resolve(importPath: string): ContractSource {
        const contractSourceIfExists = this.resolveIfExists(importPath);
        if (contractSourceIfExists === undefined) {
            throw new Error(`Failed to resolve ${importPath}`);
        }
        return contractSourceIfExists;
    }
}
