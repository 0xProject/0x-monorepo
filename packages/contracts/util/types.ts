import { BigNumber } from '@0xproject/utils';
import * as Web3 from 'web3';

export interface BalancesByOwner {
    [ownerAddress: string]: {
        [tokenAddress: string]: BigNumber;
    };
}

export interface SubmissionContractEventArgs {
    transactionId: BigNumber;
}

export interface BatchFillOrders {
    orderAddresses: string[][];
    orderValues: BigNumber[][];
    fillTakerTokenAmounts: BigNumber[];
    shouldThrowOnInsufficientBalanceOrAllowance: boolean;
    v: number[];
    r: string[];
    s: string[];
}

export interface FillOrdersUpTo {
    orderAddresses: string[][];
    orderValues: BigNumber[][];
    fillTakerTokenAmount: BigNumber;
    shouldThrowOnInsufficientBalanceOrAllowance: boolean;
    v: number[];
    r: string[];
    s: string[];
}

export interface BatchCancelOrders {
    orderAddresses: string[][];
    orderValues: BigNumber[][];
    cancelTakerTokenAmounts: BigNumber[];
}

export interface DefaultOrderParams {
    exchangeContractAddress: string;
    maker: string;
    feeRecipient: string;
    makerToken: string;
    takerToken: string;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerFee: BigNumber;
    takerFee: BigNumber;
}

export interface OptionalOrderParams {
    exchangeContractAddress?: string;
    maker?: string;
    taker?: string;
    feeRecipient?: string;
    makerToken?: string;
    takerToken?: string;
    makerTokenAmount?: BigNumber;
    takerTokenAmount?: BigNumber;
    makerFee?: BigNumber;
    takerFee?: BigNumber;
    expirationTimestampInSec?: BigNumber;
}

export interface OrderParams {
    exchangeContractAddress: string;
    maker: string;
    taker: string;
    feeRecipient: string;
    makerToken: string;
    takerToken: string;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerFee: BigNumber;
    takerFee: BigNumber;
    expirationTimestampInSec: BigNumber;
    salt: BigNumber;
    v?: number;
    r?: string;
    s?: string;
}

export interface TransactionDataParams {
    name: string;
    abi: Web3.AbiDefinition[];
    args: any[];
}

export interface MultiSigConfig {
    owners: string[];
    confirmationsRequired: number;
    secondsRequired: number;
}

export interface MultiSigConfigByNetwork {
    [networkName: string]: MultiSigConfig;
}

export interface Token {
    address?: string;
    name: string;
    symbol: string;
    decimals: number;
    ipfsHash: string;
    swarmHash: string;
}

export interface TokenInfoByNetwork {
    development: Token[];
    live: Token[];
}

export enum ExchangeContractErrs {
    ERROR_ORDER_EXPIRED,
    ERROR_ORDER_FULLY_FILLED_OR_CANCELLED,
    ERROR_ROUNDING_ERROR_TOO_LARGE,
    ERROR_INSUFFICIENT_BALANCE_OR_ALLOWANCE,
}

export enum ContractName {
    TokenTransferProxy = 'TokenTransferProxy',
    TokenRegistry = 'TokenRegistry',
    MultiSigWalletWithTimeLock = 'MultiSigWalletWithTimeLock',
    Exchange = 'Exchange',
    ZRXToken = 'ZRXToken',
    DummyToken = 'DummyToken',
    EtherToken = 'WETH9',
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress = 'MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress',
    MaliciousToken = 'MaliciousToken',
}

export interface Artifact {
    contract_name: ContractName;
    networks: {
        [networkId: number]: {
            abi: Web3.ContractAbi;
            solc_version: string;
            keccak256: string;
            optimizer_enabled: number;
            unlinked_binary: string;
            updated_at: number;
            address: string;
            constructor_args: string;
        };
    };
}
