import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    hexLeftPad,
    hexRandom,
    toHex,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { SafeMathRevertErrors } from '@0x/contracts-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakingRevertErrors } from '../../src';

import { artifacts } from '../artifacts';
import {
    TestMixinStakingPoolContract,
    TestMixinStakingPoolEvents,
    TestMixinStakingPoolStakingPoolCreatedEventArgs as StakingPoolCreated,
} from '../wrappers';

blockchainTests.resets('MixinStakingPool unit tests', env => {
    let testContract: TestMixinStakingPoolContract;
    let operator: string;
    let maker: string;
    let notOperatorOrMaker: string;

    before(async () => {
        [operator, maker, notOperatorOrMaker] = await env.getAccountAddressesAsync();
        testContract = await TestMixinStakingPoolContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinStakingPool,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    function toNextPoolId(lastPoolId: string): string {
        return hexLeftPad(new BigNumber(lastPoolId.slice(2), 16).plus(1));
    }

    function randomOperatorShare(): number {
        return _.random(0, constants.PPM_100_PERCENT);
    }

    interface CreatePoolOpts {
        poolId: string;
        operator: string;
        operatorShare: number;
    }

    async function createPoolAsync(opts?: Partial<CreatePoolOpts>): Promise<CreatePoolOpts> {
        const _opts = {
            poolId: hexRandom(),
            operator,
            operatorShare: randomOperatorShare(),
            ...opts,
        };
        await testContract.setPoolById.awaitTransactionSuccessAsync(_opts.poolId, {
            operator: _opts.operator,
            operatorShare: _opts.operatorShare,
        });
        return _opts;
    }

    async function addMakerToPoolAsync(poolId: string, _maker: string): Promise<void> {
        await testContract.setPoolIdByMaker.awaitTransactionSuccessAsync(poolId, _maker);
    }

    describe('onlyStakingPoolOperator modifier', () => {
        it('fails if not called by the pool operator', async () => {
            const { poolId } = await createPoolAsync();
            const tx = testContract.testOnlyStakingPoolOperatorModifier.callAsync(poolId, { from: notOperatorOrMaker });
            const expectedError = new StakingRevertErrors.OnlyCallableByPoolOperatorError(notOperatorOrMaker, poolId);
            return expect(tx).to.revertWith(expectedError);
        });
        it('fails if called by a pool maker', async () => {
            const { poolId } = await createPoolAsync();
            await addMakerToPoolAsync(poolId, maker);
            const tx = testContract.testOnlyStakingPoolOperatorModifier.callAsync(poolId, { from: maker });
            const expectedError = new StakingRevertErrors.OnlyCallableByPoolOperatorError(maker, poolId);
            return expect(tx).to.revertWith(expectedError);
        });
        it('succeeds if called by the pool operator', async () => {
            const { poolId } = await createPoolAsync();
            await testContract.testOnlyStakingPoolOperatorModifier.callAsync(poolId, { from: operator });
        });
    });

    describe('createStakingPool()', () => {
        let nextPoolId: string;

        before(async () => {
            nextPoolId = toNextPoolId(await testContract.lastPoolId.callAsync());
        });

        it('fails if the next pool ID overflows', async () => {
            await testContract.setLastPoolId.awaitTransactionSuccessAsync(toHex(constants.MAX_UINT256));
            const tx = testContract.createStakingPool.awaitTransactionSuccessAsync(randomOperatorShare(), false);
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                constants.MAX_UINT256,
                new BigNumber(1),
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('fails if the operator share is invalid', async () => {
            const operatorShare = constants.PPM_100_PERCENT + 1;
            const tx = testContract.createStakingPool.awaitTransactionSuccessAsync(operatorShare, false);
            const expectedError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.OperatorShareTooLarge,
                nextPoolId,
                operatorShare,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('operator can create and own multiple pools', async () => {
            const { logs: logs1 } = await testContract.createStakingPool.awaitTransactionSuccessAsync(
                randomOperatorShare(),
                false,
            );
            const { logs: logs2 } = await testContract.createStakingPool.awaitTransactionSuccessAsync(
                randomOperatorShare(),
                false,
            );
            const createEvents = filterLogsToArguments<StakingPoolCreated>(
                [...logs1, ...logs2],
                TestMixinStakingPoolEvents.StakingPoolCreated,
            );
            expect(createEvents).to.be.length(2);
            const poolIds = createEvents.map(e => e.poolId);
            expect(poolIds[0]).to.not.eq(poolIds[1]);
            const pools = await Promise.all(poolIds.map(async poolId => testContract.getStakingPool.callAsync(poolId)));
            expect(pools[0].operator).to.eq(pools[1].operator);
        });
        it('operator can only be maker of one pool', async () => {
            await testContract.createStakingPool.awaitTransactionSuccessAsync(randomOperatorShare(), true);
            const { logs } = await testContract.createStakingPool.awaitTransactionSuccessAsync(
                randomOperatorShare(),
                true,
            );
            const createEvents = filterLogsToArguments<StakingPoolCreated>(
                logs,
                TestMixinStakingPoolEvents.StakingPoolCreated,
            );
            const makerPool = await testContract.poolIdByMaker.callAsync(operator);
            expect(makerPool).to.eq(createEvents[0].poolId);
        });
        it('computes correct next pool ID', async () => {
            const { logs } = await testContract.createStakingPool.awaitTransactionSuccessAsync(
                randomOperatorShare(),
                false,
            );
            const createEvents = filterLogsToArguments<StakingPoolCreated>(
                logs,
                TestMixinStakingPoolEvents.StakingPoolCreated,
            );
            const poolId = createEvents[0].poolId;
            expect(poolId).to.eq(nextPoolId);
        });
        it('increments last pool ID counter', async () => {
            await testContract.createStakingPool.awaitTransactionSuccessAsync(randomOperatorShare(), false);
            const lastPoolIdAfter = await testContract.lastPoolId.callAsync();
            expect(lastPoolIdAfter).to.eq(nextPoolId);
        });
        it('records pool details', async () => {
            const operatorShare = randomOperatorShare();
            await testContract.createStakingPool.awaitTransactionSuccessAsync(operatorShare, false, { from: operator });
            const pool = await testContract.getStakingPool.callAsync(nextPoolId);
            expect(pool.operator).to.eq(operator);
            expect(pool.operatorShare).to.bignumber.eq(operatorShare);
        });
        it('returns the next pool ID', async () => {
            const poolId = await testContract.createStakingPool.callAsync(randomOperatorShare(), false, {
                from: operator,
            });
            expect(poolId).to.eq(nextPoolId);
        });
        it('can add operator as a maker', async () => {
            const operatorShare = randomOperatorShare();
            await testContract.createStakingPool.awaitTransactionSuccessAsync(operatorShare, true, { from: operator });
            const makerPoolId = await testContract.poolIdByMaker.callAsync(operator);
            expect(makerPoolId).to.eq(nextPoolId);
        });
        it('emits a `StakingPoolCreated` event', async () => {
            const operatorShare = randomOperatorShare();
            const { logs } = await testContract.createStakingPool.awaitTransactionSuccessAsync(operatorShare, false, {
                from: operator,
            });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        poolId: nextPoolId,
                        operator,
                        operatorShare,
                    },
                ],
                TestMixinStakingPoolEvents.StakingPoolCreated,
            );
        });
        it('emits a `MakerStakingPoolSet` event when also joining as a maker', async () => {
            const operatorShare = randomOperatorShare();
            const { logs } = await testContract.createStakingPool.awaitTransactionSuccessAsync(operatorShare, true, {
                from: operator,
            });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        makerAddress: operator,
                        poolId: nextPoolId,
                    },
                ],
                TestMixinStakingPoolEvents.MakerStakingPoolSet,
            );
        });
    });

    describe('decreaseStakingPoolOperatorShare()', () => {
        it('fails if not called by operator', async () => {
            const { poolId, operatorShare } = await createPoolAsync();
            const tx = testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                operatorShare - 1,
                { from: notOperatorOrMaker },
            );
            const expectedError = new StakingRevertErrors.OnlyCallableByPoolOperatorError(notOperatorOrMaker, poolId);
            return expect(tx).to.revertWith(expectedError);
        });
        it('fails if called by maker', async () => {
            const { poolId, operatorShare } = await createPoolAsync();
            await addMakerToPoolAsync(poolId, maker);
            const tx = testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                operatorShare - 1,
                { from: maker },
            );
            const expectedError = new StakingRevertErrors.OnlyCallableByPoolOperatorError(maker, poolId);
            return expect(tx).to.revertWith(expectedError);
        });
        it('fails if operator share is equal to current', async () => {
            const { poolId, operatorShare } = await createPoolAsync();
            const tx = testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                operatorShare,
                { from: operator },
            );
            const expectedError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.CanOnlyDecreaseOperatorShare,
                poolId,
                operatorShare,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('fails if operator share is greater than current', async () => {
            const { poolId, operatorShare } = await createPoolAsync();
            const tx = testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                operatorShare + 1,
                { from: operator },
            );
            const expectedError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.CanOnlyDecreaseOperatorShare,
                poolId,
                operatorShare + 1,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('fails if operator share is greater than PPM_100_PERCENT', async () => {
            const { poolId } = await createPoolAsync();
            const tx = testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                constants.PPM_100_PERCENT + 1,
                { from: operator },
            );
            const expectedError = new StakingRevertErrors.OperatorShareError(
                StakingRevertErrors.OperatorShareErrorCodes.OperatorShareTooLarge,
                poolId,
                constants.PPM_100_PERCENT + 1,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('records new operator share', async () => {
            const { poolId, operatorShare } = await createPoolAsync();
            await testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                operatorShare - 1,
                { from: operator },
            );
            const pool = await testContract.getStakingPool.callAsync(poolId);
            expect(pool.operatorShare).to.bignumber.eq(operatorShare - 1);
        });
        it('does not modify operator', async () => {
            const { poolId, operatorShare } = await createPoolAsync();
            await testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                operatorShare - 1,
                { from: operator },
            );
            const pool = await testContract.getStakingPool.callAsync(poolId);
            expect(pool.operator).to.eq(operator);
        });
        it('emits an `OperatorShareDecreased` event', async () => {
            const { poolId, operatorShare } = await createPoolAsync();
            const { logs } = await testContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                operatorShare - 1,
                { from: operator },
            );
            verifyEventsFromLogs(
                logs,
                [
                    {
                        poolId,
                        oldOperatorShare: operatorShare,
                        newOperatorShare: operatorShare - 1,
                    },
                ],
                TestMixinStakingPoolEvents.OperatorShareDecreased,
            );
        });
    });

    describe('joinStakingPoolAsMaker()', () => {
        it('records sender as maker for the pool', async () => {
            const { poolId } = await createPoolAsync();
            await testContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId, { from: maker });
            const makerPoolId = await testContract.poolIdByMaker.callAsync(maker);
            expect(makerPoolId).to.eq(poolId);
        });
        it('operator can join as maker for the pool', async () => {
            const { poolId } = await createPoolAsync();
            await testContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId, { from: operator });
            const makerPoolId = await testContract.poolIdByMaker.callAsync(operator);
            expect(makerPoolId).to.eq(poolId);
        });
        it('can join the same pool as a maker twice', async () => {
            const { poolId } = await createPoolAsync();
            await testContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId, { from: maker });
            await testContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId, { from: maker });
            const makerPoolId = await testContract.poolIdByMaker.callAsync(maker);
            expect(makerPoolId).to.eq(poolId);
        });
        it('can only be a maker in one pool at a time', async () => {
            const { poolId: poolId1 } = await createPoolAsync();
            const { poolId: poolId2 } = await createPoolAsync();
            await testContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId1, { from: maker });
            let makerPoolId = await testContract.poolIdByMaker.callAsync(maker);
            expect(makerPoolId).to.eq(poolId1);
            await testContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId2, { from: maker });
            makerPoolId = await testContract.poolIdByMaker.callAsync(maker);
            expect(makerPoolId).to.eq(poolId2);
        });
        it('emits a `MakerStakingPoolSet` event', async () => {
            const { poolId } = await createPoolAsync();
            const { logs } = await testContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId, {
                from: maker,
            });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        makerAddress: maker,
                        poolId,
                    },
                ],
                TestMixinStakingPoolEvents.MakerStakingPoolSet,
            );
        });
    });
});
// tslint:disable: max-file-line-count
