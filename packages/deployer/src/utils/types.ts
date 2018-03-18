import { TxData } from '@0xproject/types';
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
    optimizer_enabled: number;
    keccak256: string;
    source_tree_hash: string;
    abi: Web3.ContractAbi;
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
    optimizerEnabled: number;
    artifactsDir: string;
    specifiedContracts: Set<string>;
}

export interface BaseDeployerOptions {
    artifactsDir: string;
    networkId: number;
    defaults: Partial<TxData>;
}

export interface ProviderDeployerOptions extends BaseDeployerOptions {
    web3Provider: Web3.Provider;
}

export interface UrlDeployerOptions extends BaseDeployerOptions {
    jsonrpcUrl: string;
}

export type DeployerOptions = UrlDeployerOptions | ProviderDeployerOptions;

export interface ContractSources {
    [key: string]: string;
}

export interface ContractSourceData {
    [key: string]: ContractSpecificSourceData;
}

export interface ContractSpecificSourceData {
    dependencies: string[];
    solcVersion: string;
    sourceHash: Buffer;
    sourceTreeHashIfExists?: Buffer;
}

// TODO: Consolidate with 0x.js definitions once types are moved into a separate package.
export enum ZeroExError {
    ContractDoesNotExist = 'CONTRACT_DOES_NOT_EXIST',
    ExchangeContractDoesNotExist = 'EXCHANGE_CONTRACT_DOES_NOT_EXIST',
    UnhandledError = 'UNHANDLED_ERROR',
    UserHasNoAssociatedAddress = 'USER_HAS_NO_ASSOCIATED_ADDRESSES',
    InvalidSignature = 'INVALID_SIGNATURE',
    ContractNotDeployedOnNetwork = 'CONTRACT_NOT_DEPLOYED_ON_NETWORK',
    InsufficientAllowanceForTransfer = 'INSUFFICIENT_ALLOWANCE_FOR_TRANSFER',
    InsufficientBalanceForTransfer = 'INSUFFICIENT_BALANCE_FOR_TRANSFER',
    InsufficientEthBalanceForDeposit = 'INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT',
    InsufficientWEthBalanceForWithdrawal = 'INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL',
    InvalidJump = 'INVALID_JUMP',
    OutOfGas = 'OUT_OF_GAS',
    NoNetworkId = 'NO_NETWORK_ID',
    SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
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
