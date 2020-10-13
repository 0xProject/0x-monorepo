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
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const order_utils_1 = require("@0x/order-utils");
const utils_1 = require("@0x/utils");
const artifacts_1 = require("../artifacts");
const wrappers_1 = require("../wrappers");
const { MAX_UINT256, ZERO_AMOUNT } = contracts_test_utils_1.constants;
contracts_test_utils_1.blockchainTests.resets('WethTransformer', env => {
    let weth;
    let transformer;
    let host;
    before(() => __awaiter(this, void 0, void 0, function* () {
        weth = yield wrappers_1.TestWethContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestWeth, env.provider, env.txDefaults, artifacts_1.artifacts);
        transformer = yield wrappers_1.WethTransformerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.WethTransformer, env.provider, env.txDefaults, artifacts_1.artifacts, weth.address);
        host = yield wrappers_1.TestWethTransformerHostContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestWethTransformerHost, env.provider, env.txDefaults, artifacts_1.artifacts, weth.address);
    }));
    function getHostBalancesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                ethBalance: yield env.web3Wrapper.getBalanceInWeiAsync(host.address),
                wethBalance: yield weth.balanceOf(host.address).callAsync(),
            };
        });
    }
    it('fails if the token is neither ETH or WETH', () => __awaiter(this, void 0, void 0, function* () {
        const amount = contracts_test_utils_1.getRandomInteger(1, '1e18');
        const data = order_utils_1.encodeWethTransformerData({
            amount,
            token: contracts_test_utils_1.randomAddress(),
        });
        const tx = host
            .executeTransform(amount, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidTransformDataError(utils_1.ZeroExRevertErrors.TransformERC20.InvalidTransformDataErrorCode.InvalidTokens, data));
    }));
    it('can unwrap WETH', () => __awaiter(this, void 0, void 0, function* () {
        const amount = contracts_test_utils_1.getRandomInteger(1, '1e18');
        const data = order_utils_1.encodeWethTransformerData({
            amount,
            token: weth.address,
        });
        yield host.executeTransform(amount, transformer.address, data).awaitTransactionSuccessAsync({ value: amount });
        contracts_test_utils_1.expect(yield getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount,
            wethBalance: ZERO_AMOUNT,
        });
    }));
    it('can unwrap all WETH', () => __awaiter(this, void 0, void 0, function* () {
        const amount = contracts_test_utils_1.getRandomInteger(1, '1e18');
        const data = order_utils_1.encodeWethTransformerData({
            amount: MAX_UINT256,
            token: weth.address,
        });
        yield host.executeTransform(amount, transformer.address, data).awaitTransactionSuccessAsync({ value: amount });
        contracts_test_utils_1.expect(yield getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount,
            wethBalance: ZERO_AMOUNT,
        });
    }));
    it('can unwrap some WETH', () => __awaiter(this, void 0, void 0, function* () {
        const amount = contracts_test_utils_1.getRandomInteger(1, '1e18');
        const data = order_utils_1.encodeWethTransformerData({
            amount: amount.dividedToIntegerBy(2),
            token: weth.address,
        });
        yield host.executeTransform(amount, transformer.address, data).awaitTransactionSuccessAsync({ value: amount });
        contracts_test_utils_1.expect(yield getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount.dividedToIntegerBy(2),
            wethBalance: amount.minus(amount.dividedToIntegerBy(2)),
        });
    }));
    it('can wrap ETH', () => __awaiter(this, void 0, void 0, function* () {
        const amount = contracts_test_utils_1.getRandomInteger(1, '1e18');
        const data = order_utils_1.encodeWethTransformerData({
            amount,
            token: order_utils_1.ETH_TOKEN_ADDRESS,
        });
        yield host
            .executeTransform(ZERO_AMOUNT, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        contracts_test_utils_1.expect(yield getHostBalancesAsync()).to.deep.eq({
            ethBalance: ZERO_AMOUNT,
            wethBalance: amount,
        });
    }));
    it('can wrap all ETH', () => __awaiter(this, void 0, void 0, function* () {
        const amount = contracts_test_utils_1.getRandomInteger(1, '1e18');
        const data = order_utils_1.encodeWethTransformerData({
            amount: MAX_UINT256,
            token: order_utils_1.ETH_TOKEN_ADDRESS,
        });
        yield host
            .executeTransform(ZERO_AMOUNT, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        contracts_test_utils_1.expect(yield getHostBalancesAsync()).to.deep.eq({
            ethBalance: ZERO_AMOUNT,
            wethBalance: amount,
        });
    }));
    it('can wrap some ETH', () => __awaiter(this, void 0, void 0, function* () {
        const amount = contracts_test_utils_1.getRandomInteger(1, '1e18');
        const data = order_utils_1.encodeWethTransformerData({
            amount: amount.dividedToIntegerBy(2),
            token: order_utils_1.ETH_TOKEN_ADDRESS,
        });
        yield host
            .executeTransform(ZERO_AMOUNT, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        contracts_test_utils_1.expect(yield getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount.minus(amount.dividedToIntegerBy(2)),
            wethBalance: amount.dividedToIntegerBy(2),
        });
    }));
});
//# sourceMappingURL=weth_transformer_test.js.map