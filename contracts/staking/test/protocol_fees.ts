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
    TestProtocolFeesContract,
    TestProtocolFeesERC20ProxyContract,
    TestProtocolFeesERC20ProxyTransferFromCalledEventArgs,
} from '../src';

import { getRandomPortion } from './utils/number_utils';

blockchainTests('Protocol Fee Unit Tests', env => {
    let ownerAddress: string;
    let exchangeAddress: string;
    let notExchangeAddress: string;
    let testContract: TestProtocolFeesContract;
    let wethAssetData: string;

    before(async () => {
        [ownerAddress, exchangeAddress, notExchangeAddress] = await env.web3Wrapper.getAvailableAddressesAsync();

        // Deploy the erc20Proxy for testing.
        const proxy = await TestProtocolFeesERC20ProxyContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFeesERC20Proxy,
            env.provider,
            env.txDefaults,
            {},
        );

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
            proxy.address,
        );

        wethAssetData = await testContract.getWethAssetData.callAsync();
    });

    interface CreatePoolOpts {
        operatorStake: Numberish;
        membersStake: Numberish;
        makers: string[];
    }

    async function createTestPoolAsync(opts: Partial<CreatePoolOpts>): Promise<string> {
        const _opts = {
            operatorStake: 0,
            membersStake: 0,
            makers: [],
            ...opts,
        };
        const poolId = hexRandom();
        await testContract.createTestPool.awaitTransactionSuccessAsync(
            poolId,
            new BigNumber(_opts.operatorStake),
            new BigNumber(_opts.membersStake),
            _opts.makers,
        );
        return poolId;
    }

    blockchainTests.resets('payProtocolFee()', () => {
        const DEFAULT_PROTOCOL_FEE_PAID = new BigNumber(150e3).times(1e9);
        const { ZERO_AMOUNT } = constants;
        const makerAddress = randomAddress();
        const payerAddress = randomAddress();
        let minimumStake: BigNumber;

        before(async () => {
            minimumStake = (await testContract.getParams.callAsync())[2];
        });

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
            return testContract.getProtocolFeesThisEpochByPool.callAsync(poolId);
        }

        describe('ETH fees', () => {
            function assertNoWETHTransferLogs(logs: LogEntry[]): void {
                const logsArgs = filterLogsToArguments<TestProtocolFeesERC20ProxyTransferFromCalledEventArgs>(
                    logs,
                    'TransferFromCalled',
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
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                assertNoWETHTransferLogs(receipt.logs);
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('should not credit the pool if maker is not in a pool', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                assertNoWETHTransferLogs(receipt.logs);
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(ZERO_AMOUNT);
            });

            it('fees paid to the same maker should go to the same pool', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
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
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(expectedTotalFees);
            });
        });

        describe('WETH fees', () => {
            function assertWETHTransferLogs(logs: LogEntry[], fromAddress: string, amount: BigNumber): void {
                const logsArgs = filterLogsToArguments<TestProtocolFeesERC20ProxyTransferFromCalledEventArgs>(
                    logs,
                    'TransferFromCalled',
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
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: ZERO_AMOUNT },
                );
                assertWETHTransferLogs(receipt.logs, payerAddress, DEFAULT_PROTOCOL_FEE_PAID);
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('should not update `protocolFeesThisEpochByPool` if maker is not in a pool', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake });
                const receipt = await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    payerAddress,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: ZERO_AMOUNT },
                );
                assertWETHTransferLogs(receipt.logs, payerAddress, DEFAULT_PROTOCOL_FEE_PAID);
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(ZERO_AMOUNT);
            });

            it('fees paid to the same maker should go to the same pool', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
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
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(expectedTotalFees);
            });

            it('fees paid to the same maker in WETH then ETH should go to the same pool', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
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
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(expectedTotalFees);
            });
        });

        describe('Multiple makers', () => {
            it('fees paid to different makers in the same pool go to that pool', async () => {
                const otherMakerAddress = randomAddress();
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress, otherMakerAddress] });
                const payAsync = async (_makerAddress: string) => {
                    await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                        _makerAddress,
                        payerAddress,
                        DEFAULT_PROTOCOL_FEE_PAID,
                        { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                    );
                };
                await payAsync(makerAddress);
                await payAsync(otherMakerAddress);
                const expectedTotalFees = DEFAULT_PROTOCOL_FEE_PAID.times(2);
                const poolFees = getProtocolFeesAsync(poolId);
                expect(poolFees).to.bignumber.eq(expectedTotalFees);
            });

            it('fees paid to makers in different pools go to their respective pools', async () => {
                const [fee, otherFee] = _.times(2, () => getRandomPortion(DEFAULT_PROTOCOL_FEE_PAID));
                const otherMakerAddress = randomAddress();
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                const otherPoolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [otherMakerAddress]});
                const payAsync = async (_poolId: string, _makerAddress: string, _fee: BigNumber) => {
                    // prettier-ignore
                    await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                        _makerAddress,
                        payerAddress,
                        _fee,
                        { from: exchangeAddress, value: _fee },
                    );
                };
                await payAsync(poolId, makerAddress, fee);
                await payAsync(otherPoolId, otherMakerAddress, otherFee);
                const [poolFees, otherPoolFees] = await Promise.all([
                    getProtocolFeesAsync(poolId),
                    getProtocolFeesAsync(otherPoolId),
                ]);
                expect(poolFees).to.bignumber.eq(fee);
                expect(otherPoolFees).to.bignumber.eq(otherFee);
            });
        });

        describe('Dust stake', () => {
            it('credits pools with stake > minimum', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake.plus(1), makers: [makerAddress] });
                await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                const feesCredited = getProtocolFeesAsync(poolId);
                expect(feesCredited).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('credits pools with stake == minimum', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake, makers: [makerAddress] });
                await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                const feesCredited = getProtocolFeesAsync(poolId);
                expect(feesCredited).to.bignumber.eq(DEFAULT_PROTOCOL_FEE_PAID);
            });

            it('does not credit pools with stake < minimum', async () => {
                const poolId = await createTestPoolAsync({ operatorStake: minimumStake.minus(1), makers: [makerAddress] });
                await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                    DEFAULT_PROTOCOL_FEE_PAID,
                    { from: exchangeAddress, value: DEFAULT_PROTOCOL_FEE_PAID },
                );
                const feesCredited = getProtocolFeesAsync(poolId);
                expect(feesCredited).to.bignumber.eq(0);
            });
        });
    });
});
