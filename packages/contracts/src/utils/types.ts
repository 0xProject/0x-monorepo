import { AbiDefinition, ContractAbi } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

export interface ERC20BalancesByOwner {
    [ownerAddress: string]: {
        [tokenAddress: string]: BigNumber;
    };
}

export interface ERC721TokenIdsByOwner {
    [ownerAddress: string]: {
        [tokenAddress: string]: BigNumber[];
    };
}

export interface SubmissionContractEventArgs {
    transactionId: BigNumber;
}

export interface BatchFillOrders {
    orders: OrderStruct[];
    signatures: string[];
    takerAssetFillAmounts: BigNumber[];
}

export interface MarketSellOrders {
    orders: OrderStruct[];
    signatures: string[];
    takerAssetFillAmount: BigNumber;
}

export interface MarketBuyOrders {
    orders: OrderStruct[];
    signatures: string[];
    makerAssetFillAmount: BigNumber;
}

export interface BatchCancelOrders {
    orders: OrderStruct[];
}

export interface CancelOrdersBefore {
    salt: BigNumber;
}

export enum AssetProxyId {
    INVALID,
    ERC20,
    ERC721,
}

export interface TransactionDataParams {
    name: string;
    abi: AbiDefinition[];
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

export enum ExchangeContractErrs {
    ERROR_ORDER_EXPIRED,
    ERROR_ORDER_FULLY_FILLED,
    ERROR_ORDER_CANCELLED,
    ERROR_ROUNDING_ERROR_TOO_LARGE,
    ERROR_INSUFFICIENT_BALANCE_OR_ALLOWANCE,
}

export enum ContractName {
    TokenRegistry = 'TokenRegistry',
    MultiSigWalletWithTimeLock = 'MultiSigWalletWithTimeLock',
    Exchange = 'Exchange',
    ZRXToken = 'ZRXToken',
    DummyERC20Token = 'DummyERC20Token',
    EtherToken = 'WETH9',
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress = 'MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress',
    AccountLevels = 'AccountLevels',
    EtherDelta = 'EtherDelta',
    Arbitrage = 'Arbitrage',
    TestAssetProxyDispatcher = 'TestAssetProxyDispatcher',
    TestLibs = 'TestLibs',
    TestSignatureValidator = 'TestSignatureValidator',
    ERC20Proxy = 'ERC20Proxy',
    ERC721Proxy = 'ERC721Proxy',
    DummyERC721Token = 'DummyERC721Token',
    TestLibBytes = 'TestLibBytes',
    Authorizable = 'Authorizable',
}

export interface SignedOrder extends UnsignedOrder {
    signature: string;
}

export interface OrderStruct {
    senderAddress: string;
    makerAddress: string;
    takerAddress: string;
    feeRecipientAddress: string;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    makerFee: BigNumber;
    takerFee: BigNumber;
    expirationTimeSeconds: BigNumber;
    salt: BigNumber;
    makerAssetData: string;
    takerAssetData: string;
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

export interface SignedTransaction {
    exchangeAddress: string;
    salt: BigNumber;
    signer: string;
    data: string;
    signature: string;
}
