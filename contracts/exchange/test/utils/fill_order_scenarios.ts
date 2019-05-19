import { BigNumber } from '@0x/utils';

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
    ERC20FiveDecimals = 'ERC20_FIVE_DECIMALS',
    ERC20EighteenDecimals = 'ERC20_EIGHTEEN_DECIMALS',
    ERC721 = 'ERC721',
}

export enum FeeAssetDataScenario {
    ERC20ZeroDecimals = 'ERC20_ZERO_DECIMALS',
    ERC20FiveDecimals = 'ERC20_FIVE_DECIMALS',
    ERC20EighteenDecimals = 'ERC20_EIGHTEEN_DECIMALS',
    ERC721 = 'ERC721',
    MakerToken = 'MAKER_TOKEN',
    TakerToken = 'TAKER_TOKEN',
}

export enum TakerAssetFillAmountScenario {
    ExactlyTakerAssetAmount = 'EXACTLY_TAKER_ASSET_AMOUNT',
    GreaterThanTakerAssetAmount = 'GREATER_THAN_TAKER_ASSET_AMOUNT',
    LessThanTakerAssetAmount = 'LESS_THAN_TAKER_ASSET_AMOUNT',
    Zero = 'ZERO',
}

export enum BalanceAmountScenario {
    Zero = 'ZERO',
    Exact = 'EXACT',
    TooLow = 'TOO_LOW',
    Higher = 'HIGHER',
}

export enum AllowanceAmountScenario {
    Zero = 'ZERO',
    Exact = 'EXACT',
    TooLow = 'TOO_LOW',
    Higher = 'HIGHER',
    Unlimited = 'UNLIMITED',
}

export interface TraderStateScenario {
    traderAssetBalance: BalanceAmountScenario;
    traderAssetAllowance: AllowanceAmountScenario;
    feeBalance: BalanceAmountScenario;
    feeAllowance: AllowanceAmountScenario;
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
    makerFeeAssetDataScenario: FeeAssetDataScenario;
    takerFeeAssetDataScenario: FeeAssetDataScenario;
}
