import { ContractSource } from '../types';

import { Resolver } from './resolver';

export abstract class EnumerableResolver extends Resolver {
    public abstract getAll(): ContractSource[];
}
