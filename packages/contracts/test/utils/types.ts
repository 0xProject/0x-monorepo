import { OrderWithoutExchangeAddress } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { AbiDefinition } from 'ethereum-types';

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
    orders: OrderWithoutExchangeAddress[];
    signatures: string[];
    takerAssetFillAmounts: BigNumber[];
}

export interface MarketSellOrders {
    orders: OrderWithoutExchangeAddress[];
    signatures: string[];
    takerAssetFillAmount: BigNumber;
}

export interface MarketBuyOrders {
    orders: OrderWithoutExchangeAddress[];
    signatures: string[];
    makerAssetFillAmount: BigNumber;
}

export interface BatchCancelOrders {
    orders: OrderWithoutExchangeAddress[];
}

export interface CancelOrdersBefore {
    salt: BigNumber;
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

export enum OrderStatus {
    INVALID,
    INVALID_MAKER_ASSET_AMOUNT,
    INVALID_TAKER_ASSET_AMOUNT,
    FILLABLE,
    EXPIRED,
    FULLY_FILLED,
    CANCELLED,
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
    TestAssetDataDecoders = 'TestAssetDataDecoders',
    TestAssetProxyDispatcher = 'TestAssetProxyDispatcher',
    TestLibs = 'TestLibs',
    TestSignatureValidator = 'TestSignatureValidator',
    ERC20Proxy = 'ERC20Proxy',
    ERC721Proxy = 'ERC721Proxy',
    DummyERC721Receiver = 'DummyERC721Receiver',
    DummyERC721Token = 'DummyERC721Token',
    TestLibBytes = 'TestLibBytes',
    TestWallet = 'TestWallet',
    Authorizable = 'Authorizable',
    Whitelist = 'Whitelist',
    Forwarder = 'Forwarder',
}

export interface SignedTransaction {
    exchangeAddress: string;
    salt: BigNumber;
    signerAddress: string;
    data: string;
    signature: string;
}

export interface TransferAmountsByMatchOrders {
    // Left Maker
    amountBoughtByLeftMaker: BigNumber;
    amountSoldByLeftMaker: BigNumber;
    feePaidByLeftMaker: BigNumber;
    // Right Maker
    amountBoughtByRightMaker: BigNumber;
    amountSoldByRightMaker: BigNumber;
    feePaidByRightMaker: BigNumber;
    // Taker
    amountReceivedByTaker: BigNumber;
    feePaidByTakerLeft: BigNumber;
    feePaidByTakerRight: BigNumber;
}

export interface TransferAmountsLoggedByMatchOrders {
    makerAddress: string;
    takerAddress: string;
    makerAssetFilledAmount: string;
    takerAssetFilledAmount: string;
    makerFeePaid: string;
    takerFeePaid: string;
}

export interface OrderInfo {
    orderStatus: number;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
}

export interface CancelOrder {
    order: OrderWithoutExchangeAddress;
    takerAssetCancelAmount: BigNumber;
}

export interface MatchOrder {
    left: OrderWithoutExchangeAddress;
    right: OrderWithoutExchangeAddress;
    leftSignature: string;
    rightSignature: string;
}

// Combinatorial testing types

export enum FeeRecipientAddressScenario {
    BurnAddress = 'BURN_ADDRESS',
    EthUserAddress = 'ETH_USER_ADDRESS',
}

export enum OrderAssetAmountScenario {
    Zero = 'ZERO',
    Large = 'LARGE',
    Small = 'SMALL',
}

export enum TakerScenario {
    CorrectlySpecified = 'CORRECTLY_SPECIFIED',
    IncorrectlySpecified = 'INCORRECTLY_SPECIFIED',
    Unspecified = 'UNSPECIFIED',
}

export enum ExpirationTimeSecondsScenario {
    InPast = 'IN_PAST',
    InFuture = 'IN_FUTURE',
}

export enum AssetDataScenario {
    ERC20ZeroDecimals = 'ERC20_ZERO_DECIMALS',
    ZRXFeeToken = 'ZRX_FEE_TOKEN',
    ERC20FiveDecimals = 'ERC20_FIVE_DECIMALS',
    ERC20NonZRXEighteenDecimals = 'ERC20_NON_ZRX_EIGHTEEN_DECIMALS',
    ERC721 = 'ERC721',
}

export enum TakerAssetFillAmountScenario {
    Zero = 'ZERO',
    GreaterThanRemainingFillableTakerAssetAmount = 'GREATER_THAN_REMAINING_FILLABLE_TAKER_ASSET_AMOUNT',
    LessThanRemainingFillableTakerAssetAmount = 'LESS_THAN_REMAINING_FILLABLE_TAKER_ASSET_AMOUNT',
    ExactlyRemainingFillableTakerAssetAmount = 'EXACTLY_REMAINING_FILLABLE_TAKER_ASSET_AMOUNT',
}

export interface OrderScenario {
    takerScenario: TakerScenario;
    feeRecipientScenario: FeeRecipientAddressScenario;
    makerAssetAmountScenario: OrderAssetAmountScenario;
    takerAssetAmountScenario: OrderAssetAmountScenario;
    makerFeeScenario: OrderAssetAmountScenario;
    takerFeeScenario: OrderAssetAmountScenario;
    expirationTimeSecondsScenario: ExpirationTimeSecondsScenario;
    makerAssetDataScenario: AssetDataScenario;
    takerAssetDataScenario: AssetDataScenario;
}

export enum BalanceAmountScenario {
    Exact = 'EXACT',
    TooLow = 'TOO_LOW',
    Higher = 'HIGHER',
}

export enum AllowanceAmountScenario {
    Exact = 'EXACT',
    TooLow = 'TOO_LOW',
    Higher = 'HIGHER',
    Unlimited = 'UNLIMITED',
}

export interface TraderStateScenario {
    traderAssetBalance: BalanceAmountScenario;
    traderAssetAllowance: AllowanceAmountScenario;
    zrxFeeBalance: BalanceAmountScenario;
    zrxFeeAllowance: AllowanceAmountScenario;
}

export interface FillScenario {
    orderScenario: OrderScenario;
    takerAssetFillAmountScenario: TakerAssetFillAmountScenario;
    makerStateScenario: TraderStateScenario;
    takerStateScenario: TraderStateScenario;
}

export interface FillResults {
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
}
