import {
    blockchainTests,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, StringRevertError, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import { TestTokenSpenderERC20TokenContract, TestTokenSpenderERC20TokenEvents, TestLibTokenSpenderContract, TestLibTokenSpenderEvents } from './wrappers';

blockchainTests.resets('LibTokenSpender library', env => {
    let tokenSpender: TestLibTokenSpenderContract;
    let token: TestTokenSpenderERC20TokenContract;

    before(async () => {
        tokenSpender = await TestLibTokenSpenderContract.deployFrom0xArtifactAsync(
            artifacts.TestLibTokenSpender,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        token = await TestTokenSpenderERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestTokenSpenderERC20Token,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('spendERC20Tokens()', () => {
        const EMPTY_RETURN_AMOUNT = 1337;
        const FALSE_RETURN_AMOUNT = 1338;
        const REVERT_RETURN_AMOUNT = 1339;
        const TRIGGER_FALLBACK_SUCCESS_AMOUNT = 1340;
        const TRIGGER_FALLBACK_FAILURE_AMOUNT = 1341;

        it('spendERC20Tokens() successfully calls compliant ERC20 token', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(123456);
            const receipt = await tokenSpender
                .spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        sender: tokenSpender.address,
                        from: tokenFrom,
                        to: tokenTo,
                        amount: tokenAmount,
                    },
                ],
                TestTokenSpenderERC20TokenEvents.TransferFromCalled,
            );
        });

        it('spendERC20Tokens() successfully calls non-compliant ERC20 token', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(EMPTY_RETURN_AMOUNT);
            const receipt = await tokenSpender
                .spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        sender: tokenSpender.address,
                        from: tokenFrom,
                        to: tokenTo,
                        amount: tokenAmount,
                    },
                ],
                TestTokenSpenderERC20TokenEvents.TransferFromCalled,
            );
        });

        it('spendERC20Tokens() reverts if ERC20 token reverts', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(REVERT_RETURN_AMOUNT);
            const tx = tokenSpender
                .spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
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

        it('spendERC20Tokens() reverts if ERC20 token returns false', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(FALSE_RETURN_AMOUNT);
            const tx = tokenSpender
                .spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
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

        it('spendERC20Tokens() falls back successfully to TokenSpender._spendERC20Tokens()', async () => {
            const tokenFrom = randomAddress();
            const tokenTo = randomAddress();
            const tokenAmount = new BigNumber(TRIGGER_FALLBACK_SUCCESS_AMOUNT);
            const receipt = await tokenSpender
                .spendERC20Tokens(token.address, tokenFrom, tokenTo, tokenAmount)
                .awaitTransactionSuccessAsync();
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        token: token.address,
                        owner: tokenFrom,
                        to: tokenTo,
                        amount: tokenAmount,
                    },
                ],
                TestLibTokenSpenderEvents.FallbackCalled,
            );
        });
    });

    describe('getSpendableERC20BalanceOf()', () => {
        it("returns the minimum of the owner's balance and allowance", async () => {
            const balance = getRandomInteger(1, '1e18');
            const allowance = getRandomInteger(1, '1e18');
            const tokenOwner = randomAddress();
            await token
                .setBalanceAndAllowanceOf(tokenOwner, balance, tokenSpender.address, allowance)
                .awaitTransactionSuccessAsync();
            const spendableBalance = await tokenSpender.getSpendableERC20BalanceOf(token.address, tokenOwner).callAsync();
            expect(spendableBalance).to.bignumber.eq(BigNumber.min(balance, allowance));
        });
    });
});
