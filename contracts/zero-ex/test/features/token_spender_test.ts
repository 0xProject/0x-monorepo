import {
    blockchainTests,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, StringRevertError, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import {
    TestTokenSpenderERC20TokenContract,
    TestTokenSpenderERC20TokenEvents,
    TokenSpenderContract,
    ZeroExContract,
} from '../wrappers';

blockchainTests.resets('TokenSpender feature', env => {
    let zeroEx: ZeroExContract;
    let feature: TokenSpenderContract;
    let token: TestTokenSpenderERC20TokenContract;
    let allowanceTarget: string;

    before(async () => {
        const [owner] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults, {
            tokenSpender: await TokenSpenderContract.deployFrom0xArtifactAsync(
                artifacts.TestTokenSpender,
                env.provider,
                env.txDefaults,
                artifacts,
            ),
        });
        feature = new TokenSpenderContract(zeroEx.address, env.provider, env.txDefaults, abis);
        token = await TestTokenSpenderERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestTokenSpenderERC20Token,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        allowanceTarget = await feature.getAllowanceTarget().callAsync();
    });

    describe('_spendERC20Tokens()', () => {
        const EMPTY_RETURN_AMOUNT = 1337;
        const FALSE_RETURN_AMOUNT = 1338;
        const REVERT_RETURN_AMOUNT = 1339;

        it('_spendERC20Tokens() successfully calls compliant ERC20 token', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(123456);
            const receipt = await feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        sender: allowanceTarget,
                        from: tokenFrom,
                        to: tokenTo,
                        amount: tokenAmount,
                    },
                ],
                TestTokenSpenderERC20TokenEvents.TransferFromCalled,
            );
        });

        it('_spendERC20Tokens() successfully calls non-compliant ERC20 token', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(EMPTY_RETURN_AMOUNT);
            const receipt = await feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        sender: allowanceTarget,
                        from: tokenFrom,
                        to: tokenTo,
                        amount: tokenAmount,
                    },
                ],
                TestTokenSpenderERC20TokenEvents.TransferFromCalled,
            );
        });

        it('_spendERC20Tokens() reverts if ERC20 token reverts', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(REVERT_RETURN_AMOUNT);
            const tx = feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            const expectedError = new ZeroExRevertErrors.Spender.SpenderERC20TransferFromFailedError(
                token.address,
                tokenFrom,
                tokenTo,
                tokenAmount,
                new StringRevertError('TestTokenSpenderERC20Token/Revert').encode(),
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('_spendERC20Tokens() reverts if ERC20 token returns false', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(FALSE_RETURN_AMOUNT);
            const tx = feature
                ._spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.Spender.SpenderERC20TransferFromFailedError(
                    token.address,
                    tokenFrom,
                    tokenTo,
                    tokenAmount,
                    hexUtils.leftPad(0),
                ),
            );
        });
    });

    describe('getSpendableERC20BalanceOf()', () => {
        it("returns the minimum of the owner's balance and allowance", async () => {
            const balance = getRandomInteger(1, '1e18');
            const allowance = getRandomInteger(1, '1e18');
            const tokenOwner = randomAddress();
            await token
                .setBalanceAndAllowanceOf(tokenOwner, balance, allowanceTarget, allowance)
                .awaitTransactionSuccessAsync();
            const spendableBalance = await feature.getSpendableERC20BalanceOf(token.address, tokenOwner).callAsync();
            expect(spendableBalance).to.bignumber.eq(BigNumber.min(balance, allowance));
        });
    });
});
