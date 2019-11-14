import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    hexLeftPad,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { RawRevertError, StringRevertError } from '@0x/utils';

import { TestLibERC20TokenContract, TestLibERC20TokenTargetEvents } from './wrappers';

import { artifacts } from './artifacts';

blockchainTests('LibERC20Token', env => {
    let testContract: TestLibERC20TokenContract;
    const REVERT_STRING = 'WHOOPSIE';
    const ENCODED_TRUE = hexLeftPad(1);
    const ENCODED_FALSE = hexLeftPad(0);
    const ENCODED_TWO = hexLeftPad(2);
    const ENCODED_SHORT_TRUE = hexLeftPad(2, 31);
    const ENCODED_LONG_TRUE = hexLeftPad(2, 33);

    before(async () => {
        testContract = await TestLibERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestLibERC20Token,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    function encodeRevert(message: string): string {
        return new StringRevertError(message).encode();
    }

    describe('approve()', () => {
        it('calls the target with the correct arguments', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            const { logs } = await testContract
                .testApprove(false, encodeRevert(REVERT_STRING), ENCODED_TRUE, spender, allowance)
                .awaitTransactionSuccessAsync();
            expect(logs).to.be.length(1);
            verifyEventsFromLogs(logs, [{ spender, allowance }], TestLibERC20TokenTargetEvents.ApproveCalled);
        });

        it('succeeds if the target returns true', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            await testContract
                .testApprove(false, encodeRevert(REVERT_STRING), ENCODED_TRUE, spender, allowance)
                .awaitTransactionSuccessAsync();
        });

        it('succeeds if the target returns nothing', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            await testContract
                .testApprove(false, encodeRevert(REVERT_STRING), constants.NULL_BYTES, spender, allowance)
                .awaitTransactionSuccessAsync();
        });

        it('fails if the target returns false', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            const tx = testContract
                .testApprove(false, encodeRevert(REVERT_STRING), ENCODED_FALSE, spender, allowance)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_FALSE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns nonzero and not true', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            const tx = testContract
                .testApprove(false, encodeRevert(REVERT_STRING), ENCODED_TWO, spender, allowance)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_TWO);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns less than 32 bytes', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            const tx = testContract
                .testApprove(false, encodeRevert(REVERT_STRING), ENCODED_SHORT_TRUE, spender, allowance)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_SHORT_TRUE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns greater than 32 bytes', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            const tx = testContract
                .testApprove(false, encodeRevert(REVERT_STRING), ENCODED_LONG_TRUE, spender, allowance)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_LONG_TRUE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target reverts', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            const tx = testContract
                .testApprove(true, encodeRevert(REVERT_STRING), ENCODED_TRUE, spender, allowance)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(REVERT_STRING);
        });

        it('fails if the target reverts with no data', async () => {
            const spender = randomAddress();
            const allowance = getRandomInteger(0, 100e18);
            const tx = testContract
                .testApprove(true, constants.NULL_BYTES, ENCODED_TRUE, spender, allowance)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.be.rejectedWith('revert');
        });
    });

    describe('transfer()', () => {
        it('calls the target with the correct arguments', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract
                .testTransfer(false, encodeRevert(REVERT_STRING), ENCODED_TRUE, to, amount)
                .awaitTransactionSuccessAsync();
            expect(logs).to.be.length(1);
            verifyEventsFromLogs(logs, [{ to, amount }], TestLibERC20TokenTargetEvents.TransferCalled);
        });

        it('succeeds if the target returns true', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            await testContract
                .testTransfer(false, encodeRevert(REVERT_STRING), ENCODED_TRUE, to, amount)
                .awaitTransactionSuccessAsync();
        });

        it('succeeds if the target returns nothing', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            await testContract
                .testTransfer(false, encodeRevert(REVERT_STRING), constants.NULL_BYTES, to, amount)
                .awaitTransactionSuccessAsync();
        });

        it('fails if the target returns false', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransfer(false, encodeRevert(REVERT_STRING), ENCODED_FALSE, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_FALSE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns nonzero and not true', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransfer(false, encodeRevert(REVERT_STRING), ENCODED_TWO, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_TWO);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns less than 32 bytes', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransfer(false, encodeRevert(REVERT_STRING), ENCODED_SHORT_TRUE, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_SHORT_TRUE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns greater than 32 bytes', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransfer(false, encodeRevert(REVERT_STRING), ENCODED_LONG_TRUE, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_LONG_TRUE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target reverts', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransfer(true, encodeRevert(REVERT_STRING), ENCODED_TRUE, to, amount)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(REVERT_STRING);
        });

        it('fails if the target reverts with no data', async () => {
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransfer(true, constants.NULL_BYTES, ENCODED_TRUE, to, amount)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.be.rejectedWith('revert');
        });
    });

    describe('transferFrom()', () => {
        it('calls the target with the correct arguments', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract
                .testTransferFrom(false, encodeRevert(REVERT_STRING), ENCODED_TRUE, owner, to, amount)
                .awaitTransactionSuccessAsync();
            expect(logs).to.be.length(1);
            verifyEventsFromLogs(logs, [{ from: owner, to, amount }], TestLibERC20TokenTargetEvents.TransferFromCalled);
        });

        it('succeeds if the target returns true', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            await testContract
                .testTransferFrom(false, encodeRevert(REVERT_STRING), ENCODED_TRUE, owner, to, amount)
                .awaitTransactionSuccessAsync();
        });

        it('succeeds if the target returns nothing', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            await testContract
                .testTransferFrom(false, encodeRevert(REVERT_STRING), constants.NULL_BYTES, owner, to, amount)
                .awaitTransactionSuccessAsync();
        });

        it('fails if the target returns false', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransferFrom(false, encodeRevert(REVERT_STRING), ENCODED_FALSE, owner, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_FALSE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns nonzero and not true', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransferFrom(false, encodeRevert(REVERT_STRING), ENCODED_TWO, owner, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_TWO);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns less than 32 bytes', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransferFrom(false, encodeRevert(REVERT_STRING), ENCODED_SHORT_TRUE, owner, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_SHORT_TRUE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target returns greater than 32 bytes', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransferFrom(false, encodeRevert(REVERT_STRING), ENCODED_LONG_TRUE, owner, to, amount)
                .awaitTransactionSuccessAsync();
            const expectedError = new RawRevertError(ENCODED_LONG_TRUE);
            return expect(tx).to.revertWith(expectedError);
        });

        it('fails if the target reverts', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransferFrom(true, encodeRevert(REVERT_STRING), ENCODED_TRUE, owner, to, amount)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(REVERT_STRING);
        });

        it('fails if the target reverts with no data', async () => {
            const owner = randomAddress();
            const to = randomAddress();
            const amount = getRandomInteger(0, 100e18);
            const tx = testContract
                .testTransferFrom(true, constants.NULL_BYTES, ENCODED_TRUE, owner, to, amount)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.be.rejectedWith('revert');
        });
    });
});
