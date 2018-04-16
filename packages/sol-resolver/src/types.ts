export interface ContractSource {
    source: string;
    path: string;
}

export interface ContractSources {
    [key: string]: ContractSource;
}
