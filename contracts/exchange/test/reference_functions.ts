import { LibMathRevertErrors, ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import { constants, describe, expect } from '@0x/contracts-test-utils';
import { SafeMathRevertErrors } from '@0x/contracts-utils';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

describe('Reference functions', () => {
    const ONE_ETHER = constants.ONE_ETHER;
    const DEFAULT_GAS_PRICE = new BigNumber(2);
    const DEFAULT_PROTOCOL_FEE_MULTIPLIER = new BigNumber(150);
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

    describe('calculateFillResults', () => {
        const MAX_UINT256_ROOT = constants.MAX_UINT256_ROOT;
        function makeOrder(details?: Partial<Order>): Order {
            return _.assign({}, EMPTY_ORDER, details);
        }

        it('reverts if computing `fillResults.makerAssetFilledAmount` overflows', () => {
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
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                ),
            ).to.throw(expectedError.message);
        });

        it('reverts if computing `fillResults.makerFeePaid` overflows', () => {
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
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                makerAssetFilledAmount,
                order.makerFee,
            );
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                ),
            ).to.throw(expectedError.message);
        });

        it('reverts if computing `fillResults.takerFeePaid` overflows', () => {
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
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                ),
            ).to.throw(expectedError.message);
        });

        it('reverts if `order.takerAssetAmount` is 0', () => {
            const order = makeOrder({
                makerAssetAmount: ONE_ETHER,
                takerAssetAmount: constants.ZERO_AMOUNT,
            });
            const takerAssetFilledAmount = ONE_ETHER;
            const expectedError = new LibMathRevertErrors.DivisionByZeroError();
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                ),
            ).to.throw(expectedError.message);
        });

        it('reverts if there is a rounding error computing `makerAsssetFilledAmount`', () => {
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
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                ),
            ).to.throw(expectedError.message);
        });

        it('reverts if there is a rounding error computing `makerFeePaid`', () => {
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
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                ),
            ).to.throw(expectedError.message);
        });

        it('reverts if there is a rounding error computing `takerFeePaid`', () => {
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
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                    DEFAULT_GAS_PRICE,
                ),
            ).to.throw(expectedError.message);
        });

        it('reverts if there is an overflow computing `protocolFeePaid`', () => {
            const order = makeOrder({
                makerAssetAmount: ONE_ETHER,
                takerAssetAmount: ONE_ETHER,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                MAX_UINT256_ROOT,
                MAX_UINT256_ROOT,
            );
            return expect(() =>
                LibReferenceFunctions.calculateFillResults(
                    order,
                    takerAssetFilledAmount,
                    MAX_UINT256_ROOT,
                    MAX_UINT256_ROOT,
                ),
            ).to.throw(expectedError.message);
        });
    });
});
// tslint:disable-line:max-file-line-count
