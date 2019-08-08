import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    blockchainTests,
    constants,
    describe,
    expect,
    hexRandom,
    LogDecoder,
    OrderFactory,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { ExchangeRevertErrors, LibMathRevertErrors, orderHashUtils } from '@0x/order-utils';
import { FillResults, MatchedFillResults, OrderWithoutDomain as Order, SignedOrder } from '@0x/types';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    ReferenceFunctions,
    TestExchangeInternalsContract,
    TestExchangeInternalsDispatchTransferFromCalledEventArgs,
    TestExchangeInternalsFillEventArgs,
} from '../src';

blockchainTests('Exchange core internal functions', env => {
    const CHAIN_ID = 1337;
    const ONE_ETHER = constants.ONE_ETHER;
    const EMPTY_ORDER: Order = {
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: constants.NULL_ADDRESS,
        takerAddress: constants.NULL_ADDRESS,
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: constants.ZERO_AMOUNT,
        makerAssetData: constants.NULL_BYTES,
        takerAssetData: constants.NULL_BYTES,
        makerFeeAssetData: constants.NULL_BYTES,
        takerFeeAssetData: constants.NULL_BYTES,
        salt: constants.ZERO_AMOUNT,
        feeRecipientAddress: constants.NULL_ADDRESS,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
    };
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);
    const randomAssetData = () => hexRandom(36);
    let testExchange: TestExchangeInternalsContract;
    let logDecoder: LogDecoder;
    let senderAddress: string;
    let makerAddressLeft: string;
    let makerAddressRight: string;
    let orderFactoryLeft: OrderFactory;
    let orderFactoryRight: OrderFactory;

    before(async () => {
        const accounts = await env.getAccountAddressesAsync();
        senderAddress = accounts[0];
        makerAddressLeft = accounts[1];
        makerAddressRight = accounts[2];

        testExchange = await TestExchangeInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeInternals,
            env.provider,
            env.txDefaults,
            new BigNumber(CHAIN_ID),
        );
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);

        const domain = {
            verifyingContractAddress: testExchange.address,
            chainId: 1337, // The chain id for the isolated exchange
        };

        const leftMakerAssetData = randomAssetData();
        const leftTakerAssetData = randomAssetData();

        // Create default order parameters
        const defaultOrderParamsLeft = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressLeft,
            makerAssetData: leftMakerAssetData,
            takerAssetData: leftTakerAssetData,
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            feeRecipientAddress: randomAddress(),
            domain,
        };
        const defaultOrderParamsRight = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressRight,
            makerAssetData: leftTakerAssetData,
            takerAssetData: leftMakerAssetData,
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            feeRecipientAddress: randomAddress(),
            domain,
        };
        const privateKeyLeft = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressLeft)];
        orderFactoryLeft = new OrderFactory(privateKeyLeft, defaultOrderParamsLeft);
        const privateKeyRight = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressRight)];
        orderFactoryRight = new OrderFactory(privateKeyRight, defaultOrderParamsRight);
    });

    blockchainTests('assertValidMatch', () => {
        it('should revert if the prices of the left order is less than the price of the right order', async () => {
            const leftOrder = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const orderHashHexLeft = orderHashUtils.getOrderHashHex(leftOrder);
            const orderHashHexRight = orderHashUtils.getOrderHashHex(rightOrder);
            const expectedError = new ExchangeRevertErrors.NegativeSpreadError(orderHashHexLeft, orderHashHexRight);
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.revertWith(expectedError);
        });

        it('should succeed if the prices of the left and right orders are equal', async () => {
            const leftOrder = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.be.fulfilled('');
        });

        it('should succeed if the price of the left order is higher than the price of the right', async () => {
            const leftOrder = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.be.fulfilled('');
        });
    });

    blockchainTests('calculateCompleteFillBoth', () => {
        /**
         * Asserts that the actual result of calling `calculateCompleteFillBoth()` is as expected.
         */
        async function assertCalculateCompleteFillBothAsync(
            expectedMatchedFillResults: MatchedFillResults,
            leftMakerAssetAmountRemaining: BigNumber,
            leftTakerAssetAmountRemaining: BigNumber,
            rightMakerAssetAmountRemaining: BigNumber,
            rightTakerAssetAmountRemaining: BigNumber,
        ): Promise<void> {
            const actualMatchedFillResults = await testExchange.calculateCompleteFillBoth.callAsync(
                leftMakerAssetAmountRemaining,
                leftTakerAssetAmountRemaining,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining,
            );
            expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
        }

        it('should assign everything to zero if all inputs are zero', async () => {
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: constants.ZERO_AMOUNT,
                    takerAssetFilledAmount: constants.ZERO_AMOUNT,
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: constants.ZERO_AMOUNT,
                    takerAssetFilledAmount: constants.ZERO_AMOUNT,
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteFillBothAsync(
                expectedMatchedFillResults,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        // Note: This call would never be able to be made through our contracts, since these orders will not actually be
        // fully filled. This is just a test case to make sure.
        it('should correctly update the fillResults with nonzero input', async () => {
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(17, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(98, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteFillBothAsync(
                expectedMatchedFillResults,
                new BigNumber(17),
                new BigNumber(98),
                new BigNumber(75),
                new BigNumber(13),
            );
        });

        it('should correctly update the fillResults with nonzero input', async () => {
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteFillBothAsync(
                expectedMatchedFillResults,
                new BigNumber(5),
                new BigNumber(10),
                new BigNumber(10),
                new BigNumber(5),
            );
        });

        it('should correctly update the fillResults with nonzero input', async () => {
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteFillBothAsync(
                expectedMatchedFillResults,
                Web3Wrapper.toBaseUnitAmount(5, 18),
                Web3Wrapper.toBaseUnitAmount(10, 18),
                Web3Wrapper.toBaseUnitAmount(10, 18),
                Web3Wrapper.toBaseUnitAmount(5, 18),
            );
        });

        it('should correctly update the fillResults with nonzero input', async () => {
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteFillBothAsync(
                expectedMatchedFillResults,
                Web3Wrapper.toBaseUnitAmount(5, 18),
                Web3Wrapper.toBaseUnitAmount(10, 18),
                Web3Wrapper.toBaseUnitAmount(10, 18),
                Web3Wrapper.toBaseUnitAmount(2, 18),
            );
        });
    });

    blockchainTests('calculateCompleteRightFill', () => {
        /**
         * Asserts that the results of calling `calculateCompleteRightFill()` are consistent with the expected results.
         */
        async function assertCalculateCompleteRightFillAsync(
            expectedMatchedFillResults: MatchedFillResults,
            leftOrder: SignedOrder,
            rightMakerAssetAmountRemaining: BigNumber,
            rightTakerAssetAmountRemaining: BigNumber,
        ): Promise<void> {
            const actualMatchedFillResults = await testExchange.calculateCompleteRightFill.callAsync(
                leftOrder,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining,
            );
            expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
        }

        it('should correctly calculate the complete right fill', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(98, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteRightFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                Web3Wrapper.toBaseUnitAmount(75, 0),
                Web3Wrapper.toBaseUnitAmount(13, 0),
            );
        });

        it('should correctly calculate the complete right fill', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteRightFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                Web3Wrapper.toBaseUnitAmount(89, 0),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should correctly calculate the complete right fill', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateCompleteRightFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                Web3Wrapper.toBaseUnitAmount(10, 18),
                Web3Wrapper.toBaseUnitAmount(2, 18),
            );
        });
    });

    blockchainTests('calculateFillResults', () => {
        describe.optional('combinatorial tests', () => {
            function makeOrder(
                makerAssetAmount: BigNumber,
                takerAssetAmount: BigNumber,
                makerFee: BigNumber,
                takerFee: BigNumber,
            ): Order {
                return {
                    ...EMPTY_ORDER,
                    makerAssetAmount,
                    takerAssetAmount,
                    makerFee,
                    takerFee,
                };
            }

            async function referenceCalculateFillResultsAsync(
                orderTakerAssetAmount: BigNumber,
                takerAssetFilledAmount: BigNumber,
                otherAmount: BigNumber,
            ): Promise<FillResults> {
                // Note(albrow): Here we are re-using the same value (otherAmount)
                // for order.makerAssetAmount, order.makerFee, and order.takerFee.
                // This should be safe because they are never used with each other
                // in any mathematical operation in either the reference TypeScript
                // implementation or the Solidity implementation of
                // calculateFillResults.
                return ReferenceFunctions.calculateFillResults(
                    makeOrder(otherAmount, orderTakerAssetAmount, otherAmount, otherAmount),
                    takerAssetFilledAmount,
                );
            }

            async function testCalculateFillResultsAsync(
                orderTakerAssetAmount: BigNumber,
                takerAssetFilledAmount: BigNumber,
                otherAmount: BigNumber,
            ): Promise<FillResults> {
                const order = makeOrder(otherAmount, orderTakerAssetAmount, otherAmount, otherAmount);
                return testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount);
            }

            testCombinatoriallyWithReferenceFunc(
                'calculateFillResults',
                referenceCalculateFillResultsAsync,
                testCalculateFillResultsAsync,
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            const MAX_UINT256_ROOT = constants.MAX_UINT256_ROOT;
            function makeOrder(details?: Partial<Order>): Order {
                return _.assign({}, EMPTY_ORDER, details);
            }

            it('matches the output of the reference function', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER.times(2),
                    makerFee: ONE_ETHER.times(0.0023),
                    takerFee: ONE_ETHER.times(0.0025),
                });
                const takerAssetFilledAmount = ONE_ETHER.dividedToIntegerBy(3);
                const expected = ReferenceFunctions.calculateFillResults(order, takerAssetFilledAmount);
                const actual = await testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount);
                expect(actual).to.deep.eq(expected);
            });

            it('reverts if computing `fillResults.makerAssetFilledAmount` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT.times(2),
                    takerAssetAmount: MAX_UINT256_ROOT,
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    takerAssetFilledAmount,
                    order.makerAssetAmount,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if computing `fillResults.makerFeePaid` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT,
                    takerAssetAmount: MAX_UINT256_ROOT,
                    makerFee: MAX_UINT256_ROOT.times(11),
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
                const makerAssetFilledAmount = LibReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    makerAssetFilledAmount,
                    order.makerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if computing `fillResults.takerFeePaid` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT,
                    takerAssetAmount: MAX_UINT256_ROOT,
                    takerFee: MAX_UINT256_ROOT.times(11),
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    takerAssetFilledAmount,
                    order.takerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if `order.makerAssetAmount` is 0', async () => {
                const order = makeOrder({
                    makerAssetAmount: constants.ZERO_AMOUNT,
                    takerAssetAmount: ONE_ETHER,
                });
                const takerAssetFilledAmount = ONE_ETHER;
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if `order.takerAssetAmount` is 0', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: constants.ZERO_AMOUNT,
                });
                const takerAssetFilledAmount = ONE_ETHER;
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if there is a rounding error computing `makerAsssetFilledAmount`', async () => {
                const order = makeOrder({
                    makerAssetAmount: new BigNumber(100),
                    takerAssetAmount: ONE_ETHER,
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const expectedError = new LibMathRevertErrors.RoundingError(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if there is a rounding error computing `makerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    makerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = LibReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.makerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if there is a rounding error computing `takerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    takerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = LibReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.takerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });
        });
    });

    blockchainTests('calculateMatchedFillResults', async () => {
        /**
         * Asserts that the results of calling `calculateMatchedFillResults()` is consistent with the results that are expected.
         */
        async function assertCalculateMatchedFillResultsAsync(
            expectedMatchedFillResults: MatchedFillResults,
            leftOrder: SignedOrder,
            rightOrder: SignedOrder,
            leftOrderTakerAssetFilledAmount: BigNumber,
            rightOrderTakerAssetFilledAmount: BigNumber,
            from?: string,
        ): Promise<void> {
            const actualMatchedFillResults = await testExchange.calculateMatchedFillResults.callAsync(
                leftOrder,
                rightOrder,
                leftOrderTakerAssetFilledAmount,
                rightOrderTakerAssetFilledAmount,
                false,
                { from },
            );
            expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
        }

        it('should correctly calculate the results when only the right order is fully filled', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(98, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should correctly calculate the results when only the left order is fully filled', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(14, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('92.7835051546391752'), 16), // 92.85%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('92.8571428571428571'), 16), // 92.85%
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(2, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should give right maker a better price when rounding', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(83, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('26.5060240963855421'), 16), // 26.506%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('26.5306122448979591'), 16), // 26.531%
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should give left maker a better sell price when rounding', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should give right maker and right taker a favorable fee price when rounding', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(83, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(2650, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(2653, 0),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should give left maker and left taker a favorable fee price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(9166, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(9175, 0),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should transfer correct amounts when right order fill amount deviates from amount derived by `Exchange.fillOrder`', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(2126, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1063, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(503, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('47.2718720602069614'), 16), // 47.27%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('47.3189087488240827'), 16), // 47.31%
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(497, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts when orders completely fill each other', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts when orders completely fill each other and taker doesnt take a profit', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(0, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts when left order is completely filled and right order is partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(20, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(4, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(50, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(50, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts when right order is completely filled and left order is partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });
        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            const feeRecipientAddress = randomAddress();
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                signedOrderLeft.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                signedOrderRight.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == leftFeeRecipient', async () => {
            const feeRecipientAddressLeft = randomAddress();

            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                feeRecipientAddressLeft,
            );
        });

        it('should transfer the correct amounts if taker == rightFeeRecipient', async () => {
            const feeRecipientAddressRight = randomAddress();

            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                feeRecipientAddressRight,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && rightMaker == rightFeeRecipient', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: makerAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress: makerAddressRight,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && leftMakerFeeAsset == leftTakerAsset', async () => {
            // Create orders to match
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                makerFeeAssetData: signedOrderRight.makerAssetData,
                feeRecipientAddress: makerAddressLeft,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightMakerFeeAsset == rightTakerAsset', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: signedOrderLeft.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightTakerAsset == rightMakerFeeAsset && leftMaker == leftFeeRecipient && leftTakerAsset == leftMakerFeeAsset', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: makerAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: signedOrderLeft.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });
    });

    blockchainTests('calculateMatchedFillResultsWithMaximalFill', async () => {
        /**
         * Asserts that the results of calling `calculateMatchedFillResults()` is consistent with the results that are expected.
         */
        async function assertCalculateMatchedFillResultsWithMaximalFillAsync(
            expectedMatchedFillResults: MatchedFillResults,
            leftOrder: SignedOrder,
            rightOrder: SignedOrder,
            leftOrderTakerAssetFilledAmount: BigNumber,
            rightOrderTakerAssetFilledAmount: BigNumber,
            from?: string,
        ): Promise<void> {
            const actualMatchedFillResults = await testExchange.calculateMatchedFillResults.callAsync(
                leftOrder,
                rightOrder,
                leftOrderTakerAssetFilledAmount,
                rightOrderTakerAssetFilledAmount,
                true,
                { from },
            );
            expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
        }

        it('should transfer correct amounts when right order is fully filled', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(98, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16), // 76.47%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16), // 76.53%
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should transfer correct amounts when left order is fully filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(196, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(28, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(105, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('53.5714285714285714'), 16), // 53.57%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('53.5714285714285714'), 16), // 53.57%
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(15, 0),
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should transfer correct amounts when left order is fully filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(87, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(48, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(29, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('33.3333333333333333'), 16), // 33.33%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('33.3333333333333333'), 16), // 33.33%
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(7, 0),
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should fully fill both orders and pay out profit in both maker assets', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(7, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(4, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(8, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(6, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(7, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(4, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(8, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(6, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(1, 0),
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(4, 0),
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should give left maker a better sell price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should give right maker and right taker a favorable fee price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(87, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(48, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(29, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(3333, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(3333, 0),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(7, 0),
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('Should give left maker and left taker a favorable fee price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(9166, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(9175, 0),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the left order', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
            const signedOrderRight2 = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const expectedMatchedFillResults2 = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults2,
                signedOrderLeft,
                signedOrderRight2,
                Web3Wrapper.toBaseUnitAmount(10, 18),
                constants.ZERO_AMOUNT,
            );
        });

        it('Should transfer correct amounts when right order fill amount deviates from amount derived by `Exchange.fillOrder`', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(2126, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1063, 0),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2000, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('94.0733772342427093'), 16), // 94.07%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('94.0733772342427093'), 16), // 94.07%
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(995, 0),
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts when orders completely fill each other and taker doesnt take a profit', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the right order', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });

            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
            // Create second left order
            // Note: This order needs makerAssetAmount=96/takerAssetAmount=48 to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "right fill"
            //       branch in the contract twice for this test.
            const signedOrderLeft2 = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const expectedMatchedFillResults2 = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults2,
                signedOrderLeft2,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(10, 18),
            );
        });

        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            const feeRecipientAddress = randomAddress();
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                signedOrderLeft.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == rightMaker', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                signedOrderRight.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == leftFeeRecipient', async () => {
            const feeRecipientAddress = randomAddress();
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                feeRecipientAddress,
            );
        });

        it('should transfer the correct amounts if taker == rightFeeRecipient', async () => {
            const feeRecipientAddress = randomAddress();
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                feeRecipientAddress,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && rightMaker == rightFeeRecipient', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: makerAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress: makerAddressRight,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && leftMakerFeeAsset == leftTakerAsset', async () => {
            // Create orders to match
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                makerFeeAssetData: signedOrderRight.makerAssetData,
                feeRecipientAddress: makerAddressLeft,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightMakerFeeAsset == rightTakerAsset', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: signedOrderLeft.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightTakerAsset == rightMakerFeeAsset && leftMaker == leftFeeRecipient && leftTakerAsset == leftMakerFeeAsset', async () => {
            const makerFeeAssetData = randomAssetData();
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                makerFeeAssetData,
                feeRecipientAddress: makerAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: signedOrderLeft.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            const expectedMatchedFillResults = {
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
                profitInRightMakerAsset: constants.ZERO_AMOUNT,
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                signedOrderLeft,
                signedOrderRight,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
        });
    });

    blockchainTests.resets('updateFilledState', async () => {
        const ORDER_DEFAULTS = {
            senderAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            makerFee: ONE_ETHER.times(0.001),
            takerFee: ONE_ETHER.times(0.003),
            makerAssetAmount: ONE_ETHER,
            takerAssetAmount: ONE_ETHER.times(0.5),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            salt: new BigNumber(_.random(0, 1e8)),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
        };

        function makeOrder(details?: Partial<Order>): Order {
            return _.assign({}, ORDER_DEFAULTS, details);
        }

        async function testUpdateFilledStateAsync(
            order: Order,
            orderTakerAssetFilledAmount: BigNumber,
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
        ): Promise<void> {
            const orderHash = randomHash();
            const fillResults = ReferenceFunctions.calculateFillResults(order, takerAssetFillAmount);
            const expectedFilledState = orderTakerAssetFilledAmount.plus(takerAssetFillAmount);
            // CAll `testUpdateFilledState()`, which will set the `filled`
            // state for this order to `orderTakerAssetFilledAmount` before
            // calling `_updateFilledState()`.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.testUpdateFilledState.sendTransactionAsync(
                    order,
                    takerAddress,
                    orderHash,
                    orderTakerAssetFilledAmount,
                    fillResults,
                ),
            );
            // Grab the new `filled` state for this order.
            const actualFilledState = await testExchange.filled.callAsync(orderHash);
            // Assert the `filled` state for this order.
            expect(actualFilledState).to.bignumber.eq(expectedFilledState);
            // Assert the logs.
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const fillEvent = receipt.logs[0] as LogWithDecodedArgs<TestExchangeInternalsFillEventArgs>;
            expect(fillEvent.event).to.eq('Fill');
            expect(fillEvent.args.makerAddress).to.eq(order.makerAddress);
            expect(fillEvent.args.feeRecipientAddress).to.eq(order.feeRecipientAddress);
            expect(fillEvent.args.makerAssetData).to.eq(order.makerAssetData);
            expect(fillEvent.args.takerAssetData).to.eq(order.takerAssetData);
            expect(fillEvent.args.makerFeeAssetData).to.eq(order.makerFeeAssetData);
            expect(fillEvent.args.takerFeeAssetData).to.eq(order.takerFeeAssetData);
            expect(fillEvent.args.makerAssetFilledAmount).to.bignumber.eq(fillResults.makerAssetFilledAmount);
            expect(fillEvent.args.takerAssetFilledAmount).to.bignumber.eq(fillResults.takerAssetFilledAmount);
            expect(fillEvent.args.makerFeePaid).to.bignumber.eq(fillResults.makerFeePaid);
            expect(fillEvent.args.takerFeePaid).to.bignumber.eq(fillResults.takerFeePaid);
            expect(fillEvent.args.takerAddress).to.eq(takerAddress);
            expect(fillEvent.args.senderAddress).to.eq(senderAddress);
            expect(fillEvent.args.orderHash).to.eq(orderHash);
        }

        it('emits a `Fill` event and updates `filled` state correctly', async () => {
            const order = makeOrder();
            return testUpdateFilledStateAsync(
                order,
                order.takerAssetAmount.times(0.1),
                randomAddress(),
                order.takerAssetAmount.times(0.25),
            );
        });

        it('reverts if `leftOrderTakerAssetFilledAmount + fillResults.takerAssetFilledAmount` overflows', async () => {
            const order = makeOrder();
            const orderTakerAssetFilledAmount = constants.MAX_UINT256.dividedToIntegerBy(2);
            const takerAssetFillAmount = constants.MAX_UINT256.dividedToIntegerBy(2).plus(2);
            const fillResults = {
                makerAssetFilledAmount: constants.ZERO_AMOUNT,
                takerAssetFilledAmount: takerAssetFillAmount,
                makerFeePaid: constants.ZERO_AMOUNT,
                takerFeePaid: constants.ZERO_AMOUNT,
            };
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                orderTakerAssetFilledAmount,
                takerAssetFillAmount,
            );
            return expect(
                testExchange.testUpdateFilledState.awaitTransactionSuccessAsync(
                    order,
                    randomAddress(),
                    randomHash(),
                    orderTakerAssetFilledAmount,
                    fillResults,
                ),
            ).to.revertWith(expectedError);
        });
    });

    blockchainTests('settleOrder', () => {
        const DEFAULT_ORDER = {
            senderAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            makerFee: ONE_ETHER.times(0.001),
            takerFee: ONE_ETHER.times(0.003),
            makerAssetAmount: ONE_ETHER,
            takerAssetAmount: ONE_ETHER.times(0.5),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            salt: new BigNumber(_.random(0, 1e8)),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
        };

        it('calls `_dispatchTransferFrom()` in the right order with the correct arguments', async () => {
            const order = DEFAULT_ORDER;
            const orderHash = randomHash();
            const takerAddress = randomAddress();
            const fillResults = {
                makerAssetFilledAmount: ONE_ETHER.times(2),
                takerAssetFilledAmount: ONE_ETHER.times(10),
                makerFeePaid: ONE_ETHER.times(0.01),
                takerFeePaid: ONE_ETHER.times(0.025),
            };
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.settleOrder.sendTransactionAsync(orderHash, order, takerAddress, fillResults),
            );
            const logs = receipt.logs as Array<
                LogWithDecodedArgs<TestExchangeInternalsDispatchTransferFromCalledEventArgs>
            >;
            expect(logs.length === 4);
            expect(_.every(logs, log => log.event === 'DispatchTransferFromCalled')).to.be.true();
            // taker -> maker
            expect(logs[0].args.orderHash).to.eq(orderHash);
            expect(logs[0].args.assetData).to.eq(order.takerAssetData);
            expect(logs[0].args.from).to.eq(takerAddress);
            expect(logs[0].args.to).to.eq(order.makerAddress);
            expect(logs[0].args.amount).to.bignumber.eq(fillResults.takerAssetFilledAmount);
            // maker -> taker
            expect(logs[1].args.orderHash).to.eq(orderHash);
            expect(logs[1].args.assetData).to.eq(order.makerAssetData);
            expect(logs[1].args.from).to.eq(order.makerAddress);
            expect(logs[1].args.to).to.eq(takerAddress);
            expect(logs[1].args.amount).to.bignumber.eq(fillResults.makerAssetFilledAmount);
            // taker fee -> feeRecipient
            expect(logs[2].args.orderHash).to.eq(orderHash);
            expect(logs[2].args.assetData).to.eq(order.takerFeeAssetData);
            expect(logs[2].args.from).to.eq(takerAddress);
            expect(logs[2].args.to).to.eq(order.feeRecipientAddress);
            expect(logs[2].args.amount).to.bignumber.eq(fillResults.takerFeePaid);
            // maker fee -> feeRecipient
            expect(logs[3].args.orderHash).to.eq(orderHash);
            expect(logs[3].args.assetData).to.eq(order.makerFeeAssetData);
            expect(logs[3].args.from).to.eq(order.makerAddress);
            expect(logs[3].args.to).to.eq(order.feeRecipientAddress);
            expect(logs[3].args.amount).to.bignumber.eq(fillResults.makerFeePaid);
        });
    });

    blockchainTests('settleMatchOrders', () => {
        const getLeftOrder = () => {
            return {
                senderAddress: randomAddress(),
                makerAddress: randomAddress(),
                takerAddress: randomAddress(),
                makerFee: ONE_ETHER.times(0.001),
                takerFee: ONE_ETHER.times(0.003),
                makerAssetAmount: ONE_ETHER,
                takerAssetAmount: ONE_ETHER.times(0.5),
                makerAssetData: randomAssetData(),
                takerAssetData: randomAssetData(),
                makerFeeAssetData: randomAssetData(),
                takerFeeAssetData: randomAssetData(),
                salt: new BigNumber(_.random(0, 1e8)),
                feeRecipientAddress: randomAddress(),
                expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
            };
        };

        const getRightOrder = () => {
            return {
                senderAddress: randomAddress(),
                makerAddress: randomAddress(),
                takerAddress: randomAddress(),
                makerFee: ONE_ETHER.times(0.002),
                takerFee: ONE_ETHER.times(0.004),
                makerAssetAmount: ONE_ETHER,
                takerAssetAmount: ONE_ETHER.times(0.6),
                makerAssetData: randomAssetData(),
                takerAssetData: randomAssetData(),
                makerFeeAssetData: randomAssetData(),
                takerFeeAssetData: randomAssetData(),
                salt: new BigNumber(_.random(0, 1e8)),
                feeRecipientAddress: randomAddress(),
                expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
            };
        };

        it('calls `_dispatchTransferFrom()` from in the right order when the fee recipients and taker fee asset data are the same', async () => {
            const leftOrder = getLeftOrder();
            const rightOrder = getRightOrder();
            const leftOrderHash = randomHash();
            const rightOrderHash = randomHash();
            const takerAddress = randomAddress();
            const matchedFillResults = {
                left: {
                    makerAssetFilledAmount: ONE_ETHER.times(2),
                    takerAssetFilledAmount: ONE_ETHER.times(10),
                    makerFeePaid: ONE_ETHER.times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.025),
                },
                right: {
                    takerAssetFilledAmount: ONE_ETHER.times(20),
                    makerAssetFilledAmount: ONE_ETHER.times(4),
                    makerFeePaid: ONE_ETHER.times(0.02),
                    takerFeePaid: ONE_ETHER.times(0.05),
                },
                profitInLeftMakerAsset: ONE_ETHER,
                profitInRightMakerAsset: ONE_ETHER.times(2),
            };

            // Set the fee recipient addresses and the taker fee asset data fields to be the same
            rightOrder.feeRecipientAddress = leftOrder.feeRecipientAddress;
            rightOrder.takerFeeAssetData = leftOrder.takerFeeAssetData;

            // Call settleMatchOrders and collect the logs
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.settleMatchOrders.sendTransactionAsync(
                    leftOrderHash,
                    rightOrderHash,
                    leftOrder,
                    rightOrder,
                    takerAddress,
                    matchedFillResults,
                ),
            );
            const logs = receipt.logs as Array<
                LogWithDecodedArgs<TestExchangeInternalsDispatchTransferFromCalledEventArgs>
            >;

            // Ensure that the logs have the correct lengths and names
            expect(logs.length).to.be.eq(7);
            expect(_.every(logs, log => log.event === 'DispatchTransferFromCalled')).to.be.true();

            // Right maker asset -> left maker
            expect(logs[0].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[0].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[0].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[0].args.to).to.be.eq(leftOrder.makerAddress);
            expect(logs[0].args.amount).bignumber.to.be.eq(matchedFillResults.left.takerAssetFilledAmount);

            // Left maker asset -> right maker
            expect(logs[1].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[1].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[1].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[1].args.to).to.be.eq(rightOrder.makerAddress);
            expect(logs[1].args.amount).bignumber.to.be.eq(matchedFillResults.right.takerAssetFilledAmount);

            // Right maker fee -> right fee recipient
            expect(logs[2].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[2].args.assetData).to.be.eq(rightOrder.makerFeeAssetData);
            expect(logs[2].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[2].args.to).to.be.eq(rightOrder.feeRecipientAddress);
            expect(logs[2].args.amount).bignumber.to.be.eq(matchedFillResults.right.makerFeePaid);

            // Left maker fee -> left fee recipient
            expect(logs[3].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[3].args.assetData).to.be.eq(leftOrder.makerFeeAssetData);
            expect(logs[3].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[3].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[3].args.amount).bignumber.to.be.eq(matchedFillResults.left.makerFeePaid);

            // Left maker -> taker profit
            expect(logs[4].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[4].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[4].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[4].args.to).to.be.eq(takerAddress);
            expect(logs[4].args.amount).bignumber.to.be.eq(matchedFillResults.profitInLeftMakerAsset);

            // right maker -> taker profit
            expect(logs[5].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[5].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[5].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[5].args.to).to.be.eq(takerAddress);
            expect(logs[5].args.amount).bignumber.to.be.eq(matchedFillResults.profitInRightMakerAsset);

            // taker fees -> fee recipient
            expect(logs[6].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[6].args.assetData).to.be.eq(leftOrder.takerFeeAssetData);
            expect(logs[6].args.from).to.be.eq(takerAddress);
            expect(logs[6].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[6].args.amount).bignumber.to.be.eq(ONE_ETHER.times(0.075));
        });

        it('calls `_dispatchTransferFrom()` from in the right order when the fee recipients and taker fee asset data are not the same', async () => {
            const leftOrder = getLeftOrder();
            const rightOrder = getRightOrder();
            const leftOrderHash = randomHash();
            const rightOrderHash = randomHash();
            const takerAddress = randomAddress();
            const matchedFillResults = {
                left: {
                    makerAssetFilledAmount: ONE_ETHER.times(2),
                    takerAssetFilledAmount: ONE_ETHER.times(10),
                    makerFeePaid: ONE_ETHER.times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.025),
                },
                right: {
                    takerAssetFilledAmount: ONE_ETHER.times(20),
                    makerAssetFilledAmount: ONE_ETHER.times(4),
                    makerFeePaid: ONE_ETHER.times(0.02),
                    takerFeePaid: ONE_ETHER.times(0.05),
                },
                profitInLeftMakerAsset: ONE_ETHER,
                profitInRightMakerAsset: ONE_ETHER.times(2),
            };

            // Call settleMatchOrders and collect the logs
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.settleMatchOrders.sendTransactionAsync(
                    leftOrderHash,
                    rightOrderHash,
                    leftOrder,
                    rightOrder,
                    takerAddress,
                    matchedFillResults,
                ),
            );
            const logs = receipt.logs as Array<
                LogWithDecodedArgs<TestExchangeInternalsDispatchTransferFromCalledEventArgs>
            >;

            // Ensure that the logs have the correct lengths and names
            expect(logs.length).to.be.eq(8);
            expect(_.every(logs, log => log.event === 'DispatchTransferFromCalled')).to.be.true();

            // Right maker asset -> left maker
            expect(logs[0].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[0].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[0].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[0].args.to).to.be.eq(leftOrder.makerAddress);
            expect(logs[0].args.amount).bignumber.to.be.eq(matchedFillResults.left.takerAssetFilledAmount);

            // Left maker asset -> right maker
            expect(logs[1].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[1].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[1].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[1].args.to).to.be.eq(rightOrder.makerAddress);
            expect(logs[1].args.amount).bignumber.to.be.eq(matchedFillResults.right.takerAssetFilledAmount);

            // Right maker fee -> right fee recipient
            expect(logs[2].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[2].args.assetData).to.be.eq(rightOrder.makerFeeAssetData);
            expect(logs[2].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[2].args.to).to.be.eq(rightOrder.feeRecipientAddress);
            expect(logs[2].args.amount).bignumber.to.be.eq(matchedFillResults.right.makerFeePaid);

            // Left maker fee -> left fee recipient
            expect(logs[3].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[3].args.assetData).to.be.eq(leftOrder.makerFeeAssetData);
            expect(logs[3].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[3].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[3].args.amount).bignumber.to.be.eq(matchedFillResults.left.makerFeePaid);

            // Left maker -> taker profit
            expect(logs[4].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[4].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[4].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[4].args.to).to.be.eq(takerAddress);
            expect(logs[4].args.amount).bignumber.to.be.eq(matchedFillResults.profitInLeftMakerAsset);

            // right maker -> taker profit
            expect(logs[5].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[5].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[5].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[5].args.to).to.be.eq(takerAddress);
            expect(logs[5].args.amount).bignumber.to.be.eq(matchedFillResults.profitInRightMakerAsset);

            // Right taker fee -> right fee recipient
            expect(logs[6].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[6].args.assetData).to.be.eq(rightOrder.takerFeeAssetData);
            expect(logs[6].args.from).to.be.eq(takerAddress);
            expect(logs[6].args.to).to.be.eq(rightOrder.feeRecipientAddress);
            expect(logs[6].args.amount).bignumber.to.be.eq(matchedFillResults.right.takerFeePaid);

            // Right taker fee -> right fee recipient
            expect(logs[7].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[7].args.assetData).to.be.eq(leftOrder.takerFeeAssetData);
            expect(logs[7].args.from).to.be.eq(takerAddress);
            expect(logs[7].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[7].args.amount).bignumber.to.be.eq(matchedFillResults.left.takerFeePaid);
        });
    });
});
// tslint:disable-line:max-file-line-count
