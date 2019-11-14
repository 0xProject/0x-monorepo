import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { constants } from '../../src/constants';
import { StoredBalance } from '../../src/types';

import { artifacts } from '../artifacts';
import { TestMixinStakeStorageContract } from '../wrappers';

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
        await testContract.setCurrentEpoch(CURRENT_EPOCH).awaitTransactionSuccessAsync();
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
        ] = await testContract.testBalances(new BigNumber(index)).callAsync();
        return storedBalance as StoredBalance;
    }

    describe('Move stake', () => {
        async function moveStakeAndVerifyBalancesAsync(
            fromBalance: StoredBalance,
            toBalance: StoredBalance,
            amount: BigNumber,
        ): Promise<void> {
            await testContract.setStoredBalance(fromBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            await testContract.setStoredBalance(toBalance, INDEX_ONE).awaitTransactionSuccessAsync();
            await testContract.moveStake(INDEX_ZERO, INDEX_ONE, amount).awaitTransactionSuccessAsync();

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
            await testContract.setStoredBalance(defaultSyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            // If the pointers weren't equal, this would revert with InsufficientBalanceError
            await testContract
                .moveStake(INDEX_ZERO, INDEX_ZERO, defaultSyncedBalance.nextEpochBalance.plus(1))
                .awaitTransactionSuccessAsync();
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it("Reverts if attempting to move more than next epoch's balance", async () => {
            await testContract.setStoredBalance(defaultSyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const amount = defaultSyncedBalance.nextEpochBalance.plus(1);
            const tx = testContract.moveStake(INDEX_ZERO, INDEX_ONE, amount).awaitTransactionSuccessAsync();
            await expect(tx).to.revertWith(
                new StakingRevertErrors.InsufficientBalanceError(amount, defaultSyncedBalance.nextEpochBalance),
            );
        });
    });

    describe('Load balance', () => {
        it('Balance does not change state if balance was previously synced in the current epoch', async () => {
            await testContract.setStoredBalance(defaultSyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const actualBalance = await testContract.loadCurrentBalance(INDEX_ZERO).callAsync();
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it('Balance updates current epoch fields if the balance has not yet been synced in the current epoch', async () => {
            await testContract.setStoredBalance(defaultUnsyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const actualBalance = await testContract.loadCurrentBalance(INDEX_ZERO).callAsync();
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it('Balance loads unsynced balance from storage without changing fields', async () => {
            await testContract.setStoredBalance(defaultUnsyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const actualBalance = await testContract.loadStaleBalance(INDEX_ZERO).callAsync();
            expect(actualBalance).to.deep.equal(defaultUnsyncedBalance);
        });
        it('Balance loads synced balance from storage without changing fields', async () => {
            await testContract.setStoredBalance(defaultSyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const actualBalance = await testContract.loadStaleBalance(INDEX_ZERO).callAsync();
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
    });

    describe('Increase/decrease balance', () => {
        it('_increaseCurrentAndNextBalance', async () => {
            await testContract.setStoredBalance(defaultUnsyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.increaseCurrentAndNextBalance(INDEX_ZERO, amount).awaitTransactionSuccessAsync();
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                currentEpochBalance: defaultSyncedBalance.currentEpochBalance.plus(amount),
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.plus(amount),
            });
        });
        it('_increaseCurrentAndNextBalance (previously uninitialized)', async () => {
            await testContract.setStoredBalance(defaultUninitializedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const amount = defaultSyncedBalance.currentEpochBalance;
            await testContract.increaseCurrentAndNextBalance(INDEX_ZERO, amount).awaitTransactionSuccessAsync();
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal(defaultSyncedBalance);
        });
        it('_decreaseCurrentAndNextBalance', async () => {
            await testContract.setStoredBalance(defaultUnsyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.decreaseCurrentAndNextBalance(INDEX_ZERO, amount).awaitTransactionSuccessAsync();
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                currentEpochBalance: defaultSyncedBalance.currentEpochBalance.minus(amount),
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.minus(amount),
            });
        });
        it('_increaseNextBalance', async () => {
            await testContract.setStoredBalance(defaultUnsyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.increaseNextBalance(INDEX_ZERO, amount).awaitTransactionSuccessAsync();
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.plus(amount),
            });
        });
        it('_increaseCurrentAndNextBalance (previously uninitialized)', async () => {
            await testContract.setStoredBalance(defaultUninitializedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const amount = defaultSyncedBalance.currentEpochBalance;
            await testContract.increaseNextBalance(INDEX_ZERO, amount).awaitTransactionSuccessAsync();
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                currentEpochBalance: new BigNumber(0),
            });
        });
        it('_decreaseNextBalance', async () => {
            await testContract.setStoredBalance(defaultUnsyncedBalance, INDEX_ZERO).awaitTransactionSuccessAsync();
            const amount = defaultUnsyncedBalance.currentEpochBalance.dividedToIntegerBy(2);
            await testContract.decreaseNextBalance(INDEX_ZERO, amount).awaitTransactionSuccessAsync();
            const actualBalance = await getTestBalancesAsync(INDEX_ZERO);
            expect(actualBalance).to.deep.equal({
                ...defaultSyncedBalance,
                nextEpochBalance: defaultSyncedBalance.nextEpochBalance.minus(amount),
            });
        });
    });
});
