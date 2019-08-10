import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import { blockchainTests, constants, expect, hexRandom } from '@0x/contracts-test-utils';
import { ExchangeRevertErrors, LibMathRevertErrors } from '@0x/order-utils';
import { FillResults, OrderInfo, OrderStatus, SignatureType } from '@0x/types';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { calculateFillResults } from '../src/reference_functions';

import {
    AssetBalances,
    createBadAssetData,
    createBadSignature,
    createGoodAssetData,
    createGoodSignature,
    IsolatedExchangeWrapper,
    Order,
} from './utils/isolated_exchange_wrapper';

blockchainTests('Isolated fillOrder() tests', env => {
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const getCurrentTime = () => Math.floor(_.now() / 1000);
    const { ZERO_AMOUNT, ONE_ETHER, MAX_UINT256_ROOT } = constants;
    const ONE_DAY = 60 * 60 * 24;
    const TOMORROW = getCurrentTime() + ONE_DAY;
    const DEFAULT_ORDER: Order = {
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: randomAddress(),
        takerAddress: constants.NULL_ADDRESS,
        feeRecipientAddress: randomAddress(),
        makerAssetAmount: ONE_ETHER,
        takerAssetAmount: ONE_ETHER.times(2),
        makerFee: ONE_ETHER.times(0.0015),
        takerFee: ONE_ETHER.times(0.0025),
        salt: ZERO_AMOUNT,
        expirationTimeSeconds: new BigNumber(TOMORROW),
        makerAssetData: createGoodAssetData(),
        takerAssetData: createGoodAssetData(),
        makerFeeAssetData: createGoodAssetData(),
        takerFeeAssetData: createGoodAssetData(),
    };
    let takerAddress: string;
    let notTakerAddress: string;
    let exchange: IsolatedExchangeWrapper;
    let nextSaltValue = 1;

    before(async () => {
        [takerAddress, notTakerAddress] = await env.getAccountAddressesAsync();
        exchange = await IsolatedExchangeWrapper.deployAsync(env.web3Wrapper, {
            ...env.txDefaults,
            from: takerAddress,
        });
    });

    function createOrder(details: Partial<Order> = {}): Order {
        return {
            ...DEFAULT_ORDER,
            salt: new BigNumber(nextSaltValue++),
            ...details,
        };
    }

    interface FillOrderAndAssertResultsResults {
        fillResults: FillResults;
        orderInfo: OrderInfo;
    }

    async function fillOrderAndAssertResultsAsync(
        order: Order,
        takerAssetFillAmount: BigNumber,
        signature?: string,
    ): Promise<FillOrderAndAssertResultsResults> {
        const orderInfo = await exchange.getOrderInfoAsync(order);
        const efr = calculateExpectedFillResults(order, orderInfo, takerAssetFillAmount);
        const eoi = calculateExpectedOrderInfo(order, orderInfo, efr);
        const efb = calculateExpectedFillBalances(order, efr);
        // Fill the order.
        const fillResults = await exchange.fillOrderAsync(order, takerAssetFillAmount, signature);
        const newOrderInfo = await exchange.getOrderInfoAsync(order);
        // Check returned fillResults.
        expect(fillResults.makerAssetFilledAmount).to.bignumber.eq(efr.makerAssetFilledAmount);
        expect(fillResults.takerAssetFilledAmount).to.bignumber.eq(efr.takerAssetFilledAmount);
        expect(fillResults.makerFeePaid).to.bignumber.eq(efr.makerFeePaid);
        expect(fillResults.takerFeePaid).to.bignumber.eq(efr.takerFeePaid);
        // Check balances.
        for (const assetData of Object.keys(efb)) {
            for (const address of Object.keys(efb[assetData])) {
                expect(
                    exchange.getBalanceChange(assetData, address),
                    `checking balance of assetData: ${assetData}, address: ${address}`,
                ).to.bignumber.eq(efb[assetData][address]);
            }
        }
        // Check order info.
        expect(newOrderInfo.orderStatus).to.eq(eoi.orderStatus);
        expect(newOrderInfo.orderTakerAssetFilledAmount).to.bignumber.eq(eoi.orderTakerAssetFilledAmount);
        // Check that there wasn't an overfill.
        expect(newOrderInfo.orderTakerAssetFilledAmount.lte(order.takerAssetAmount), 'checking for overfill').to.be.ok(
            '',
        );
        return {
            fillResults,
            orderInfo: newOrderInfo,
        };
    }

    function calculateExpectedFillResults(
        order: Order,
        orderInfo: OrderInfo,
        takerAssetFillAmount: BigNumber,
    ): FillResults {
        const remainingTakerAssetAmount = order.takerAssetAmount.minus(orderInfo.orderTakerAssetFilledAmount);
        return calculateFillResults(order, BigNumber.min(takerAssetFillAmount, remainingTakerAssetAmount));
    }

    function calculateExpectedOrderInfo(order: Order, orderInfo: OrderInfo, fillResults: FillResults): OrderInfo {
        const orderTakerAssetFilledAmount = orderInfo.orderTakerAssetFilledAmount.plus(
            fillResults.takerAssetFilledAmount,
        );
        const orderStatus = orderTakerAssetFilledAmount.gte(order.takerAssetAmount)
            ? OrderStatus.FullyFilled
            : OrderStatus.Fillable;
        return {
            orderHash: exchange.getOrderHash(order),
            orderStatus,
            orderTakerAssetFilledAmount,
        };
    }

    function calculateExpectedFillBalances(order: Order, fillResults: FillResults): AssetBalances {
        const balances: AssetBalances = {};
        const addBalance = (assetData: string, address: string, amount: BigNumber) => {
            balances[assetData] = balances[assetData] || {};
            const balance = balances[assetData][address] || ZERO_AMOUNT;
            balances[assetData][address] = balance.plus(amount);
        };
        addBalance(order.makerAssetData, order.makerAddress, fillResults.makerAssetFilledAmount.negated());
        addBalance(order.makerAssetData, takerAddress, fillResults.makerAssetFilledAmount);
        addBalance(order.takerAssetData, order.makerAddress, fillResults.takerAssetFilledAmount);
        addBalance(order.takerAssetData, takerAddress, fillResults.takerAssetFilledAmount.negated());
        addBalance(order.makerFeeAssetData, order.makerAddress, fillResults.makerFeePaid.negated());
        addBalance(order.makerFeeAssetData, order.feeRecipientAddress, fillResults.makerFeePaid);
        addBalance(order.takerFeeAssetData, takerAddress, fillResults.takerFeePaid.negated());
        addBalance(order.takerFeeAssetData, order.feeRecipientAddress, fillResults.takerFeePaid);
        return balances;
    }

    function splitAmount(total: BigNumber, n: number = 2): BigNumber[] {
        const splitSize = total.dividedToIntegerBy(n);
        const splits = _.times(n - 1, () => splitSize);
        splits.push(total.minus(splitSize.times(n - 1)));
        return splits;
    }

    describe('full fills', () => {
        it('can fully fill an order', async () => {
            const order = createOrder();
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, order.takerAssetAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it("can't overfill an order", async () => {
            const order = createOrder();
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, order.takerAssetAmount.times(1.01));
            expect(orderInfo.orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it('no fees', async () => {
            const order = createOrder({
                makerFee: ZERO_AMOUNT,
                takerFee: ZERO_AMOUNT,
            });
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, order.takerAssetAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it('only maker fees', async () => {
            const order = createOrder({
                takerFee: ZERO_AMOUNT,
            });
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, order.takerAssetAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it('only taker fees', async () => {
            const order = createOrder({
                makerFee: ZERO_AMOUNT,
            });
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, order.takerAssetAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.FullyFilled);
        });
    });

    describe('partial fills', () => {
        const takerAssetFillAmount = DEFAULT_ORDER.takerAssetAmount.dividedToIntegerBy(2);

        it('can partially fill an order', async () => {
            const order = createOrder();
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, takerAssetFillAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.Fillable);
        });

        it('no fees', async () => {
            const order = createOrder({
                makerFee: ZERO_AMOUNT,
                takerFee: ZERO_AMOUNT,
            });
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, takerAssetFillAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.Fillable);
        });

        it('only maker fees', async () => {
            const order = createOrder({
                takerFee: ZERO_AMOUNT,
            });
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, takerAssetFillAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.Fillable);
        });

        it('only taker fees', async () => {
            const order = createOrder({
                makerFee: ZERO_AMOUNT,
            });
            const { orderInfo } = await fillOrderAndAssertResultsAsync(order, takerAssetFillAmount);
            expect(orderInfo.orderStatus).to.eq(OrderStatus.Fillable);
        });
    });

    describe('multiple fills', () => {
        it('can fully fill an order in two fills', async () => {
            const order = createOrder();
            const fillAmounts = splitAmount(order.takerAssetAmount);
            const orderInfos = [
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[0])).orderInfo,
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[1])).orderInfo,
            ];
            expect(orderInfos[0].orderStatus).to.eq(OrderStatus.Fillable);
            expect(orderInfos[1].orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it('can partially fill an order in two fills', async () => {
            const order = createOrder();
            const fillAmounts = splitAmount(order.takerAssetAmount.dividedToIntegerBy(2));
            const orderInfos = [
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[0])).orderInfo,
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[1])).orderInfo,
            ];
            expect(orderInfos[0].orderStatus).to.eq(OrderStatus.Fillable);
            expect(orderInfos[1].orderStatus).to.eq(OrderStatus.Fillable);
        });

        it("can't overfill an order in two fills", async () => {
            const order = createOrder();
            const fillAmounts = splitAmount(order.takerAssetAmount);
            fillAmounts[0] = fillAmounts[0].times(1.01);
            const orderInfos = [
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[0])).orderInfo,
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[1])).orderInfo,
            ];
            expect(orderInfos[0].orderStatus).to.eq(OrderStatus.Fillable);
            expect(orderInfos[1].orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it('can fully fill an order with no fees in two fills', async () => {
            const order = createOrder({
                makerFee: ZERO_AMOUNT,
                takerFee: ZERO_AMOUNT,
            });
            const fillAmounts = splitAmount(order.takerAssetAmount);
            const orderInfos = [
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[0])).orderInfo,
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[1])).orderInfo,
            ];
            expect(orderInfos[0].orderStatus).to.eq(OrderStatus.Fillable);
            expect(orderInfos[1].orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it('can fully fill an order with only maker fees in two fills', async () => {
            const order = createOrder({
                takerFee: ZERO_AMOUNT,
            });
            const fillAmounts = splitAmount(order.takerAssetAmount);
            const orderInfos = [
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[0])).orderInfo,
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[1])).orderInfo,
            ];
            expect(orderInfos[0].orderStatus).to.eq(OrderStatus.Fillable);
            expect(orderInfos[1].orderStatus).to.eq(OrderStatus.FullyFilled);
        });

        it('can fully fill an order with only taker fees in two fills', async () => {
            const order = createOrder({
                makerFee: ZERO_AMOUNT,
            });
            const fillAmounts = splitAmount(order.takerAssetAmount);
            const orderInfos = [
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[0])).orderInfo,
                (await fillOrderAndAssertResultsAsync(order, fillAmounts[1])).orderInfo,
            ];
            expect(orderInfos[0].orderStatus).to.eq(OrderStatus.Fillable);
            expect(orderInfos[1].orderStatus).to.eq(OrderStatus.FullyFilled);
        });
    });

    describe('bad fills', () => {
        it("can't fill an order with zero takerAssetAmount", async () => {
            const order = createOrder({
                takerAssetAmount: ZERO_AMOUNT,
            });
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                exchange.getOrderHash(order),
                OrderStatus.InvalidTakerAssetAmount,
            );
            return expect(exchange.fillOrderAsync(order, ONE_ETHER)).to.revertWith(expectedError);
        });

        it("can't fill an order with zero makerAssetAmount", async () => {
            const order = createOrder({
                makerAssetAmount: ZERO_AMOUNT,
            });
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                exchange.getOrderHash(order),
                OrderStatus.InvalidMakerAssetAmount,
            );
            return expect(exchange.fillOrderAsync(order, ONE_ETHER)).to.revertWith(expectedError);
        });

        it("can't fill an order that is fully filled", async () => {
            const order = createOrder();
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                exchange.getOrderHash(order),
                OrderStatus.FullyFilled,
            );
            await exchange.fillOrderAsync(order, order.takerAssetAmount);
            return expect(exchange.fillOrderAsync(order, 1)).to.revertWith(expectedError);
        });

        it("can't fill an order that is expired", async () => {
            const order = createOrder({
                expirationTimeSeconds: new BigNumber(getCurrentTime() - 60),
            });
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                exchange.getOrderHash(order),
                OrderStatus.Expired,
            );
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order that is cancelled by `cancelOrder()`", async () => {
            const order = createOrder({
                makerAddress: notTakerAddress,
            });
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                exchange.getOrderHash(order),
                OrderStatus.Cancelled,
            );
            await exchange.cancelOrderAsync(order, { from: notTakerAddress });
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order that is cancelled by `cancelOrdersUpTo()`", async () => {
            const order = createOrder({
                makerAddress: notTakerAddress,
            });
            const expectedError = new ExchangeRevertErrors.OrderStatusError(
                exchange.getOrderHash(order),
                OrderStatus.Cancelled,
            );
            await exchange.cancelOrdersUpToAsync(order.salt, { from: notTakerAddress });
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order if taker is not `takerAddress`", async () => {
            const order = createOrder({
                takerAddress: randomAddress(),
            });
            const expectedError = new ExchangeRevertErrors.InvalidTakerError(
                exchange.getOrderHash(order),
                takerAddress,
            );
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order if sender is not `senderAddress`", async () => {
            const order = createOrder({
                senderAddress: randomAddress(),
            });
            const expectedError = new ExchangeRevertErrors.InvalidSenderError(
                exchange.getOrderHash(order),
                takerAddress,
            );
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order with a taker amount that results in a maker asset rounding error", async () => {
            const order = createOrder({
                makerAssetAmount: new BigNumber(100),
                takerAssetAmount: ONE_ETHER,
            });
            const takerAssetFillAmount = order.takerAssetAmount.dividedToIntegerBy(3);
            const expectedError = new LibMathRevertErrors.RoundingError(
                takerAssetFillAmount,
                order.takerAssetAmount,
                order.makerAssetAmount,
            );
            return expect(exchange.fillOrderAsync(order, takerAssetFillAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order with a taker amount that results in a maker fee rounding error", async () => {
            const order = createOrder({
                makerAssetAmount: ONE_ETHER.times(2),
                takerAssetAmount: ONE_ETHER,
                makerFee: new BigNumber(100),
            });
            const takerAssetFillAmount = order.takerAssetAmount.dividedToIntegerBy(3);
            const expectedError = new LibMathRevertErrors.RoundingError(
                takerAssetFillAmount.times(2),
                order.makerAssetAmount,
                order.makerFee,
            );
            return expect(exchange.fillOrderAsync(order, takerAssetFillAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order with a taker amount that results in a taker fee rounding error", async () => {
            const order = createOrder({
                makerAssetAmount: ONE_ETHER.times(2),
                takerAssetAmount: ONE_ETHER,
                takerFee: new BigNumber(100),
            });
            const takerAssetFillAmount = order.takerAssetAmount.dividedToIntegerBy(3);
            const expectedError = new LibMathRevertErrors.RoundingError(
                takerAssetFillAmount,
                order.takerAssetAmount,
                order.takerFee,
            );
            return expect(exchange.fillOrderAsync(order, takerAssetFillAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order that results in a `makerAssetFilledAmount` overflow.", async () => {
            // All values need to be large to ensure we don't trigger a Rounding.
            const order = createOrder({
                makerAssetAmount: MAX_UINT256_ROOT.times(2),
                takerAssetAmount: MAX_UINT256_ROOT,
            });
            const takerAssetFillAmount = MAX_UINT256_ROOT;
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                takerAssetFillAmount,
                order.makerAssetAmount,
            );
            return expect(exchange.fillOrderAsync(order, takerAssetFillAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order that results in a `makerFeePaid` overflow.", async () => {
            // All values need to be large to ensure we don't trigger a Rounding.
            const order = createOrder({
                makerAssetAmount: MAX_UINT256_ROOT,
                takerAssetAmount: MAX_UINT256_ROOT,
                makerFee: MAX_UINT256_ROOT.times(11),
            });
            const takerAssetFillAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
            const makerAssetFilledAmount = LibReferenceFunctions.getPartialAmountFloor(
                takerAssetFillAmount,
                order.takerAssetAmount,
                order.makerAssetAmount,
            );
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                makerAssetFilledAmount,
                order.makerFee,
            );
            return expect(exchange.fillOrderAsync(order, takerAssetFillAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order that results in a `takerFeePaid` overflow.", async () => {
            // All values need to be large to ensure we don't trigger a Rounding.
            const order = createOrder({
                makerAssetAmount: MAX_UINT256_ROOT,
                takerAssetAmount: MAX_UINT256_ROOT,
                takerFee: MAX_UINT256_ROOT.times(11),
            });
            const takerAssetFillAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                takerAssetFillAmount,
                order.takerFee,
            );
            return expect(exchange.fillOrderAsync(order, takerAssetFillAmount)).to.revertWith(expectedError);
        });

        it("can't fill an order with a bad signature", async () => {
            const order = createOrder();
            const signature = createBadSignature();
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadSignature,
                exchange.getOrderHash(order),
                order.makerAddress,
                signature,
            );
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount, signature)).to.revertWith(
                expectedError,
            );
        });

        it("can't complementary fill an order with a bad signature that is always checked", async () => {
            const order = createOrder();
            const takerAssetFillAmounts = splitAmount(order.takerAssetAmount);
            const goodSignature = createGoodSignature(SignatureType.Wallet);
            const badSignature = createBadSignature(SignatureType.Wallet);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadSignature,
                exchange.getOrderHash(order),
                order.makerAddress,
                badSignature,
            );
            await exchange.fillOrderAsync(order, takerAssetFillAmounts[0], goodSignature);
            return expect(exchange.fillOrderAsync(order, takerAssetFillAmounts[1], badSignature)).to.revertWith(
                expectedError,
            );
        });

        const TRANSFER_ERROR = 'TRANSFER_FAILED';

        it("can't fill an order with a maker asset that fails to transfer", async () => {
            const order = createOrder({
                makerAssetData: createBadAssetData(),
            });
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(TRANSFER_ERROR);
        });

        it("can't fill an order with a taker asset that fails to transfer", async () => {
            const order = createOrder({
                takerAssetData: createBadAssetData(),
            });
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(TRANSFER_ERROR);
        });

        it("can't fill an order with a maker fee asset that fails to transfer", async () => {
            const order = createOrder({
                makerFeeAssetData: createBadAssetData(),
            });
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(TRANSFER_ERROR);
        });

        it("can't fill an order with a taker fee asset that fails to transfer", async () => {
            const order = createOrder({
                takerFeeAssetData: createBadAssetData(),
            });
            return expect(exchange.fillOrderAsync(order, order.takerAssetAmount)).to.revertWith(TRANSFER_ERROR);
        });
    });

    describe('permitted fills', () => {
        it('should allow takerAssetFillAmount to be zero', async () => {
            const order = createOrder();
            return fillOrderAndAssertResultsAsync(order, constants.ZERO_AMOUNT);
        });

        it('can fill an order if taker is `takerAddress`', async () => {
            const order = createOrder({
                takerAddress,
            });
            return fillOrderAndAssertResultsAsync(order, order.takerAssetAmount);
        });

        it('can fill an order if sender is `senderAddress`', async () => {
            const order = createOrder({
                senderAddress: takerAddress,
            });
            return fillOrderAndAssertResultsAsync(order, order.takerAssetAmount);
        });

        it('can complementary fill an order with a bad signature that is checked only once', async () => {
            const order = createOrder();
            const takerAssetFillAmounts = splitAmount(order.takerAssetAmount);
            const goodSignature = createGoodSignature(SignatureType.EthSign);
            const badSignature = createBadSignature(SignatureType.EthSign);
            await fillOrderAndAssertResultsAsync(order, takerAssetFillAmounts[0], goodSignature);
            await fillOrderAndAssertResultsAsync(order, takerAssetFillAmounts[1], badSignature);
        });
    });
});
// tslint:disable: max-file-line-count
