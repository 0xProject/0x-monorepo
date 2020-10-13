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
const utils_1 = require("@0x/utils");
const wrappers_1 = require("../../src/wrappers");
const artifacts_1 = require("../artifacts");
const abis_1 = require("../utils/abis");
const migration_1 = require("../utils/migration");
const wrappers_2 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('TokenSpender feature', env => {
    let zeroEx;
    let feature;
    let token;
    let allowanceTarget;
    before(() => __awaiter(this, void 0, void 0, function* () {
        const [owner] = yield env.getAccountAddressesAsync();
        zeroEx = yield migration_1.fullMigrateAsync(owner, env.provider, env.txDefaults, {
            tokenSpender: (yield wrappers_1.TokenSpenderFeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTokenSpender, env.provider, env.txDefaults, artifacts_1.artifacts)).address,
        });
        feature = new wrappers_1.TokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
        token = yield wrappers_2.TestTokenSpenderERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTokenSpenderERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts);
        allowanceTarget = yield feature.getAllowanceTarget().callAsync();
    }));
    describe('_spendERC20Tokens()', () => {
        const EMPTY_RETURN_AMOUNT = 1337;
        const FALSE_RETURN_AMOUNT = 1338;
        const REVERT_RETURN_AMOUNT = 1339;
        it('_spendERC20Tokens() successfully calls compliant ERC20 token', () => __awaiter(this, void 0, void 0, function* () {
            const tokenFrom = contracts_test_utils_1.randomAddress();
            const tokenTo = contracts_test_utils_1.randomAddress();
            const tokenAmount = new utils_1.BigNumber(123456);
            const receipt = yield feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    sender: allowanceTarget,
                    from: tokenFrom,
                    to: tokenTo,
                    amount: tokenAmount,
                },
            ], wrappers_2.TestTokenSpenderERC20TokenEvents.TransferFromCalled);
        }));
        it('_spendERC20Tokens() successfully calls non-compliant ERC20 token', () => __awaiter(this, void 0, void 0, function* () {
            const tokenFrom = contracts_test_utils_1.randomAddress();
            const tokenTo = contracts_test_utils_1.randomAddress();
            const tokenAmount = new utils_1.BigNumber(EMPTY_RETURN_AMOUNT);
            const receipt = yield feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    sender: allowanceTarget,
                    from: tokenFrom,
                    to: tokenTo,
                    amount: tokenAmount,
                },
            ], wrappers_2.TestTokenSpenderERC20TokenEvents.TransferFromCalled);
        }));
        it('_spendERC20Tokens() reverts if ERC20 token reverts', () => __awaiter(this, void 0, void 0, function* () {
            const tokenFrom = contracts_test_utils_1.randomAddress();
            const tokenTo = contracts_test_utils_1.randomAddress();
            const tokenAmount = new utils_1.BigNumber(REVERT_RETURN_AMOUNT);
            const tx = feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            const expectedError = new utils_1.ZeroExRevertErrors.Spender.SpenderERC20TransferFromFailedError(token.address, tokenFrom, tokenTo, tokenAmount, new utils_1.StringRevertError('TestTokenSpenderERC20Token/Revert').encode());
            return contracts_test_utils_1.expect(tx).to.revertWith(expectedError);
        }));
        it('_spendERC20Tokens() reverts if ERC20 token returns false', () => __awaiter(this, void 0, void 0, function* () {
            const tokenFrom = contracts_test_utils_1.randomAddress();
            const tokenTo = contracts_test_utils_1.randomAddress();
            const tokenAmount = new utils_1.BigNumber(FALSE_RETURN_AMOUNT);
            const tx = feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.Spender.SpenderERC20TransferFromFailedError(token.address, tokenFrom, tokenTo, tokenAmount, utils_1.hexUtils.leftPad(0)));
        }));
    });
    describe('getSpendableERC20BalanceOf()', () => {
        it("returns the minimum of the owner's balance and allowance", () => __awaiter(this, void 0, void 0, function* () {
            const balance = contracts_test_utils_1.getRandomInteger(1, '1e18');
            const allowance = contracts_test_utils_1.getRandomInteger(1, '1e18');
            const tokenOwner = contracts_test_utils_1.randomAddress();
            yield token
                .setBalanceAndAllowanceOf(tokenOwner, balance, allowanceTarget, allowance)
                .awaitTransactionSuccessAsync();
            const spendableBalance = yield feature.getSpendableERC20BalanceOf(token.address, tokenOwner).callAsync();
            contracts_test_utils_1.expect(spendableBalance).to.bignumber.eq(utils_1.BigNumber.min(balance, allowance));
        }));
    });
});
//# sourceMappingURL=token_spender_test.js.map