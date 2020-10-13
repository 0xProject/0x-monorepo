"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_erc20_1 = require("@0x/contracts-erc20");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const wrappers_1 = require("../../src/wrappers");
const artifacts_1 = require("../artifacts");
const abis_1 = require("../utils/abis");
const migration_1 = require("../utils/migration");
const wrappers_2 = require("../wrappers");
contracts_test_utils_1.blockchainTests('LiquidityProvider feature', env => {
    let zeroEx;
    let feature;
    let token;
    let weth;
    let owner;
    let taker;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner, taker] = yield env.getAccountAddressesAsync();
        zeroEx = yield migration_1.fullMigrateAsync(owner, env.provider, env.txDefaults, {
            tokenSpender: (yield wrappers_1.TokenSpenderFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTokenSpender, env.provider, env.txDefaults, artifacts_1.artifacts)).address,
        });
        const tokenSpender = new wrappers_1.TokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
        const allowanceTarget = yield tokenSpender.getAllowanceTarget().callAsync();
        token = yield contracts_erc20_1.DummyERC20TokenContract.deployFrom0xArtifactAsync(contracts_erc20_1.artifacts.DummyERC20Token, env.provider, env.txDefaults, contracts_erc20_1.artifacts, contracts_test_utils_1.constants.DUMMY_TOKEN_NAME, contracts_test_utils_1.constants.DUMMY_TOKEN_SYMBOL, contracts_test_utils_1.constants.DUMMY_TOKEN_DECIMALS, contracts_test_utils_1.constants.DUMMY_TOKEN_TOTAL_SUPPLY);
        yield token.setBalance(taker, contracts_test_utils_1.constants.INITIAL_ERC20_BALANCE).awaitTransactionSuccessAsync();
        weth = yield wrappers_2.TestWethContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestWeth, env.provider, env.txDefaults, artifacts_1.artifacts);
        yield token
            .approve(allowanceTarget, contracts_test_utils_1.constants.INITIAL_ERC20_ALLOWANCE)
            .awaitTransactionSuccessAsync({ from: taker });
        feature = new wrappers_1.LiquidityProviderFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
        const featureImpl = yield wrappers_1.LiquidityProviderFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.LiquidityProviderFeature, env.provider, env.txDefaults, artifacts_1.artifacts, weth.address);
        yield new wrappers_1.IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis_1.abis)
            .migrate(featureImpl.address, featureImpl.migrate().getABIEncodedTransactionData(), owner)
            .awaitTransactionSuccessAsync();
    }));
    describe('Registry', () => {
        it('`getLiquidityProviderForMarket` reverts if address is not set', () => __awaiter(this, void 0, void 0, function* () {
            const [xAsset, yAsset] = [contracts_test_utils_1.randomAddress(), contracts_test_utils_1.randomAddress()];
            let tx = feature.getLiquidityProviderForMarket(xAsset, yAsset).awaitTransactionSuccessAsync();
            contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(xAsset, yAsset));
            tx = feature.getLiquidityProviderForMarket(yAsset, xAsset).awaitTransactionSuccessAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(yAsset, xAsset));
        }));
        it('can set/get a liquidity provider address for a given market', () => __awaiter(this, void 0, void 0, function* () {
            const expectedAddress = contracts_test_utils_1.randomAddress();
            yield feature
                .setLiquidityProviderForMarket(token.address, weth.address, expectedAddress)
                .awaitTransactionSuccessAsync();
            let actualAddress = yield feature.getLiquidityProviderForMarket(token.address, weth.address).callAsync();
            contracts_test_utils_1.expect(actualAddress).to.equal(expectedAddress);
            actualAddress = yield feature.getLiquidityProviderForMarket(weth.address, token.address).callAsync();
            contracts_test_utils_1.expect(actualAddress).to.equal(expectedAddress);
        }));
        it('can update a liquidity provider address for a given market', () => __awaiter(this, void 0, void 0, function* () {
            const expectedAddress = contracts_test_utils_1.randomAddress();
            yield feature
                .setLiquidityProviderForMarket(token.address, weth.address, expectedAddress)
                .awaitTransactionSuccessAsync();
            let actualAddress = yield feature.getLiquidityProviderForMarket(token.address, weth.address).callAsync();
            contracts_test_utils_1.expect(actualAddress).to.equal(expectedAddress);
            actualAddress = yield feature.getLiquidityProviderForMarket(weth.address, token.address).callAsync();
            contracts_test_utils_1.expect(actualAddress).to.equal(expectedAddress);
        }));
        it('can effectively remove a liquidity provider for a market by setting the address to 0', () => __awaiter(this, void 0, void 0, function* () {
            yield feature
                .setLiquidityProviderForMarket(token.address, weth.address, contracts_test_utils_1.constants.NULL_ADDRESS)
                .awaitTransactionSuccessAsync();
            const tx = feature
                .getLiquidityProviderForMarket(token.address, weth.address)
                .awaitTransactionSuccessAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(token.address, weth.address));
        }));
        it('reverts if non-owner attempts to set an address', () => __awaiter(this, void 0, void 0, function* () {
            const tx = feature
                .setLiquidityProviderForMarket(contracts_test_utils_1.randomAddress(), contracts_test_utils_1.randomAddress(), contracts_test_utils_1.randomAddress())
                .awaitTransactionSuccessAsync({ from: taker });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(taker, owner));
        }));
    });
    contracts_test_utils_1.blockchainTests.resets('Swap', () => {
        let liquidityProvider;
        const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        before(() => __awaiter(this, void 0, void 0, function* () {
            liquidityProvider = yield wrappers_2.TestBridgeContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestBridge, env.provider, env.txDefaults, artifacts_1.artifacts, token.address, weth.address);
            yield feature
                .setLiquidityProviderForMarket(token.address, weth.address, liquidityProvider.address)
                .awaitTransactionSuccessAsync();
        }));
        it('Cannot execute a swap for a market without a liquidity provider set', () => __awaiter(this, void 0, void 0, function* () {
            const [xAsset, yAsset] = [contracts_test_utils_1.randomAddress(), contracts_test_utils_1.randomAddress()];
            const tx = feature
                .sellToLiquidityProvider(xAsset, yAsset, contracts_test_utils_1.constants.NULL_ADDRESS, contracts_test_utils_1.constants.ONE_ETHER, contracts_test_utils_1.constants.ZERO_AMOUNT)
                .awaitTransactionSuccessAsync({ from: taker });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(xAsset, yAsset));
        }));
        it('Successfully executes an ERC20-ERC20 swap', () => __awaiter(this, void 0, void 0, function* () {
            const tx = yield feature
                .sellToLiquidityProvider(weth.address, token.address, contracts_test_utils_1.constants.NULL_ADDRESS, contracts_test_utils_1.constants.ONE_ETHER, contracts_test_utils_1.constants.ZERO_AMOUNT)
                .awaitTransactionSuccessAsync({ from: taker });
            contracts_test_utils_1.verifyEventsFromLogs(tx.logs, [
                {
                    inputToken: token.address,
                    outputToken: weth.address,
                    inputTokenAmount: contracts_test_utils_1.constants.ONE_ETHER,
                    outputTokenAmount: contracts_test_utils_1.constants.ZERO_AMOUNT,
                    from: contracts_test_utils_1.constants.NULL_ADDRESS,
                    to: taker,
                },
            ], wrappers_2.IERC20BridgeEvents.ERC20BridgeTransfer);
        }));
        it('Reverts if cannot fulfill the minimum buy amount', () => __awaiter(this, void 0, void 0, function* () {
            const minBuyAmount = new utils_1.BigNumber(1);
            const tx = feature
                .sellToLiquidityProvider(weth.address, token.address, contracts_test_utils_1.constants.NULL_ADDRESS, contracts_test_utils_1.constants.ONE_ETHER, minBuyAmount)
                .awaitTransactionSuccessAsync({ from: taker });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.LiquidityProvider.LiquidityProviderIncompleteSellError(liquidityProvider.address, weth.address, token.address, contracts_test_utils_1.constants.ONE_ETHER, contracts_test_utils_1.constants.ZERO_AMOUNT, minBuyAmount));
        }));
        it('Successfully executes an ETH-ERC20 swap', () => __awaiter(this, void 0, void 0, function* () {
            const tx = yield feature
                .sellToLiquidityProvider(token.address, ETH_TOKEN_ADDRESS, contracts_test_utils_1.constants.NULL_ADDRESS, contracts_test_utils_1.constants.ONE_ETHER, contracts_test_utils_1.constants.ZERO_AMOUNT)
                .awaitTransactionSuccessAsync({ from: taker, value: contracts_test_utils_1.constants.ONE_ETHER });
            contracts_test_utils_1.verifyEventsFromLogs(tx.logs, [
                {
                    inputToken: weth.address,
                    outputToken: token.address,
                    inputTokenAmount: contracts_test_utils_1.constants.ONE_ETHER,
                    outputTokenAmount: contracts_test_utils_1.constants.ZERO_AMOUNT,
                    from: contracts_test_utils_1.constants.NULL_ADDRESS,
                    to: taker,
                },
            ], wrappers_2.IERC20BridgeEvents.ERC20BridgeTransfer);
        }));
        it('Successfully executes an ERC20-ETH swap', () => __awaiter(this, void 0, void 0, function* () {
            const tx = yield feature
                .sellToLiquidityProvider(ETH_TOKEN_ADDRESS, token.address, contracts_test_utils_1.constants.NULL_ADDRESS, contracts_test_utils_1.constants.ONE_ETHER, contracts_test_utils_1.constants.ZERO_AMOUNT)
                .awaitTransactionSuccessAsync({ from: taker });
            contracts_test_utils_1.verifyEventsFromLogs(tx.logs, [
                {
                    inputToken: token.address,
                    outputToken: weth.address,
                    inputTokenAmount: contracts_test_utils_1.constants.ONE_ETHER,
                    outputTokenAmount: contracts_test_utils_1.constants.ZERO_AMOUNT,
                    from: contracts_test_utils_1.constants.NULL_ADDRESS,
                    to: zeroEx.address,
                },
            ], wrappers_2.IERC20BridgeEvents.ERC20BridgeTransfer);
        }));
    });
});
//# sourceMappingURL=liquidity_provider_test.js.map