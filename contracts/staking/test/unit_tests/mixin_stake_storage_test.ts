import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { StoredBalance } from '../utils/types';

import { artifacts, TestMixinStakeStorageContract } from '../../src';
import { constants } from '../utils/constants';

blockchainTests.resets('MixinStakeStorage unit tests', env => {
    let testContract: TestMixinStakeStorageContract;
    let defaultUninitializedBalance: StoredBalance;
    let defaultSyncedBalance: StoredBalance;
    let defaultUnsyncedBalance: StoredBalance;

    const CURRENT_EPOCH = new BigNumber(5);
    const INDEX_ZERO = new BigNumber(0);
    const INDEX_ONE = new BigNumber(1);

    before(async () => {
        testContract = await TestMixinStakeStorageContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinStakeStorage,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await testContract.setCurrentEpoch.awaitTransactionSuccessAsync(CURRENT_EPOCH);
        defaultUninitializedBalance = {
            currentEpoch: constants.INITIAL_EPOCH,
            currentEpochBalance: new BigNumber(0),
            nextEpochBalance: new BigNumber(0),
        };
        defaultSyncedBalance = {
            currentEpoch: CURRENT_EPOCH,
            currentEpochBalance: new BigNumber(16),
            nextEpochBalance: new BigNumber(16),
        };
        defaultUnsyncedBalance = {
            currentEpoch: CURRENT_EPOCH.minus(1),
            currentEpochBalance: new BigNumber(10),
            nextEpochBalance: new BigNumber(16),
        };
    });

    async function getTestBalancesAsync(index: Numberish): Promise<StoredBalance> {
        const storedBalance: Partial<StoredBalance> = {};
        [
            storedBalance.currentEpoch,
            storedBalance.currentEpochBalance,
            storedBalance.nextEpochBalance,
        ] = await testContract.testBalances.callAsync(new BigNumber(index));
        return storedBalance as StoredBalance;
    }

    describe('Move stake', () => {
        async function moveStakeAndVerifyBalancesAsync(
            fromBalance: StoredBalance,
            toBalance: StoredBalance,
            amount: BigNumber,
        ): Promise<void> {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(fromBalance, INDEX_ZERO);
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(toBalance, INDEX_ONE);
            await testContract.moveStake.awaitTransactionSuccessAsync(INDEX_ZERO, INDEX_ONE, amount);

            const actualBalances = await Promise.all([
                getTestBalancesAsync(INDEX_ZERO),
                getTestBalancesAsync(INDEX_ONE),
            ]);
            expect(actualBalances[0]).to.deep.equal({
                currentEpoch: CURRENT_EPOCH,
                currentEpochBalance: fromBalance.currentEpochBalance,
                nextEpochBalance: fromBalance.nextEpochBalance.minus(amount),
            });
            expect(actualBalances[1]).to.deep.equal({
                currentEpoch: CURRENT_EPOCH,
                currentEpochBalance: toBalance.currentEpochBalance,
                nextEpochBalance: toBalance.nextEpochBalance.plus(amount),
            });
        }

        it('Updates balances to reflect move', async () => {
            await moveStakeAndVerifyBalancesAsync(
                defaultSyncedBalance,
                defaultSyncedBalance,
                defaultSyncedBalance.nextEpochBalance.dividedToIntegerBy(2),
            );
        });
        it('Can move amount equal to next epoch balance', async () => {
            await moveStakeAndVerifyBalancesAsync(
                defaultSyncedBalance,
                defaultSyncedBalance,
                defaultSyncedBalance.nextEpochBalance,
            );
        });
        it('Moves to and initializes a previously uninitalized balance', async () => {
            await moveStakeAndVerifyBalancesAsync(
                defaultSyncedBalance,
                defaultUninitializedBalance,
                defaultSyncedBalance.nextEpochBalance.dividedToIntegerBy(2),
            );
        });
        it('Noop if pointers are equal', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultSyncedBalance, INDEX_ZERO);
            // If the pointers weren't equal, this would revert with InsufficientBalanceError
            await testContract.moveStake.awaitTransactionSuccessAsync(
                INDEX_ZERO,
                INDEX_ZERO,
                defaultSyncedBalance.nextEpochBalance.plus(1),
            );
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it("Reverts if attempting to move more than next epoch's balance", async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultSyncedBalance, INDEX_ZERO);
            const amount = defaultSyncedBalance.nextEpochBalance.plus(1);
            const tx = testContract.moveStake.awaitTransactionSuccessAsync(INDEX_ZERO, INDEX_ONE, amount);
            await expect(tx).to.revertWith(
                new StakingRevertErrors.InsufficientBalanceError(amount, defaultSyncedBalance.nextEpochBalance),
            );
        });
    });

    describe('Load balance', () => {
        it('_loadSyncedBalance does not change state if balance was previously synced in the current epoch', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultSyncedBalance, INDEX_ZERO);
            const actualBalance = await testContract.loadSyncedBalance.callAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it('_loadSyncedBalance updates current epoch fields if the balance has not yet been synced in the current epoch', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUnsyncedBalance, INDEX_ZERO);
            const actualBalance = await testContract.loadSyncedBalance.callAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it('_loadUnsyncedBalance loads unsynced balance from storage without changing fields', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUnsyncedBalance, INDEX_ZERO);
            const actualBalance = await testContract.loadUnsyncedBalance.callAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultUnsyncedBalance);
        });
        it('_loadUnsyncedBalance loads synced balance from storage without changing fields', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultSyncedBalance, INDEX_ZERO);
            const actualBalance = await testContract.loadUnsyncedBalance.callAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
    });

    describe('Increase/decrease balance', () => {
        it('_increaseCurrentAndNextBalance', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUnsyncedBalance, INDEX_ZERO);
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.increaseCurrentAndNextBalance.awaitTransactionSuccessAsync(INDEX_ZERO, amount);
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                currentEpochBalance: defaultSyncedBalance.currentEpochBalance.plus(amount),
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.plus(amount),
            });
        });
        it('_increaseCurrentAndNextBalance (previously uninitialized)', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUninitializedBalance, INDEX_ZERO);
            const amount = defaultSyncedBalance.currentEpochBalance;
            await testContract.increaseCurrentAndNextBalance.awaitTransactionSuccessAsync(INDEX_ZERO, amount);
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it('_decreaseCurrentAndNextBalance', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUnsyncedBalance, INDEX_ZERO);
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.decreaseCurrentAndNextBalance.awaitTransactionSuccessAsync(INDEX_ZERO, amount);
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                currentEpochBalance: defaultSyncedBalance.currentEpochBalance.minus(amount),
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.minus(amount),
            });
        });
        it('_increaseNextBalance', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUnsyncedBalance, INDEX_ZERO);
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.increaseNextBalance.awaitTransactionSuccessAsync(INDEX_ZERO, amount);
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.plus(amount),
            });
        });
        it('_increaseCurrentAndNextBalance (previously uninitialized)', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUninitializedBalance, INDEX_ZERO);
            const amount = defaultSyncedBalance.currentEpochBalance;
            await testContract.increaseNextBalance.awaitTransactionSuccessAsync(INDEX_ZERO, amount);
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                currentEpochBalance: new BigNumber(0),
            });
        });
        it('_decreaseNextBalance', async () => {
            await testContract.setStoredBalance.awaitTransactionSuccessAsync(defaultUnsyncedBalance, INDEX_ZERO);
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.decreaseNextBalance.awaitTransactionSuccessAsync(INDEX_ZERO, amount);
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.minus(amount),
            });
        });
    });
});
