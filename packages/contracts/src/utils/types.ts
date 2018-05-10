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

export enum ExchangeStatus {
    /// Default Status ///
    INVALID, // General invalid status

    /// General Exchange Statuses ///
    SUCCESS, // Indicates a successful operation
    ROUNDING_ERROR_TOO_LARGE, // Rounding error too large
    INSUFFICIENT_BALANCE_OR_ALLOWANCE, // Insufficient balance or allowance for token transfer
    TAKER_ASSET_FILL_AMOUNT_TOO_LOW, // takerAssetFillAmount is <= 0
    INVALID_SIGNATURE, // Invalid signature
    INVALID_SENDER, // Invalid sender
    INVALID_TAKER, // Invalid taker
    INVALID_MAKER, // Invalid maker

    /// Order State Statuses ///
    ORDER_INVALID_MAKER_ASSET_AMOUNT, // Order does not have a valid maker asset amount
    ORDER_INVALID_TAKER_ASSET_AMOUNT, // Order does not have a valid taker asset amount
    ORDER_FILLABLE, // Order is fillable
    ORDER_EXPIRED, // Order has already expired
    ORDER_FULLY_FILLED, // Order is fully filled
    ORDER_CANCELLED, // Order has been cancelled
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
