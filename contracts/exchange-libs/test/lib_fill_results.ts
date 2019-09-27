import {
    blockchainTests,
    constants,
    describe,
    expect,
    hexRandom,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { LibMathRevertErrors } from '@0x/order-utils';
import { FillResults, MatchedFillResults, Order } from '@0x/types';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { artifacts, ReferenceFunctions, TestLibFillResultsContract } from '../src';

blockchainTests('LibFillResults', env => {
    interface PartialMatchedFillResults {
        left: Partial<FillResults>;
        right: Partial<FillResults>;
        profitInLeftMakerAsset?: BigNumber;
        profitInRightMakerAsset?: BigNumber;
    }

    const { ONE_ETHER, MAX_UINT256 } = constants;
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
        chainId: 1,
        exchangeAddress: constants.NULL_ADDRESS,
    };

    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomAssetData = () => hexRandom(36);
    const randomUint256 = () => new BigNumber(hexRandom(constants.WORD_LENGTH));

    let libsContract: TestLibFillResultsContract;
    let makerAddressLeft: string;
    let makerAddressRight: string;

    before(async () => {
        const accounts = await env.getAccountAddressesAsync();
        makerAddressLeft = accounts[0];
        makerAddressRight = accounts[1];

        libsContract = await TestLibFillResultsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibFillResults,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    describe('calculateFillResults', () => {
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
                    takerAssetFilledAmount, // Using this so that the gas price is distinct from protocolFeeMultiplier
                    otherAmount,
                );
            }

            async function testCalculateFillResultsAsync(
                orderTakerAssetAmount: BigNumber,
                takerAssetFilledAmount: BigNumber,
                otherAmount: BigNumber,
            ): Promise<FillResults> {
                const order = makeOrder(otherAmount, orderTakerAssetAmount, otherAmount, otherAmount);
                return libsContract.calculateFillResults.callAsync(
                    order,
                    takerAssetFilledAmount,
                    takerAssetFilledAmount, // Using this so that the gas price is distinct from protocolFeeMultiplier
                    otherAmount,
                );
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
            const DEFAULT_GAS_PRICE = new BigNumber(200000);
            const DEFAULT_PROTOCOL_FEE_MULTIPLIER = new BigNumber(150000);

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
                const expected = ReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                );
                const actual = await libsContract.calculateFillResults.callAsync(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                );
                expect(actual).to.deep.eq(expected);
            });

            it('reverts if computing `fillResults.makerAssetFilledAmount` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT.times(2),
                    takerAssetAmount: MAX_UINT256_ROOT,
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    takerAssetFilledAmount,
                    order.makerAssetAmount,
                );
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });

            it('reverts if computing `fillResults.makerFeePaid` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT,
                    takerAssetAmount: MAX_UINT256_ROOT,
                    makerFee: MAX_UINT256_ROOT.times(11),
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
                const makerAssetFilledAmount = ReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    makerAssetFilledAmount,
                    order.makerFee,
                );
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });

            it('reverts if computing `fillResults.takerFeePaid` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT,
                    takerAssetAmount: MAX_UINT256_ROOT,
                    takerFee: MAX_UINT256_ROOT.times(11),
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    takerAssetFilledAmount,
                    order.takerFee,
                );
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });

            it('reverts if `order.takerAssetAmount` is 0', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: constants.ZERO_AMOUNT,
                });
                const takerAssetFilledAmount = ONE_ETHER;
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
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
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });

            it('reverts if there is a rounding error computing `makerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    makerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = ReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.makerFee,
                );
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });

            it('reverts if there is a rounding error computing `takerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    takerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = ReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.takerFee,
                );
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });

            it('reverts if computing `fillResults.protocolFeePaid` overflows', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER.times(2),
                    makerFee: ONE_ETHER.times(0.0023),
                    takerFee: ONE_ETHER.times(0.0025),
                });
                const takerAssetFilledAmount = ONE_ETHER.dividedToIntegerBy(3);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    DEFAULT_GAS_PRICE,
                    MAX_UINT256,
                );
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        MAX_UINT256,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });

            it('reverts if there is a rounding error computing `makerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    makerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = ReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.makerFee,
                );
                return expect(
                    libsContract.calculateFillResults.callAsync(
                        order,
                        takerAssetFilledAmount,
                        DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                        DEFAULT_GAS_PRICE,
                    ),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('addFillResults', () => {
        describe('explicit tests', () => {
            const DEFAULT_FILL_RESULTS = [
                {
                    makerAssetFilledAmount: ONE_ETHER,
                    takerAssetFilledAmount: ONE_ETHER.times(2),
                    makerFeePaid: ONE_ETHER.times(0.001),
                    takerFeePaid: ONE_ETHER.times(0.002),
                    protocolFeePaid: ONE_ETHER.times(0.003),
                },
                {
                    makerAssetFilledAmount: ONE_ETHER.times(0.01),
                    takerAssetFilledAmount: ONE_ETHER.times(2).times(0.01),
                    makerFeePaid: ONE_ETHER.times(0.001).times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.002).times(0.01),
                    protocolFeePaid: ONE_ETHER.times(0.003).times(0.01),
                },
            ];

            it('matches the output of the reference function', async () => {
                const [a, b] = DEFAULT_FILL_RESULTS;
                const expected = ReferenceFunctions.addFillResults(a, b);
                const actual = await libsContract.addFillResults.callAsync(a, b);
                expect(actual).to.deep.equal(expected);
            });

            it('reverts if computing `makerAssetFilledAmount` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                    a.makerAssetFilledAmount,
                    b.makerAssetFilledAmount,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `takerAssetFilledAmount` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                    a.takerAssetFilledAmount,
                    b.takerAssetFilledAmount,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `makerFeePaid` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                    a.makerFeePaid,
                    b.makerFeePaid,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `takerFeePaid` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                    a.takerFeePaid,
                    b.takerFeePaid,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `protocolFeePaid` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.protocolFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                    a.protocolFeePaid,
                    b.protocolFeePaid,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });
        });
    });

    const EMPTY_FILL_RESULTS: FillResults = {
        makerAssetFilledAmount: constants.ZERO_AMOUNT,
        takerAssetFilledAmount: constants.ZERO_AMOUNT,
        makerFeePaid: constants.ZERO_AMOUNT,
        takerFeePaid: constants.ZERO_AMOUNT,
        protocolFeePaid: constants.ZERO_AMOUNT,
    };

    const EMPTY_MATCHED_FILL_RESULTS: MatchedFillResults = {
        left: EMPTY_FILL_RESULTS,
        right: EMPTY_FILL_RESULTS,
        profitInLeftMakerAsset: constants.ZERO_AMOUNT,
        profitInRightMakerAsset: constants.ZERO_AMOUNT,
    };

    const COMMON_MATCHED_FILL_RESULTS = {
        left: {
            makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
            takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
            takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
            protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 4),
        },
        right: {
            makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
            takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
            protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 4),
        },
        profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
        profitInRightMakerAsset: constants.ZERO_AMOUNT,
    };

    function createMatchedFillResults(partialMatchedFillResults: PartialMatchedFillResults): MatchedFillResults {
        const matchedFillResults = EMPTY_MATCHED_FILL_RESULTS;
        matchedFillResults.left = _.assign({}, EMPTY_FILL_RESULTS, partialMatchedFillResults.left);
        matchedFillResults.right = _.assign({}, EMPTY_FILL_RESULTS, partialMatchedFillResults.right);
        matchedFillResults.profitInLeftMakerAsset =
            partialMatchedFillResults.profitInLeftMakerAsset || constants.ZERO_AMOUNT;
        matchedFillResults.profitInRightMakerAsset =
            partialMatchedFillResults.profitInRightMakerAsset || constants.ZERO_AMOUNT;
        return matchedFillResults;
    }

    blockchainTests('calculateMatchedFillResults', async () => {
        /**
         * Asserts that the results of calling `calculateMatchedFillResults()` is consistent with the results that are expected.
         */
        async function assertCalculateMatchedFillResultsAsync(
            expectedMatchedFillResults: MatchedFillResults,
            leftOrder: Order,
            rightOrder: Order,
            leftOrderTakerAssetFilledAmount: BigNumber,
            rightOrderTakerAssetFilledAmount: BigNumber,
            protocolFeeMultiplier: BigNumber,
            gasPrice: BigNumber,
            from?: string,
        ): Promise<void> {
            const actualMatchedFillResults = await libsContract.calculateMatchedFillResults.callAsync(
                leftOrder,
                rightOrder,
                leftOrderTakerAssetFilledAmount,
                rightOrderTakerAssetFilledAmount,
                protocolFeeMultiplier,
                gasPrice,
                false,
                { from },
            );
            expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
        }

        const ORDER_DEFAULTS = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            senderAddress: randomAddress(),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: randomUint256(),
            salt: randomUint256(),
            exchangeAddress: constants.NULL_ADDRESS,
            chainId: 1337, // The chain id for the isolated exchange
        };

        function makeOrder(details?: Partial<Order>): Order {
            return _.assign({}, ORDER_DEFAULTS, details);
        }

        before(async () => {
            ORDER_DEFAULTS.exchangeAddress = libsContract.address;
        });

        it('should correctly calculate the results when only the right order is fully filled', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(98, 0),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should correctly calculate the results when only the left order is fully filled', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(14, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('92.7835051546391752'), 16), // 92.85%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('92.8571428571428571'), 16), // 92.85%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(2, 0),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should give right maker a better price when rounding', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(83, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('26.5060240963855421'), 16), // 26.506%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('26.5306122448979591'), 16), // 26.531%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 0),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should give left maker a better sell price when rounding', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                makerAddress: makerAddressLeft,
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('Should give right maker and right taker a favorable fee price when rounding', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(83, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(2650, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(2653, 0),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 0),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('Should give left maker and left taker a favorable fee price when rounding', async () => {
            // Create orders to match
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(9166, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(9175, 0),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('Should transfer correct amounts when right order fill amount deviates from amount derived by `Exchange.fillOrder`', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(2126, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1063, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(503, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('47.2718720602069614'), 16), // 47.27%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('47.3189087488240827'), 16), // 47.31%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(497, 0),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts when orders completely fill each other', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts when orders completely fill each other and taker doesnt take a profit', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts when left order is completely filled and right order is partially filled', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(20, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(4, 18),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(50, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(50, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts when right order is completely filled and left order is partially filled', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
            });
            await assertCalculateMatchedFillResultsAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });
        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            const feeRecipientAddress = randomAddress();
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress,
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                leftOrder.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                rightOrder.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == leftFeeRecipient', async () => {
            const feeRecipientAddressLeft = randomAddress();
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                feeRecipientAddressLeft,
            );
        });

        it('should transfer the correct amounts if taker == rightFeeRecipient', async () => {
            const feeRecipientAddressRight = randomAddress();
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                feeRecipientAddressRight,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && rightMaker == rightFeeRecipient', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: makerAddressLeft,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress: makerAddressRight,
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && leftMakerFeeAsset == leftTakerAsset', async () => {
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                makerFeeAssetData: rightOrder.makerAssetData,
                feeRecipientAddress: makerAddressLeft,
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightMakerFeeAsset == rightTakerAsset', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: leftOrder.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightTakerAsset == rightMakerFeeAsset && leftMaker == leftFeeRecipient && leftTakerAsset == leftMakerFeeAsset', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: makerAddressLeft,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: leftOrder.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            await assertCalculateMatchedFillResultsAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });
    });

    blockchainTests('calculateMatchedFillResultsWithMaximalFill', async () => {
        /**
         * Asserts that the results of calling `calculateMatchedFillResults()` is consistent with the results that are expected.
         */
        async function assertCalculateMatchedFillResultsWithMaximalFillAsync(
            expectedMatchedFillResults: MatchedFillResults,
            leftOrder: Order,
            rightOrder: Order,
            leftOrderTakerAssetFilledAmount: BigNumber,
            rightOrderTakerAssetFilledAmount: BigNumber,
            protocolFeeMultiplier: BigNumber,
            gasPrice: BigNumber,
            from?: string,
        ): Promise<void> {
            const actualMatchedFillResults = await libsContract.calculateMatchedFillResults.callAsync(
                leftOrder,
                rightOrder,
                leftOrderTakerAssetFilledAmount,
                rightOrderTakerAssetFilledAmount,
                protocolFeeMultiplier,
                gasPrice,
                true,
                { from },
            );
            expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
        }

        const ORDER_DEFAULTS = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            senderAddress: randomAddress(),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: randomUint256(),
            salt: randomUint256(),
            exchangeAddress: constants.NULL_ADDRESS,
            chainId: 1337, // The chain id for the isolated exchange
        };

        function makeOrder(details?: Partial<Order>): Order {
            return _.assign({}, ORDER_DEFAULTS, details);
        }

        before(async () => {
            ORDER_DEFAULTS.exchangeAddress = libsContract.address;
        });

        it('should transfer correct amounts when right order is fully filled', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(98, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16), // 76.47%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16), // 76.53%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(75, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(13, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                new BigNumber(150000),
                new BigNumber(100000),
            );
        });

        it('Should transfer correct amounts when left order is fully filled', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(196, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(28, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(105, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(15, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('53.5714285714285714'), 16), // 53.57%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('53.5714285714285714'), 16), // 53.57%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(15, 0),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                new BigNumber(150000),
                new BigNumber(100000),
            );
        });

        it('Should transfer correct amounts when left order is fully filled', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(87, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(48, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(29, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('33.3333333333333333'), 16), // 33.33%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('33.3333333333333333'), 16), // 33.33%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: constants.ZERO_AMOUNT,
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(7, 0),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should fully fill both orders and pay out profit in both maker assets', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(7, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(4, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(8, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(6, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(7, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(4, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(8, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(6, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(1, 0),
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(4, 0),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('Should give left maker a better sell price when rounding', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('Should give right maker and right taker a favorable fee price when rounding', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(87, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(48, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(22, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(29, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(16, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(3333, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(3333, 0),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(7, 0),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('Should give left maker and left taker a favorable fee price when rounding', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(10000, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(11, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(9166, 0),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(9175, 0),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(89, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInLeftMakerAsset: Web3Wrapper.toBaseUnitAmount(10, 0),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the left order', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const expectedMatchedFillResults = {
                ...COMMON_MATCHED_FILL_RESULTS,
                left: {
                    ...COMMON_MATCHED_FILL_RESULTS.left,
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                },
            };
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
            const rightOrder2 = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const expectedMatchedFillResults2 = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults2,
                leftOrder,
                rightOrder2,
                Web3Wrapper.toBaseUnitAmount(10, 18),
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('Should transfer correct amounts when right order fill amount deviates from amount derived by `Exchange.fillOrder`', async () => {
            const leftOrder = makeOrder({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
            });
            const rightOrder = makeOrder({
                makerAddress: makerAddressRight,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(2126, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(1063, 0),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1005, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2000, 0),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(1000, 0),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('94.0733772342427093'), 16), // 94.07%
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(new BigNumber('94.0733772342427093'), 16), // 94.07%
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(995, 0),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts when orders completely fill each other and taker doesnt take a profit', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the right order', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });

            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const expectedMatchedFillResults = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(100, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(10, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                profitInRightMakerAsset: Web3Wrapper.toBaseUnitAmount(3, 18),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
            // Create second left order
            // Note: This order needs makerAssetAmount=96/takerAssetAmount=48 to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "right fill"
            //       branch in the contract twice for this test.
            const leftOrder2 = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const expectedMatchedFillResults2 = createMatchedFillResults({
                left: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
                right: {
                    makerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(45, 18),
                    takerAssetFilledAmount: Web3Wrapper.toBaseUnitAmount(90, 18),
                    makerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    takerFeePaid: Web3Wrapper.toBaseUnitAmount(90, 16),
                    protocolFeePaid: Web3Wrapper.toBaseUnitAmount(15, 9),
                },
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                expectedMatchedFillResults2,
                leftOrder2,
                rightOrder,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(10, 18),
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 5),
            );
        });

        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            const feeRecipientAddress = randomAddress();
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress,
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                leftOrder.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == rightMaker', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                rightOrder.makerAddress,
            );
        });

        it('should transfer the correct amounts if taker == leftFeeRecipient', async () => {
            const feeRecipientAddress = randomAddress();
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                feeRecipientAddress,
            );
        });

        it('should transfer the correct amounts if taker == rightFeeRecipient', async () => {
            const feeRecipientAddress = randomAddress();
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress,
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
                feeRecipientAddress,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && rightMaker == rightFeeRecipient', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                feeRecipientAddress: makerAddressLeft,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                feeRecipientAddress: makerAddressRight,
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && leftMakerFeeAsset == leftTakerAsset', async () => {
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
            });
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                makerFeeAssetData: rightOrder.makerAssetData,
                feeRecipientAddress: makerAddressLeft,
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightMakerFeeAsset == rightTakerAsset', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: leftOrder.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightTakerAsset == rightMakerFeeAsset && leftMaker == leftFeeRecipient && leftTakerAsset == leftMakerFeeAsset', async () => {
            const makerFeeAssetData = randomAssetData();
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(5, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                makerFeeAssetData,
                feeRecipientAddress: makerAddressLeft,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(2, 18),
                makerFeeAssetData: leftOrder.makerAssetData,
                feeRecipientAddress: makerAddressRight,
            });
            await assertCalculateMatchedFillResultsWithMaximalFillAsync(
                COMMON_MATCHED_FILL_RESULTS,
                leftOrder,
                rightOrder,
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
                Web3Wrapper.toBaseUnitAmount(15, 4),
                Web3Wrapper.toBaseUnitAmount(1, 0),
            );
        });
    });
});
// tslint:disable-line:max-file-line-count
