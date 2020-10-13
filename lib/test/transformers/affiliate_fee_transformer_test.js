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
contracts_test_utils_1.blockchainTests.resets('AffiliateFeeTransformer', env => {
    const recipients = new Array(2).fill(0).map(() => contracts_test_utils_1.randomAddress());
    let caller;
    let token;
    let transformer;
    let host;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [caller] = yield env.getAccountAddressesAsync();
        token = yield wrappers_1.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts);
        transformer = yield wrappers_1.AffiliateFeeTransformerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.AffiliateFeeTransformer, env.provider, env.txDefaults, artifacts_1.artifacts);
        host = yield wrappers_1.TestTransformerHostContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTransformerHost, env.provider, Object.assign({}, env.txDefaults, { from: caller }), artifacts_1.artifacts);
    }));
    const ZERO_BALANCES = {
        ethBalance: ZERO_AMOUNT,
        tokenBalance: ZERO_AMOUNT,
    };
    function getBalancesAsync(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                ethBalance: yield env.web3Wrapper.getBalanceInWeiAsync(owner),
                tokenBalance: yield token.balanceOf(owner).callAsync(),
            };
        });
    }
    function mintHostTokensAsync(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            yield token.mint(host.address, amount).awaitTransactionSuccessAsync();
        });
    }
    function sendEtherAsync(to, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            yield env.web3Wrapper.awaitTransactionSuccessAsync(yield env.web3Wrapper.sendTransactionAsync(Object.assign({}, env.txDefaults, { to, from: caller, value: amount })));
        });
    }
    it('can transfer a token and ETH', () => __awaiter(this, void 0, void 0, function* () {
        const amounts = recipients.map(() => contracts_test_utils_1.getRandomInteger(1, '1e18'));
        const tokens = [token.address, order_utils_1.ETH_TOKEN_ADDRESS];
        const data = order_utils_1.encodeAffiliateFeeTransformerData({
            fees: recipients.map((r, i) => ({
                token: tokens[i],
                amount: amounts[i],
                recipient: r,
            })),
        });
        yield mintHostTokensAsync(amounts[0]);
        yield sendEtherAsync(host.address, amounts[1]);
        yield host
            .rawExecuteTransform(transformer.address, {
            data,
            callDataHash: utils_1.hexUtils.random(),
            sender: contracts_test_utils_1.randomAddress(),
            taker: contracts_test_utils_1.randomAddress(),
        })
            .awaitTransactionSuccessAsync();
        contracts_test_utils_1.expect(yield getBalancesAsync(host.address)).to.deep.eq(ZERO_BALANCES);
        contracts_test_utils_1.expect(yield getBalancesAsync(recipients[0])).to.deep.eq({
            tokenBalance: amounts[0],
            ethBalance: ZERO_AMOUNT,
        });
        contracts_test_utils_1.expect(yield getBalancesAsync(recipients[1])).to.deep.eq({
            tokenBalance: ZERO_AMOUNT,
            ethBalance: amounts[1],
        });
    }));
    it('can transfer all of a token and ETH', () => __awaiter(this, void 0, void 0, function* () {
        const amounts = recipients.map(() => contracts_test_utils_1.getRandomInteger(1, '1e18'));
        const tokens = [token.address, order_utils_1.ETH_TOKEN_ADDRESS];
        const data = order_utils_1.encodeAffiliateFeeTransformerData({
            fees: recipients.map((r, i) => ({
                token: tokens[i],
                amount: MAX_UINT256,
                recipient: r,
            })),
        });
        yield mintHostTokensAsync(amounts[0]);
        yield sendEtherAsync(host.address, amounts[1]);
        yield host
            .rawExecuteTransform(transformer.address, {
            data,
            callDataHash: utils_1.hexUtils.random(),
            sender: contracts_test_utils_1.randomAddress(),
            taker: contracts_test_utils_1.randomAddress(),
        })
            .awaitTransactionSuccessAsync();
        contracts_test_utils_1.expect(yield getBalancesAsync(host.address)).to.deep.eq(ZERO_BALANCES);
        contracts_test_utils_1.expect(yield getBalancesAsync(recipients[0])).to.deep.eq({
            tokenBalance: amounts[0],
            ethBalance: ZERO_AMOUNT,
        });
        contracts_test_utils_1.expect(yield getBalancesAsync(recipients[1])).to.deep.eq({
            tokenBalance: ZERO_AMOUNT,
            ethBalance: amounts[1],
        });
    }));
    it('can transfer less than the balance of a token and ETH', () => __awaiter(this, void 0, void 0, function* () {
        const amounts = recipients.map(() => contracts_test_utils_1.getRandomInteger(1, '1e18'));
        const tokens = [token.address, order_utils_1.ETH_TOKEN_ADDRESS];
        const data = order_utils_1.encodeAffiliateFeeTransformerData({
            fees: recipients.map((r, i) => ({
                token: tokens[i],
                amount: amounts[i].minus(1),
                recipient: r,
            })),
        });
        yield mintHostTokensAsync(amounts[0]);
        yield sendEtherAsync(host.address, amounts[1]);
        yield host
            .rawExecuteTransform(transformer.address, {
            data,
            callDataHash: utils_1.hexUtils.random(),
            sender: contracts_test_utils_1.randomAddress(),
            taker: contracts_test_utils_1.randomAddress(),
        })
            .awaitTransactionSuccessAsync();
        contracts_test_utils_1.expect(yield getBalancesAsync(host.address)).to.deep.eq({
            tokenBalance: new utils_1.BigNumber(1),
            ethBalance: new utils_1.BigNumber(1),
        });
        contracts_test_utils_1.expect(yield getBalancesAsync(recipients[0])).to.deep.eq({
            tokenBalance: amounts[0].minus(1),
            ethBalance: ZERO_AMOUNT,
        });
        contracts_test_utils_1.expect(yield getBalancesAsync(recipients[1])).to.deep.eq({
            tokenBalance: ZERO_AMOUNT,
            ethBalance: amounts[1].minus(1),
        });
    }));
});
//# sourceMappingURL=affiliate_fee_transformer_test.js.map