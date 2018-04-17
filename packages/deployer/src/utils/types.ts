import { ContractAbi, Provider, TxData } from '@0xproject/types';
import * as Web3 from 'web3';
import * as yargs from 'yargs';

export enum AbiType {
    Function = 'function',
    Constructor = 'constructor',
    Event = 'event',
    Fallback = 'fallback',
}

export interface ContractArtifact {
    contract_name: string;
    networks: ContractNetworks;
}

export interface ContractNetworks {
    [key: number]: ContractNetworkData;
}

export interface ContractNetworkData {
    solc_version: string;
    optimizer_enabled: boolean;
    source_tree_hash: string;
    abi: ContractAbi;
    bytecode: string;
    runtime_bytecode: string;
    address?: string;
    constructor_args?: string;
    updated_at: number;
    source_map: string;
    source_map_runtime: string;
    sources: string[];
}

export interface SolcErrors {
    [key: string]: boolean;
}

export interface CliOptions extends yargs.Arguments {
    artifactsDir: string;
    contractsDir: string;
    jsonrpcUrl: string;
    networkId: number;
    shouldOptimize: boolean;
    gasPrice: string;
    account?: string;
    contract?: string;
    args?: string;
}

export interface CompilerOptions {
    contractsDir: string;
    networkId: number;
    optimizerEnabled: boolean;
    artifactsDir: string;
    specifiedContracts: Set<string>;
}

export interface BaseDeployerOptions {
    artifactsDir: string;
    networkId: number;
    defaults: Partial<TxData>;
}

export interface ProviderDeployerOptions extends BaseDeployerOptions {
    provider: Provider;
}

export interface UrlDeployerOptions extends BaseDeployerOptions {
    jsonrpcUrl: string;
}

export type DeployerOptions = UrlDeployerOptions | ProviderDeployerOptions;

export interface ContractSourceData {
    [contractName: string]: ContractSpecificSourceData;
}

export interface ContractSpecificSourceData {
    solcVersionRange: string;
    sourceHash: Buffer;
    sourceTreeHash: Buffer;
}

export interface Token {
    address?: string;
    name: string;
    symbol: string;
    decimals: number;
    ipfsHash: string;
    swarmHash: string;
}

export type DoneCallback = (err?: Error) => void;
