import { AbiDefinition, ContractAbi, Order } from '@0xproject/types';
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
    orders: Order[];
    signatures: string[];
    takerAssetFillAmounts: BigNumber[];
}

export interface MarketSellOrders {
    orders: Order[];
    signatures: string[];
    takerAssetFillAmount: BigNumber;
}

export interface MarketBuyOrders {
    orders: Order[];
    signatures: string[];
    makerAssetFillAmount: BigNumber;
}

export interface BatchCancelOrders {
    orders: Order[];
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

export enum ExchangeStatus {
    INVALID,
    SUCCESS,
    ROUNDING_ERROR_TOO_LARGE,
    INSUFFICIENT_BALANCE_OR_ALLOWANCE,
    TAKER_ASSET_FILL_AMOUNT_TOO_LOW,
    INVALID_SIGNATURE,
    INVALID_SENDER,
    INVALID_TAKER,
    INVALID_MAKER,
    ORDER_INVALID_MAKER_ASSET_AMOUNT,
    ORDER_INVALID_TAKER_ASSET_AMOUNT,
    ORDER_FILLABLE,
    ORDER_EXPIRED,
    ORDER_FULLY_FILLED,
    ORDER_CANCELLED,
}

export enum ContractName {
    TokenRegistry = 'TokenRegistry',
    MultiSigWalletWithTimeLock = 'MultiSigWalletWithTimeLock',
    Exchange = 'Exchange',
    ZRXToken = 'ZRXToken',
    DummyERC20Token = 'DummyERC20Token',
    EtherToken = 'WETH9',
    AssetProxyOwner = 'AssetProxyOwner',
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
    Whitelist = 'Whitelist',
}

export enum SignatureType {
    Illegal,
    Invalid,
    EIP712,
    Ecrecover,
    TxOrigin,
    Caller,
    Contract,
    PreSigned,
    Trezor,
}

export interface SignedTransaction {
    exchangeAddress: string;
    salt: BigNumber;
    signer: string;
    data: string;
    signature: string;
}

export interface TransferAmountsByMatchOrders {
    // Left Maker
    amountBoughtByLeftMaker: BigNumber;
    amountSoldByLeftMaker: BigNumber;
    amountReceivedByLeftMaker: BigNumber;
    feePaidByLeftMaker: BigNumber;
    // Right Maker
    amountBoughtByRightMaker: BigNumber;
    amountSoldByRightMaker: BigNumber;
    amountReceivedByRightMaker: BigNumber;
    feePaidByRightMaker: BigNumber;
    // Taker
    amountReceivedByTaker: BigNumber;
    feePaidByTakerLeft: BigNumber;
    feePaidByTakerRight: BigNumber;
    totalFeePaidByTaker: BigNumber;
    // Fee Recipients
    feeReceivedLeft: BigNumber;
    feeReceivedRight: BigNumber;
}

export interface OrderInfo {
    orderStatus: number;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
}

export interface ERC20ProxyData {
    assetProxyId: AssetProxyId;
    tokenAddress: string;
}

export interface ERC721ProxyData {
    assetProxyId: AssetProxyId;
    tokenAddress: string;
    tokenId: BigNumber;
}

export interface ProxyData {
    assetProxyId: AssetProxyId;
    tokenAddress?: string;
    data?: any;
}

export interface CancelOrder {
    order: Order;
    takerAssetCancelAmount: BigNumber;
}

export interface MatchOrder {
    left: Order;
    right: Order;
    leftSignature: string;
    rightSignature: string;
}
