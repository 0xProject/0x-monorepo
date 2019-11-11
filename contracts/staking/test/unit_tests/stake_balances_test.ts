import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    hexRandom,
    randomAddress,
} from '@0x/contracts-test-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';

import { artifacts } from '../artifacts';
import { TestMixinStakeBalancesContract } from '../wrappers';

import { constants as stakingConstants } from '.../src/constants';
import { StakeStatus, StoredBalance } from '../../src/types';

blockchainTests.resets('MixinStakeBalances unit tests', env => {
    let testContract: TestMixinStakeBalancesContract;
    const { INITIAL_EPOCH } = stakingConstants;
    const CURRENT_EPOCH = INITIAL_EPOCH.plus(1);
    const EMPTY_BALANCE = {
        currentEpochBalance: constants.ZERO_AMOUNT,
        nextEpochBalance: constants.ZERO_AMOUNT,
        currentEpoch: new BigNumber(1),
    };

    before(async () => {
        testContract = await TestMixinStakeBalancesContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinStakeBalances,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    function randomAmount(): BigNumber {
        return getRandomInteger(1, 100e18);
    }

    function randomStoredBalance(): StoredBalance {
        return {
            currentEpochBalance: randomAmount(),
            nextEpochBalance: randomAmount(),
            currentEpoch: INITIAL_EPOCH,
        };
    }

    // Mirrors the behavior of the `_loadCurrentBalance()` override in
    // `TestMixinStakeBalances`.
    function toCurrentBalance(balance: StoredBalance): StoredBalance {
        return {
            ...balance,
            currentEpoch: balance.currentEpoch.plus(1),
        };
    }

    describe('getGlobalStakeByStatus()', () => {
        const delegatedBalance = randomStoredBalance();
        const zrxVaultBalance = randomAmount().plus(
            BigNumber.max(delegatedBalance.currentEpochBalance, delegatedBalance.nextEpochBalance),
        );

        before(async () => {
            await testContract.setGlobalStakeByStatus.awaitTransactionSuccessAsync(
                StakeStatus.Delegated,
                delegatedBalance,
            );
            await testContract.setBalanceOfZrxVault.awaitTransactionSuccessAsync(zrxVaultBalance);
        });

        it('undelegated stake is the difference between zrx vault balance and global delegated stake', async () => {
            const expectedBalance = {
                currentEpoch: CURRENT_EPOCH,
                currentEpochBalance: zrxVaultBalance.minus(delegatedBalance.currentEpochBalance),
                nextEpochBalance: zrxVaultBalance.minus(delegatedBalance.nextEpochBalance),
            };
            const actualBalance = await testContract.getGlobalStakeByStatus.callAsync(StakeStatus.Undelegated);
            expect(actualBalance).to.deep.eq(expectedBalance);
        });

        it('delegated stake is the global delegated stake', async () => {
            const actualBalance = await testContract.getGlobalStakeByStatus.callAsync(StakeStatus.Delegated);
            expect(actualBalance).to.deep.eq(toCurrentBalance(delegatedBalance));
        });

        it('undelegated stake throws if the zrx vault balance is below the delegated stake balance', async () => {
            const _zrxVaultBalance = BigNumber.min(
                delegatedBalance.currentEpochBalance,
                delegatedBalance.nextEpochBalance,
            ).minus(1);
            await testContract.setBalanceOfZrxVault.awaitTransactionSuccessAsync(_zrxVaultBalance);
            const tx = testContract.getGlobalStakeByStatus.callAsync(StakeStatus.Undelegated);
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                _zrxVaultBalance,
                delegatedBalance.currentEpochBalance.gt(_zrxVaultBalance)
                    ? delegatedBalance.currentEpochBalance
                    : delegatedBalance.nextEpochBalance,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if unknown stake status is passed in', async () => {
            const tx = testContract.getGlobalStakeByStatus.callAsync(2);
            return expect(tx).to.be.rejected();
        });
    });

    describe('getOwnerStakeByStatus()', () => {
        const staker = randomAddress();
        const notStaker = randomAddress();
        const delegatedStake = randomStoredBalance();
        const undelegatedStake = randomStoredBalance();

        before(async () => {
            await testContract.setOwnerStakeByStatus.awaitTransactionSuccessAsync(
                staker,
                StakeStatus.Delegated,
                delegatedStake,
            );
            await testContract.setOwnerStakeByStatus.awaitTransactionSuccessAsync(
                staker,
                StakeStatus.Undelegated,
                undelegatedStake,
            );
        });

        it('throws if unknown stake status is passed in', async () => {
            const tx = testContract.getOwnerStakeByStatus.callAsync(staker, 2);
            return expect(tx).to.be.rejected();
        });

        it('returns empty delegated stake for an unstaked owner', async () => {
            const balance = await testContract.getOwnerStakeByStatus.callAsync(notStaker, StakeStatus.Delegated);
            expect(balance).to.deep.eq(EMPTY_BALANCE);
        });

        it('returns empty undelegated stake for an unstaked owner', async () => {
            const balance = await testContract.getOwnerStakeByStatus.callAsync(notStaker, StakeStatus.Undelegated);
            expect(balance).to.deep.eq(EMPTY_BALANCE);
        });

        it('returns undelegated stake for a staked owner', async () => {
            const balance = await testContract.getOwnerStakeByStatus.callAsync(staker, StakeStatus.Undelegated);
            expect(balance).to.deep.eq(toCurrentBalance(undelegatedStake));
        });

        it('returns delegated stake for a staked owner', async () => {
            const balance = await testContract.getOwnerStakeByStatus.callAsync(staker, StakeStatus.Delegated);
            expect(balance).to.deep.eq(toCurrentBalance(delegatedStake));
        });
    });

    describe('getTotalStake()', () => {
        const staker = randomAddress();
        const notStaker = randomAddress();
        const stakerAmount = randomAmount();

        before(async () => {
            await testContract.setZrxBalanceOf.awaitTransactionSuccessAsync(staker, stakerAmount);
        });

        it('returns empty for unstaked owner', async () => {
            const amount = await testContract.getTotalStake.callAsync(notStaker);
            expect(amount).to.bignumber.eq(0);
        });

        it('returns stake for staked owner', async () => {
            const amount = await testContract.getTotalStake.callAsync(staker);
            expect(amount).to.bignumber.eq(stakerAmount);
        });
    });

    describe('getStakeDelegatedToPoolByOwner()', () => {
        const staker = randomAddress();
        const notStaker = randomAddress();
        const poolId = hexRandom();
        const notPoolId = hexRandom();
        const delegatedBalance = randomStoredBalance();

        before(async () => {
            await testContract.setDelegatedStakeToPoolByOwner.awaitTransactionSuccessAsync(
                staker,
                poolId,
                delegatedBalance,
            );
        });

        it('returns empty for unstaked owner', async () => {
            const balance = await testContract.getStakeDelegatedToPoolByOwner.callAsync(notStaker, poolId);
            expect(balance).to.deep.eq(EMPTY_BALANCE);
        });

        it('returns empty for empty pool', async () => {
            const balance = await testContract.getStakeDelegatedToPoolByOwner.callAsync(staker, notPoolId);
            expect(balance).to.deep.eq(EMPTY_BALANCE);
        });

        it('returns stake for staked owner in their pool', async () => {
            const balance = await testContract.getStakeDelegatedToPoolByOwner.callAsync(staker, poolId);
            expect(balance).to.deep.eq(toCurrentBalance(delegatedBalance));
        });
    });

    describe('getTotalStakeDelegatedToPool()', () => {
        const poolId = hexRandom();
        const notPoolId = hexRandom();
        const delegatedBalance = randomStoredBalance();

        before(async () => {
            await testContract.setDelegatedStakeByPoolId.awaitTransactionSuccessAsync(poolId, delegatedBalance);
        });

        it('returns empty for empty pool', async () => {
            const balance = await testContract.getTotalStakeDelegatedToPool.callAsync(notPoolId);
            expect(balance).to.deep.eq(EMPTY_BALANCE);
        });

        it('returns stake for staked pool', async () => {
            const balance = await testContract.getTotalStakeDelegatedToPool.callAsync(poolId);
            expect(balance).to.deep.eq(toCurrentBalance(delegatedBalance));
        });
    });
});
// tslint:disable: max-file-line-count
