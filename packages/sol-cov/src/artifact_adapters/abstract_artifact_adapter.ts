import { ContractData } from '../types';

export abstract class AbstractArtifactAdapter {
    public abstract async collectContractsDataAsync(): Promise<ContractData[]>;
}
