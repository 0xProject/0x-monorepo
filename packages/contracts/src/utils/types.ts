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
    orders: OrderStruct[];
    signatures: string[];
    takerTokenFillAmounts: BigNumber[];
}

export interface MarketFillOrders {
    orders: OrderStruct[];
    signatures: string[];
    takerTokenFillAmount: BigNumber;
}

export interface BatchCancelOrders {
    orders: OrderStruct[];
    takerTokenCancelAmounts: BigNumber[];
}

export interface DefaultOrderParams {
    exchangeAddress: string;
    makerAddress: string;
    feeRecipientAddress: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerFeeAmount: BigNumber;
    takerFeeAmount: BigNumber;
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
    AccountLevels = 'AccountLevels',
    EtherDelta = 'EtherDelta',
    Arbitrage = 'Arbitrage',
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

export interface SignedOrder extends UnsignedOrder {
    signature: string;
}

export interface OrderStruct {
    makerAddress: string;
    takerAddress: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    feeRecipientAddress: string;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerFeeAmount: BigNumber;
    takerFeeAmount: BigNumber;
    expirationTimeSeconds: BigNumber;
    salt: BigNumber;
}

export interface UnsignedOrder extends OrderStruct {
    exchangeAddress: string;
}

export enum SignatureType {
    Illegal,
    Invalid,
    Caller,
    Ecrecover,
    EIP712,
    Trezor,
    Contract,
}
