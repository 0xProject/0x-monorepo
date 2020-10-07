export interface ContractSource {
    source: string;
    path: string;
    absolutePath: string;
}

export interface ContractSources {
    [key: string]: ContractSource;
}
