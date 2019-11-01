export enum FeeRecipientAddressScenario {
    BurnAddress = 'BURN_ADDRESS',
    EthUserAddress = 'ETH_USER_ADDRESS',
    MakerAddress = 'MAKER_ADDRESS',
    TakerAddress = 'TAKER_ADDRESS',
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
    ERC1155Fungible = 'ERC1155_FUNGIBLE',
    ERC1155NonFungible = 'ERC1155_NON_FUNGIBLE',
    MultiAssetERC20 = 'MULTI_ASSET_ERC20',
}

export enum FeeAssetDataScenario {
    ERC20ZeroDecimals = 'ERC20_ZERO_DECIMALS',
    ERC20FiveDecimals = 'ERC20_FIVE_DECIMALS',
    ERC20EighteenDecimals = 'ERC20_EIGHTEEN_DECIMALS',
    ERC721 = 'ERC721',
    ERC1155Fungible = 'ERC1155_FUNGIBLE',
    ERC1155NonFungible = 'ERC1155_NON_FUNGIBLE',
    MultiAssetERC20 = 'MULTI_ASSET_ERC20',
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
