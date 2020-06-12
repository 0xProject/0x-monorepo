"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AffiliateFeeTransformer = require("../test/generated-artifacts/AffiliateFeeTransformer.json");
var AllowanceTarget = require("../test/generated-artifacts/AllowanceTarget.json");
var Bootstrap = require("../test/generated-artifacts/Bootstrap.json");
var FillQuoteTransformer = require("../test/generated-artifacts/FillQuoteTransformer.json");
var FixinCommon = require("../test/generated-artifacts/FixinCommon.json");
var FlashWallet = require("../test/generated-artifacts/FlashWallet.json");
var FullMigration = require("../test/generated-artifacts/FullMigration.json");
var IAllowanceTarget = require("../test/generated-artifacts/IAllowanceTarget.json");
var IBootstrap = require("../test/generated-artifacts/IBootstrap.json");
var IERC20Transformer = require("../test/generated-artifacts/IERC20Transformer.json");
var IExchange = require("../test/generated-artifacts/IExchange.json");
var IFeature = require("../test/generated-artifacts/IFeature.json");
var IFlashWallet = require("../test/generated-artifacts/IFlashWallet.json");
var InitialMigration = require("../test/generated-artifacts/InitialMigration.json");
var IOwnable = require("../test/generated-artifacts/IOwnable.json");
var ISimpleFunctionRegistry = require("../test/generated-artifacts/ISimpleFunctionRegistry.json");
var ITestSimpleFunctionRegistryFeature = require("../test/generated-artifacts/ITestSimpleFunctionRegistryFeature.json");
var ITokenSpender = require("../test/generated-artifacts/ITokenSpender.json");
var ITransformERC20 = require("../test/generated-artifacts/ITransformERC20.json");
var LibBootstrap = require("../test/generated-artifacts/LibBootstrap.json");
var LibCommonRichErrors = require("../test/generated-artifacts/LibCommonRichErrors.json");
var LibERC20Transformer = require("../test/generated-artifacts/LibERC20Transformer.json");
var LibMigrate = require("../test/generated-artifacts/LibMigrate.json");
var LibOwnableRichErrors = require("../test/generated-artifacts/LibOwnableRichErrors.json");
var LibOwnableStorage = require("../test/generated-artifacts/LibOwnableStorage.json");
var LibProxyRichErrors = require("../test/generated-artifacts/LibProxyRichErrors.json");
var LibProxyStorage = require("../test/generated-artifacts/LibProxyStorage.json");
var LibSimpleFunctionRegistryRichErrors = require("../test/generated-artifacts/LibSimpleFunctionRegistryRichErrors.json");
var LibSimpleFunctionRegistryStorage = require("../test/generated-artifacts/LibSimpleFunctionRegistryStorage.json");
var LibSpenderRichErrors = require("../test/generated-artifacts/LibSpenderRichErrors.json");
var LibStorage = require("../test/generated-artifacts/LibStorage.json");
var LibTokenSpenderStorage = require("../test/generated-artifacts/LibTokenSpenderStorage.json");
var LibTransformERC20RichErrors = require("../test/generated-artifacts/LibTransformERC20RichErrors.json");
var LibTransformERC20Storage = require("../test/generated-artifacts/LibTransformERC20Storage.json");
var LibWalletRichErrors = require("../test/generated-artifacts/LibWalletRichErrors.json");
var Ownable = require("../test/generated-artifacts/Ownable.json");
var PayTakerTransformer = require("../test/generated-artifacts/PayTakerTransformer.json");
var SimpleFunctionRegistry = require("../test/generated-artifacts/SimpleFunctionRegistry.json");
var TestCallTarget = require("../test/generated-artifacts/TestCallTarget.json");
var TestDelegateCaller = require("../test/generated-artifacts/TestDelegateCaller.json");
var TestFillQuoteTransformerExchange = require("../test/generated-artifacts/TestFillQuoteTransformerExchange.json");
var TestFillQuoteTransformerHost = require("../test/generated-artifacts/TestFillQuoteTransformerHost.json");
var TestFullMigration = require("../test/generated-artifacts/TestFullMigration.json");
var TestInitialMigration = require("../test/generated-artifacts/TestInitialMigration.json");
var TestMigrator = require("../test/generated-artifacts/TestMigrator.json");
var TestMintableERC20Token = require("../test/generated-artifacts/TestMintableERC20Token.json");
var TestMintTokenERC20Transformer = require("../test/generated-artifacts/TestMintTokenERC20Transformer.json");
var TestSimpleFunctionRegistryFeatureImpl1 = require("../test/generated-artifacts/TestSimpleFunctionRegistryFeatureImpl1.json");
var TestSimpleFunctionRegistryFeatureImpl2 = require("../test/generated-artifacts/TestSimpleFunctionRegistryFeatureImpl2.json");
var TestTokenSpender = require("../test/generated-artifacts/TestTokenSpender.json");
var TestTokenSpenderERC20Token = require("../test/generated-artifacts/TestTokenSpenderERC20Token.json");
var TestTransformerBase = require("../test/generated-artifacts/TestTransformerBase.json");
var TestTransformERC20 = require("../test/generated-artifacts/TestTransformERC20.json");
var TestTransformerDeployerTransformer = require("../test/generated-artifacts/TestTransformerDeployerTransformer.json");
var TestTransformerHost = require("../test/generated-artifacts/TestTransformerHost.json");
var TestWeth = require("../test/generated-artifacts/TestWeth.json");
var TestWethTransformerHost = require("../test/generated-artifacts/TestWethTransformerHost.json");
var TestZeroExFeature = require("../test/generated-artifacts/TestZeroExFeature.json");
var TokenSpender = require("../test/generated-artifacts/TokenSpender.json");
var Transformer = require("../test/generated-artifacts/Transformer.json");
var TransformERC20 = require("../test/generated-artifacts/TransformERC20.json");
var TransformerDeployer = require("../test/generated-artifacts/TransformerDeployer.json");
var WethTransformer = require("../test/generated-artifacts/WethTransformer.json");
var ZeroEx = require("../test/generated-artifacts/ZeroEx.json");
exports.artifacts = {
    ZeroEx: ZeroEx,
    LibCommonRichErrors: LibCommonRichErrors,
    LibOwnableRichErrors: LibOwnableRichErrors,
    LibProxyRichErrors: LibProxyRichErrors,
    LibSimpleFunctionRegistryRichErrors: LibSimpleFunctionRegistryRichErrors,
    LibSpenderRichErrors: LibSpenderRichErrors,
    LibTransformERC20RichErrors: LibTransformERC20RichErrors,
    LibWalletRichErrors: LibWalletRichErrors,
    AllowanceTarget: AllowanceTarget,
    FlashWallet: FlashWallet,
    IAllowanceTarget: IAllowanceTarget,
    IFlashWallet: IFlashWallet,
    TransformerDeployer: TransformerDeployer,
    Bootstrap: Bootstrap,
    IBootstrap: IBootstrap,
    IFeature: IFeature,
    IOwnable: IOwnable,
    ISimpleFunctionRegistry: ISimpleFunctionRegistry,
    ITokenSpender: ITokenSpender,
    ITransformERC20: ITransformERC20,
    Ownable: Ownable,
    SimpleFunctionRegistry: SimpleFunctionRegistry,
    TokenSpender: TokenSpender,
    TransformERC20: TransformERC20,
    FixinCommon: FixinCommon,
    FullMigration: FullMigration,
    InitialMigration: InitialMigration,
    LibBootstrap: LibBootstrap,
    LibMigrate: LibMigrate,
    LibOwnableStorage: LibOwnableStorage,
    LibProxyStorage: LibProxyStorage,
    LibSimpleFunctionRegistryStorage: LibSimpleFunctionRegistryStorage,
    LibStorage: LibStorage,
    LibTokenSpenderStorage: LibTokenSpenderStorage,
    LibTransformERC20Storage: LibTransformERC20Storage,
    AffiliateFeeTransformer: AffiliateFeeTransformer,
    FillQuoteTransformer: FillQuoteTransformer,
    IERC20Transformer: IERC20Transformer,
    LibERC20Transformer: LibERC20Transformer,
    PayTakerTransformer: PayTakerTransformer,
    Transformer: Transformer,
    WethTransformer: WethTransformer,
    IExchange: IExchange,
    ITestSimpleFunctionRegistryFeature: ITestSimpleFunctionRegistryFeature,
    TestCallTarget: TestCallTarget,
    TestDelegateCaller: TestDelegateCaller,
    TestFillQuoteTransformerExchange: TestFillQuoteTransformerExchange,
    TestFillQuoteTransformerHost: TestFillQuoteTransformerHost,
    TestFullMigration: TestFullMigration,
    TestInitialMigration: TestInitialMigration,
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