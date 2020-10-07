import { ContractAbi, EventAbi, MethodAbi } from 'ethereum-types';
export enum ParamKind {
    Input = 'input',
    Output = 'output',
}

export enum ContractsBackend {
    Web3 = 'web3',
    Ethers = 'ethers',
}

export interface Method extends MethodAbi {
    singleReturnValue: boolean;
    hasReturnValue: boolean;
    languageSpecificName: string;
    functionSignature: string;
}

export interface ContextData {
    contractName: string;
    ABI: ContractAbi;
    methods: Method[];
    events: EventAbi[];
}
