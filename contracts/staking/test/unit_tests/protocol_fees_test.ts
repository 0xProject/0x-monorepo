import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    hexRandom,
    Numberish,
    randomAddress,
} from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { LogEntry } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    IStakingEventsEvents,
    IStakingEventsStakingPoolActivatedEventArgs,
    TestProtocolFeesContract,
    TestProtocolFeesERC20ProxyTransferFromEventArgs,
    TestProtocolFeesEvents,
} from '../../src';

import { getRandomInteger } from '../utils/number_utils';

blockchainTests('Protocol Fees unit tests', env => {
    let ownerAddress: string;
    let exchangeAddress: string;
    let notExchangeAddress: string;
    let testContract: TestProtocolFeesContract;
    let wethAssetData: string;
    let minimumStake: BigNumber;

    before(async () => {
        [ownerAddress, exchangeAddress, notExchangeAddress] = await env.web3Wrapper.getAvailableAddressesAsync();

        // Deploy the protocol fees contract.
        testContract = await TestProtocolFeesContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFees,
            env.provider,
            {
                ...env.txDefaults,
                from: ownerAddress,
            },
            artifacts,
            exchangeAddress,
        );

        wethAssetData = await testContract.getWethAssetData.callAsync();
        minimumStake = (await testContract.getParams.callAsync())[2];
    });

    interface CreateTestPoolOpts {
        poolId: string;
        operatorStake: Numberish;
        membersStake: Numberish;
        makers: string[];
    }

    async function createTestPoolAsync(opts?: Partial<CreateTestPoolOpts>): Promise<CreateTestPoolOpts> {
        const _opts = {
            poolId: hexRandom(),
            operatorStake: getRandomInteger(minimumStake, '100e18'),
            membersStake: getRandomInteger(minimumStake, '100e18'),
            makers: _.times(2, () => randomAddress()),
            ...opts,
        };
        await testContract.createTestPool.awaitTransactionSuccessAsync(
            _opts.poolId,
            new BigNumber(_opts.operatorStake),
            new BigNumber(_opts.membersStake),
            _opts.makers,
        );
        return _opts;
    }

    blockchainTests.resets('payProtocolFee()', () => {
        const DEFAULT_PROTOCOL_FEE_PAID = new BigNumber(150e3).times(1e9);
        const { ZERO_AMOUNT } = constants;
        const makerAddress = randomAddress();
        const payerAddress = randomAddress();

        describe('forbidden actions', () => {
            it('should revert if called by a non-exchange', async () => {
                const tx = testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: notExchangeAddress },
                );
                const expectedError = new StakingRevertErrors.OnlyCallableByExchangeError(notExchangeAddress);
                return expect(tx).to.revertWith(expectedError);
            });

            it('should revert if `protocolFeePaid` is zero with zero value sent', async () => {
                const tx = testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    ZERO_AMOUNT,
                    { from: exchangeAddress, value: ZERO_AMOUNT },
                );
                const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                    StakingRevertErrors.ProtocolFeePaymentErrorCodes.ZeroProtocolFeePaid,
                    ZERO_AMOUNT,
                    ZERO_AMOUNT,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('should revert if `protocolFeePaid` is zero with non-zero value sent', async () => {
                const tx = testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    ZERO_AMOUNT,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                    StakingRevertErrors.ProtocolFeePaymentErrorCodes.ZeroProtocolFeePaid,
                    ZERO_AMOUNT,
                    DEFAULT_PROTOCOL_FEE_PAID,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('should revert if `protocolFeePaid` is < than the provided message value', async () => {
                const tx = testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID.minus(1) },
                );
                const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                    StakingRevertErrors.ProtocolFeePaymentErrorCodes.MismatchedFeeAndPayment,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    DEFAULT_PROTOCOL_FEE_PAID.minus(1),
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('should revert if `protocolFeePaid` is > than the provided message value', async () => {
                const tx = testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID.plus(1) },
                );
                const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                    StakingRevertErrors.ProtocolFeePaymentErrorCodes.MismatchedFeeAndPayment,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    DEFAULT_PROTOCOL_FEE_PAID.plus(1),
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });

        async function getProtocolFeesAsync(poolId: string): Promise<BigNumber> {
            return (await testContract.getActiveStakingPoolThisEpoch.callAsync(poolId)).feesCollected;
        }

        describe('ETH fees', () => {
            function assertNoWETHTransferLogs(logs: LogEntry[]): void {
                const logsArgs = filterLogsToArguments<TestProtocolFeesERC20ProxyTransferFromEventArgs>(
                    logs,
                    TestProtocolFeesEvents.ERC20ProxyTransferFrom,
                );
                expect(logsArgs).to.deep.eq([]);
            }

            it('should not transfer WETH if value is sent', async () => {
                await createTestPoolAsync({ operatorStake: minimumStake });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                assertNoWETHTransferLogs(receipt.logs);
            });

            it('should credit pool if the maker is in a pool', async () => {
                const { poolId } = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                assertNoWETHTransferLogs(receipt.logs);
                const poolFees = await getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('should not credit the pool if maker is not in a pool', async () => {
                const { poolId } = await createTestPoolAsync({ operatorStake: minimumStake });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                assertNoWETHTransferLogs(receipt.logs);
                const poolFees = await getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(ZERO_AMOUNT);
            });

            it('fees paid to the same maker should go to the same pool', async () => {
                const { poolId } = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const payAsync = async () => {
                    const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                        makerAddress,
                        payerAddress,
                        DEFAULT_PROTOCOL_FEE_PAID,
                        { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                    );
                    assertNoWETHTransferLogs(receipt.logs);
                };
                await payAsync();
                await payAsync();
                const expectedTotalFees = DEFAULT_PROTOCOL_FEE_PAID.times(2);
                const poolFees = await getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(expectedTotalFees);
            });
        });

        describe('WETH fees', () => {
            function assertWETHTransferLogs(logs: LogEntry[], fromAddress: string, amount: BigNumber): void {
                const logsArgs = filterLogsToArguments<TestProtocolFeesERC20ProxyTransferFromEventArgs>(
                    logs,
                    TestProtocolFeesEvents.ERC20ProxyTransferFrom,
                );
                expect(logsArgs.length).to.eq(1);
                for (const args of logsArgs) {
                    expect(args.assetData).to.eq(wethAssetData);
                    expect(args.from).to.eq(fromAddress);
                    expect(args.to).to.eq(testContract.address);
                    expect(args.amount).to.bignumber.eq(amount);
                }
            }

            it('should transfer WETH if no value is sent and the maker is not in a pool', async () => {
                await createTestPoolAsync({ operatorStake: minimumStake });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: ZERO_AMOUNT },
                );
                assertWETHTransferLogs(receipt.logs, payerAddress, DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('should update `protocolFeesThisEpochByPool` if the maker is in a pool', async () => {
                const { poolId } = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: ZERO_AMOUNT },
                );
                assertWETHTransferLogs(receipt.logs, payerAddress, DEFAULT_PROTOCOL_FEE_PAID);
                const poolFees = await getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('should not update `protocolFeesThisEpochByPool` if maker is not in a pool', async () => {
                const { poolId } = await createTestPoolAsync({ operatorStake: minimumStake });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: ZERO_AMOUNT },
                );
                assertWETHTransferLogs(receipt.logs, payerAddress, DEFAULT_PROTOCOL_FEE_PAID);
                const poolFees = await getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(ZERO_AMOUNT);
            });

            it('fees paid to the same maker should go to the same pool', async () => {
                const { poolId } = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const payAsync = async () => {
                    const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                        makerAddress,
                        payerAddress,
                        DEFAULT_PROTOCOL_FEE_PAID,
                        { from: exchangeAddress, value: ZERO_AMOUNT },
                    );
                    assertWETHTransferLogs(receipt.logs, payerAddress, DEFAULT_PROTOCOL_FEE_PAID);
                };
                await payAsync();
                await payAsync();
                const expectedTotalFees = DEFAULT_PROTOCOL_FEE_PAID.times(2);
                const poolFees = await getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(expectedTotalFees);
            });

            it('fees paid to the same maker in WETH then ETH should go to the same pool', async () => {
                const { poolId } = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const payAsync = async (inWETH: boolean) => {
                    await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                        makerAddress,
                        payerAddress,
                        DEFAULT_PROTOCOL_FEE_PAID,
                        {
                            from: exchangeAddress,
                            value: inWETH ? ZERO_AMOUNT : DEFAULT_PROTOCOL_FEE_PAID,
                        },
                    );
                };
                await payAsync(true);
                await payAsync(false);
                const expectedTotalFees = DEFAULT_PROTOCOL_FEE_PAID.times(2);
                const poolFees = await getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(expectedTotalFees);
            });
        });

        describe('Dust stake', () => {
            it('credits pools with stake > minimum', async () => {
                const { poolId } = await createTestPoolAsync({
                    operatorStake: minimumStake.plus(1),
                    membersStake: 0,
                    makers: [makerAddress],
                });
                await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                const feesCredited = await getProtocolFeesAsync(poolId);
                expect(feesCredited).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('credits pools with stake == minimum', async () => {
                const { poolId } = await createTestPoolAsync({
                    operatorStake: minimumStake,
                    membersStake: 0,
                    makers: [makerAddress],
                });
                await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                const feesCredited = await getProtocolFeesAsync(poolId);
                expect(feesCredited).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('does not credit pools with stake < minimum', async () => {
                const { poolId } = await createTestPoolAsync({
                    operatorStake: minimumStake.minus(1),
                    membersStake: 0,
                    makers: [makerAddress],
                });
                await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                const feesCredited = await getProtocolFeesAsync(poolId);
                expect(feesCredited).to.bignumber.eq(0);
            });
        });

        blockchainTests.resets('Finalization', () => {
            let membersStakeWeight: number;

            before(async () => {
                membersStakeWeight = (await testContract.getParams.callAsync())[1];
            });

            interface FinalizationState {
                numActivePools: BigNumber;
                totalFeesCollected: BigNumber;
                totalWeightedStake: BigNumber;
            }

            async function getFinalizationStateAsync(): Promise<FinalizationState> {
                return {
                    numActivePools: await testContract.numActivePoolsThisEpoch.callAsync(),
                    totalFeesCollected: await testContract.totalFeesCollectedThisEpoch.callAsync(),
                    totalWeightedStake: await testContract.totalWeightedStakeThisEpoch.callAsync(),
                };
            }

            interface PayToMakerResult {
                poolActivatedEvents: IStakingEventsStakingPoolActivatedEventArgs[];
                fee: BigNumber;
            }

            async function payToMakerAsync(poolMaker: string, fee?: Numberish): Promise<PayToMakerResult> {
                const _fee = fee === undefined ? getRandomInteger(1, '1e18') : fee;
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    poolMaker,
                    payerAddress,
                    new BigNumber(_fee),
                    { from: exchangeAddress, value: _fee },
                );
                const events = filterLogsToArguments<IStakingEventsStakingPoolActivatedEventArgs>(
                    receipt.logs,
                    IStakingEventsEvents.StakingPoolActivated,
                );
                return {
                    fee: new BigNumber(_fee),
                    poolActivatedEvents: events,
                };
            }

            function toWeightedStake(operatorStake: Numberish, membersStake: Numberish): BigNumber {
                return new BigNumber(membersStake)
                    .times(membersStakeWeight)
                    .dividedToIntegerBy(constants.PPM_DENOMINATOR)
                    .plus(operatorStake);
            }

            it('no active pools to start', async () => {
                const state = await getFinalizationStateAsync();
                expect(state.numActivePools).to.bignumber.eq(0);
                expect(state.totalFeesCollected).to.bignumber.eq(0);
                expect(state.totalWeightedStake).to.bignumber.eq(0);
            });

            it('pool is not registered to start', async () => {
                const { poolId } = await createTestPoolAsync();
                const pool = await testContract.getActiveStakingPoolThisEpoch.callAsync(poolId);
                expect(pool.feesCollected).to.bignumber.eq(0);
                expect(pool.membersStake).to.bignumber.eq(0);
                expect(pool.weightedStake).to.bignumber.eq(0);
            });

            it('activates a active pool the first time it earns a fee', async () => {
                const pool = await createTestPoolAsync();
                const {
                    poolId,
                    makers: [poolMaker],
                } = pool;
                const { fee, poolActivatedEvents } = await payToMakerAsync(poolMaker);
                expect(poolActivatedEvents.length).to.eq(1);
                expect(poolActivatedEvents[0].poolId).to.eq(poolId);
                const actualPool = await testContract.getActiveStakingPoolThisEpoch.callAsync(poolId);
                const expectedWeightedStake = toWeightedStake(pool.operatorStake, pool.membersStake);
                expect(actualPool.feesCollected).to.bignumber.eq(fee);
                expect(actualPool.membersStake).to.bignumber.eq(pool.membersStake);
                expect(actualPool.weightedStake).to.bignumber.eq(expectedWeightedStake);
                const state = await getFinalizationStateAsync();
                expect(state.numActivePools).to.bignumber.eq(1);
                expect(state.totalFeesCollected).to.bignumber.eq(fee);
                expect(state.totalWeightedStake).to.bignumber.eq(expectedWeightedStake);
            });

            it('only adds to the already activated pool in the same epoch', async () => {
                const pool = await createTestPoolAsync();
                const {
                    poolId,
                    makers: [poolMaker],
                } = pool;
                const { fee: fee1 } = await payToMakerAsync(poolMaker);
                const { fee: fee2, poolActivatedEvents } = await payToMakerAsync(poolMaker);
                expect(poolActivatedEvents).to.deep.eq([]);
                const actualPool = await testContract.getActiveStakingPoolThisEpoch.callAsync(poolId);
                const expectedWeightedStake = toWeightedStake(pool.operatorStake, pool.membersStake);
                const fees = BigNumber.sum(fee1, fee2);
                expect(actualPool.feesCollected).to.bignumber.eq(fees);
                expect(actualPool.membersStake).to.bignumber.eq(pool.membersStake);
                expect(actualPool.weightedStake).to.bignumber.eq(expectedWeightedStake);
                const state = await getFinalizationStateAsync();
                expect(state.numActivePools).to.bignumber.eq(1);
                expect(state.totalFeesCollected).to.bignumber.eq(fees);
                expect(state.totalWeightedStake).to.bignumber.eq(expectedWeightedStake);
            });

            it('can activate multiple pools in the same epoch', async () => {
                const pools = await Promise.all(_.times(3, async () => createTestPoolAsync()));
                let totalFees = new BigNumber(0);
                let totalWeightedStake = new BigNumber(0);
                for (const pool of pools) {
                    const {
                        poolId,
                        makers: [poolMaker],
                    } = pool;
                    const { fee, poolActivatedEvents } = await payToMakerAsync(poolMaker);
                    expect(poolActivatedEvents.length).to.eq(1);
                    expect(poolActivatedEvents[0].poolId).to.eq(poolId);
                    const actualPool = await testContract.getActiveStakingPoolThisEpoch.callAsync(poolId);
                    const expectedWeightedStake = toWeightedStake(pool.operatorStake, pool.membersStake);
                    expect(actualPool.feesCollected).to.bignumber.eq(fee);
                    expect(actualPool.membersStake).to.bignumber.eq(pool.membersStake);
                    expect(actualPool.weightedStake).to.bignumber.eq(expectedWeightedStake);
                    totalFees = totalFees.plus(fee);
                    totalWeightedStake = totalWeightedStake.plus(expectedWeightedStake);
                }
                const state = await getFinalizationStateAsync();
                expect(state.numActivePools).to.bignumber.eq(pools.length);
                expect(state.totalFeesCollected).to.bignumber.eq(totalFees);
                expect(state.totalWeightedStake).to.bignumber.eq(totalWeightedStake);
            });

            it('resets the pool after the epoch advances', async () => {
                const pool = await createTestPoolAsync();
                const {
                    poolId,
                    makers: [poolMaker],
                } = pool;
                await payToMakerAsync(poolMaker);
                await testContract.advanceEpoch.awaitTransactionSuccessAsync();
                const actualPool = await testContract.getActiveStakingPoolThisEpoch.callAsync(poolId);
                expect(actualPool.feesCollected).to.bignumber.eq(0);
                expect(actualPool.membersStake).to.bignumber.eq(0);
                expect(actualPool.weightedStake).to.bignumber.eq(0);
            });

            describe('Multiple makers', () => {
                it('fees paid to different makers in the same pool go to that pool', async () => {
                    const { poolId, makers } = await createTestPoolAsync();
                    const { fee: fee1 } = await payToMakerAsync(makers[0]);
                    const { fee: fee2 } = await payToMakerAsync(makers[1]);
                    const expectedTotalFees = BigNumber.sum(fee1, fee2);
                    const poolFees = await getProtocolFeesAsync(poolId);
                    expect(poolFees).to.bignumber.eq(expectedTotalFees);
                });

                it('fees paid to makers in different pools go to their respective pools', async () => {
                    const {
                        poolId: poolId1,
                        makers: [maker1],
                    } = await createTestPoolAsync();
                    const {
                        poolId: poolId2,
                        makers: [maker2],
                    } = await createTestPoolAsync();
                    const { fee: fee1 } = await payToMakerAsync(maker1);
                    const { fee: fee2 } = await payToMakerAsync(maker2);
                    const [poolFees, otherPoolFees] = await Promise.all([
                        getProtocolFeesAsync(poolId1),
                        getProtocolFeesAsync(poolId2),
                    ]);
                    expect(poolFees).to.bignumber.eq(fee1);
                    expect(otherPoolFees).to.bignumber.eq(fee2);
                });
            });
        });
    });
});
// tslint:disable: max-file-line-count
