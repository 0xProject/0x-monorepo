"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AffiliateFeeTransformer = require("../test/generated-artifacts/AffiliateFeeTransformer.json");
const AllowanceTarget = require("../test/generated-artifacts/AllowanceTarget.json");
const BootstrapFeature = require("../test/generated-artifacts/BootstrapFeature.json");
const BridgeAdapter = require("../test/generated-artifacts/BridgeAdapter.json");
const FillQuoteTransformer = require("../test/generated-artifacts/FillQuoteTransformer.json");
const FixinCommon = require("../test/generated-artifacts/FixinCommon.json");
const FixinEIP712 = require("../test/generated-artifacts/FixinEIP712.json");
const FixinReentrancyGuard = require("../test/generated-artifacts/FixinReentrancyGuard.json");
const FlashWallet = require("../test/generated-artifacts/FlashWallet.json");
const FullMigration = require("../test/generated-artifacts/FullMigration.json");
const IAllowanceTarget = require("../test/generated-artifacts/IAllowanceTarget.json");
const IBootstrapFeature = require("../test/generated-artifacts/IBootstrapFeature.json");
const IBridgeAdapter = require("../test/generated-artifacts/IBridgeAdapter.json");
const IERC20Bridge = require("../test/generated-artifacts/IERC20Bridge.json");
const IERC20Transformer = require("../test/generated-artifacts/IERC20Transformer.json");
const IExchange = require("../test/generated-artifacts/IExchange.json");
const IFeature = require("../test/generated-artifacts/IFeature.json");
const IFlashWallet = require("../test/generated-artifacts/IFlashWallet.json");
const IGasToken = require("../test/generated-artifacts/IGasToken.json");
const ILiquidityProviderFeature = require("../test/generated-artifacts/ILiquidityProviderFeature.json");
const IMetaTransactionsFeature = require("../test/generated-artifacts/IMetaTransactionsFeature.json");
const InitialMigration = require("../test/generated-artifacts/InitialMigration.json");
const IOwnableFeature = require("../test/generated-artifacts/IOwnableFeature.json");
const ISignatureValidatorFeature = require("../test/generated-artifacts/ISignatureValidatorFeature.json");
const ISimpleFunctionRegistryFeature = require("../test/generated-artifacts/ISimpleFunctionRegistryFeature.json");
const ITestSimpleFunctionRegistryFeature = require("../test/generated-artifacts/ITestSimpleFunctionRegistryFeature.json");
const ITokenSpenderFeature = require("../test/generated-artifacts/ITokenSpenderFeature.json");
const ITransformERC20Feature = require("../test/generated-artifacts/ITransformERC20Feature.json");
const IUniswapFeature = require("../test/generated-artifacts/IUniswapFeature.json");
const IZeroEx = require("../test/generated-artifacts/IZeroEx.json");
const LibBootstrap = require("../test/generated-artifacts/LibBootstrap.json");
const LibCommonRichErrors = require("../test/generated-artifacts/LibCommonRichErrors.json");
const LibERC20Transformer = require("../test/generated-artifacts/LibERC20Transformer.json");
const LibLiquidityProviderRichErrors = require("../test/generated-artifacts/LibLiquidityProviderRichErrors.json");
const LibLiquidityProviderStorage = require("../test/generated-artifacts/LibLiquidityProviderStorage.json");
const LibMetaTransactionsRichErrors = require("../test/generated-artifacts/LibMetaTransactionsRichErrors.json");
const LibMetaTransactionsStorage = require("../test/generated-artifacts/LibMetaTransactionsStorage.json");
const LibMigrate = require("../test/generated-artifacts/LibMigrate.json");
const LibOwnableRichErrors = require("../test/generated-artifacts/LibOwnableRichErrors.json");
const LibOwnableStorage = require("../test/generated-artifacts/LibOwnableStorage.json");
const LibProxyRichErrors = require("../test/generated-artifacts/LibProxyRichErrors.json");
const LibProxyStorage = require("../test/generated-artifacts/LibProxyStorage.json");
const LibReentrancyGuardStorage = require("../test/generated-artifacts/LibReentrancyGuardStorage.json");
const LibSignatureRichErrors = require("../test/generated-artifacts/LibSignatureRichErrors.json");
const LibSignedCallData = require("../test/generated-artifacts/LibSignedCallData.json");
const LibSimpleFunctionRegistryRichErrors = require("../test/generated-artifacts/LibSimpleFunctionRegistryRichErrors.json");
const LibSimpleFunctionRegistryStorage = require("../test/generated-artifacts/LibSimpleFunctionRegistryStorage.json");
const LibSpenderRichErrors = require("../test/generated-artifacts/LibSpenderRichErrors.json");
const LibStorage = require("../test/generated-artifacts/LibStorage.json");
const LibTokenSpenderStorage = require("../test/generated-artifacts/LibTokenSpenderStorage.json");
const LibTransformERC20RichErrors = require("../test/generated-artifacts/LibTransformERC20RichErrors.json");
const LibTransformERC20Storage = require("../test/generated-artifacts/LibTransformERC20Storage.json");
const LibWalletRichErrors = require("../test/generated-artifacts/LibWalletRichErrors.json");
const LiquidityProviderFeature = require("../test/generated-artifacts/LiquidityProviderFeature.json");
const LogMetadataTransformer = require("../test/generated-artifacts/LogMetadataTransformer.json");
const MetaTransactionsFeature = require("../test/generated-artifacts/MetaTransactionsFeature.json");
const MixinAdapterAddresses = require("../test/generated-artifacts/MixinAdapterAddresses.json");
const MixinBalancer = require("../test/generated-artifacts/MixinBalancer.json");
const MixinCurve = require("../test/generated-artifacts/MixinCurve.json");
const MixinKyber = require("../test/generated-artifacts/MixinKyber.json");
const MixinMooniswap = require("../test/generated-artifacts/MixinMooniswap.json");
const MixinMStable = require("../test/generated-artifacts/MixinMStable.json");
const MixinOasis = require("../test/generated-artifacts/MixinOasis.json");
const MixinShell = require("../test/generated-artifacts/MixinShell.json");
const MixinUniswap = require("../test/generated-artifacts/MixinUniswap.json");
const MixinUniswapV2 = require("../test/generated-artifacts/MixinUniswapV2.json");
const MixinZeroExBridge = require("../test/generated-artifacts/MixinZeroExBridge.json");
const OwnableFeature = require("../test/generated-artifacts/OwnableFeature.json");
const PayTakerTransformer = require("../test/generated-artifacts/PayTakerTransformer.json");
const SignatureValidatorFeature = require("../test/generated-artifacts/SignatureValidatorFeature.json");
const SimpleFunctionRegistryFeature = require("../test/generated-artifacts/SimpleFunctionRegistryFeature.json");
const TestBridge = require("../test/generated-artifacts/TestBridge.json");
const TestCallTarget = require("../test/generated-artifacts/TestCallTarget.json");
const TestDelegateCaller = require("../test/generated-artifacts/TestDelegateCaller.json");
const TestFillQuoteTransformerBridge = require("../test/generated-artifacts/TestFillQuoteTransformerBridge.json");
const TestFillQuoteTransformerExchange = require("../test/generated-artifacts/TestFillQuoteTransformerExchange.json");
const TestFillQuoteTransformerHost = require("../test/generated-artifacts/TestFillQuoteTransformerHost.json");
const TestFullMigration = require("../test/generated-artifacts/TestFullMigration.json");
const TestInitialMigration = require("../test/generated-artifacts/TestInitialMigration.json");
const TestMetaTransactionsTransformERC20Feature = require("../test/generated-artifacts/TestMetaTransactionsTransformERC20Feature.json");
const TestMigrator = require("../test/generated-artifacts/TestMigrator.json");
const TestMintableERC20Token = require("../test/generated-artifacts/TestMintableERC20Token.json");
const TestMintTokenERC20Transformer = require("../test/generated-artifacts/TestMintTokenERC20Transformer.json");
const TestSimpleFunctionRegistryFeatureImpl1 = require("../test/generated-artifacts/TestSimpleFunctionRegistryFeatureImpl1.json");
const TestSimpleFunctionRegistryFeatureImpl2 = require("../test/generated-artifacts/TestSimpleFunctionRegistryFeatureImpl2.json");
const TestTokenSpender = require("../test/generated-artifacts/TestTokenSpender.json");
const TestTokenSpenderERC20Token = require("../test/generated-artifacts/TestTokenSpenderERC20Token.json");
const TestTransformerBase = require("../test/generated-artifacts/TestTransformerBase.json");
const TestTransformERC20 = require("../test/generated-artifacts/TestTransformERC20.json");
const TestTransformerDeployerTransformer = require("../test/generated-artifacts/TestTransformerDeployerTransformer.json");
const TestTransformerHost = require("../test/generated-artifacts/TestTransformerHost.json");
const TestWeth = require("../test/generated-artifacts/TestWeth.json");
const TestWethTransformerHost = require("../test/generated-artifacts/TestWethTransformerHost.json");
const TestZeroExFeature = require("../test/generated-artifacts/TestZeroExFeature.json");
const TokenSpenderFeature = require("../test/generated-artifacts/TokenSpenderFeature.json");
const Transformer = require("../test/generated-artifacts/Transformer.json");
const TransformERC20Feature = require("../test/generated-artifacts/TransformERC20Feature.json");
const TransformerDeployer = require("../test/generated-artifacts/TransformerDeployer.json");
const UniswapFeature = require("../test/generated-artifacts/UniswapFeature.json");
const WethTransformer = require("../test/generated-artifacts/WethTransformer.json");
const ZeroEx = require("../test/generated-artifacts/ZeroEx.json");
exports.artifacts = {
    IZeroEx: IZeroEx,
    ZeroEx: ZeroEx,
    LibCommonRichErrors: LibCommonRichErrors,
    LibLiquidityProviderRichErrors: LibLiquidityProviderRichErrors,
    LibMetaTransactionsRichErrors: LibMetaTransactionsRichErrors,
    LibOwnableRichErrors: LibOwnableRichErrors,
    LibProxyRichErrors: LibProxyRichErrors,
    LibSignatureRichErrors: LibSignatureRichErrors,
    LibSimpleFunctionRegistryRichErrors: LibSimpleFunctionRegistryRichErrors,
    LibSpenderRichErrors: LibSpenderRichErrors,
    LibTransformERC20RichErrors: LibTransformERC20RichErrors,
    LibWalletRichErrors: LibWalletRichErrors,
    AllowanceTarget: AllowanceTarget,
    FlashWallet: FlashWallet,
    IAllowanceTarget: IAllowanceTarget,
    IFlashWallet: IFlashWallet,
    TransformerDeployer: TransformerDeployer,
    BootstrapFeature: BootstrapFeature,
    IBootstrapFeature: IBootstrapFeature,
    IFeature: IFeature,
    ILiquidityProviderFeature: ILiquidityProviderFeature,
    IMetaTransactionsFeature: IMetaTransactionsFeature,
    IOwnableFeature: IOwnableFeature,
    ISignatureValidatorFeature: ISignatureValidatorFeature,
    ISimpleFunctionRegistryFeature: ISimpleFunctionRegistryFeature,
    ITokenSpenderFeature: ITokenSpenderFeature,
    ITransformERC20Feature: ITransformERC20Feature,
    IUniswapFeature: IUniswapFeature,
    LiquidityProviderFeature: LiquidityProviderFeature,
    MetaTransactionsFeature: MetaTransactionsFeature,
    OwnableFeature: OwnableFeature,
    SignatureValidatorFeature: SignatureValidatorFeature,
    SimpleFunctionRegistryFeature: SimpleFunctionRegistryFeature,
    TokenSpenderFeature: TokenSpenderFeature,
    TransformERC20Feature: TransformERC20Feature,
    UniswapFeature: UniswapFeature,
    LibSignedCallData: LibSignedCallData,
    FixinCommon: FixinCommon,
    FixinEIP712: FixinEIP712,
    FixinReentrancyGuard: FixinReentrancyGuard,
    FullMigration: FullMigration,
    InitialMigration: InitialMigration,
    LibBootstrap: LibBootstrap,
    LibMigrate: LibMigrate,
    LibLiquidityProviderStorage: LibLiquidityProviderStorage,
    LibMetaTransactionsStorage: LibMetaTransactionsStorage,
    LibOwnableStorage: LibOwnableStorage,
    LibProxyStorage: LibProxyStorage,
    LibReentrancyGuardStorage: LibReentrancyGuardStorage,
    LibSimpleFunctionRegistryStorage: LibSimpleFunctionRegistryStorage,
    LibStorage: LibStorage,
    LibTokenSpenderStorage: LibTokenSpenderStorage,
    LibTransformERC20Storage: LibTransformERC20Storage,
    AffiliateFeeTransformer: AffiliateFeeTransformer,
    FillQuoteTransformer: FillQuoteTransformer,
    IERC20Transformer: IERC20Transformer,
    LibERC20Transformer: LibERC20Transformer,
    LogMetadataTransformer: LogMetadataTransformer,
    PayTakerTransformer: PayTakerTransformer,
    Transformer: Transformer,
    WethTransformer: WethTransformer,
    BridgeAdapter: BridgeAdapter,
    IBridgeAdapter: IBridgeAdapter,
    MixinAdapterAddresses: MixinAdapterAddresses,
    MixinBalancer: MixinBalancer,
    MixinCurve: MixinCurve,
    MixinKyber: MixinKyber,
    MixinMStable: MixinMStable,
    MixinMooniswap: MixinMooniswap,
    MixinOasis: MixinOasis,
    MixinShell: MixinShell,
    MixinUniswap: MixinUniswap,
    MixinUniswapV2: MixinUniswapV2,
    MixinZeroExBridge: MixinZeroExBridge,
    IERC20Bridge: IERC20Bridge,
    IExchange: IExchange,
    IGasToken: IGasToken,
    ITestSimpleFunctionRegistryFeature: ITestSimpleFunctionRegistryFeature,
    TestBridge: TestBridge,
    TestCallTarget: TestCallTarget,
    TestDelegateCaller: TestDelegateCaller,
    TestFillQuoteTransformerBridge: TestFillQuoteTransformerBridge,
    TestFillQuoteTransformerExchange: TestFillQuoteTransformerExchange,
    TestFillQuoteTransformerHost: TestFillQuoteTransformerHost,
    TestFullMigration: TestFullMigration,
    TestInitialMigration: TestInitialMigration,
    TestMetaTransactionsTransformERC20Feature: TestMetaTransactionsTransformERC20Feature,
    TestMigrator: TestMigrator,
    TestMintTokenERC20Transformer: TestMintTokenERC20Transformer,
    TestMintableERC20Token: TestMintableERC20Token,
    TestSimpleFunctionRegistryFeatureImpl1: TestSimpleFunctionRegistryFeatureImpl1,
    TestSimpleFunctionRegistryFeatureImpl2: TestSimpleFunctionRegistryFeatureImpl2,
    TestTokenSpender: TestTokenSpender,
    TestTokenSpenderERC20Token: TestTokenSpenderERC20Token,
    TestTransformERC20: TestTransformERC20,
    TestTransformerBase: TestTransformerBase,
    TestTransformerDeployerTransformer: TestTransformerDeployerTransformer,
    TestTransformerHost: TestTransformerHost,
    TestWeth: TestWeth,
    TestWethTransformerHost: TestWethTransformerHost,
    TestZeroExFeature: TestZeroExFeature,
};
//# sourceMappingURL=artifacts.js.map