import { ContractTxFunctionObj } from '@0x/base-contract';
import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    blockchainTests,
    constants,
    describe,
    expect,
    getRandomPortion,
    hexRandom,
    orderHashUtils,
} from '@0x/contracts-test-utils';
import { ReferenceFunctions as UtilReferenceFunctions, SafeMathRevertErrors } from '@0x/contracts-utils';
import { FillResults, Order } from '@0x/types';
import { AnyRevertError, BigNumber, ExchangeRevertErrors, StringRevertError } from '@0x/utils';
import { LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import * as ethjs from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import {
    TestFillRoundingContract,
    TestWrapperFunctionsCancelOrderCalledEventArgs as CancelOrderCalledEventArgs,
    TestWrapperFunctionsContract,
    TestWrapperFunctionsFillOrderCalledEventArgs as FillOrderCalledEventArgs,
} from './wrappers';

blockchainTests('Exchange wrapper functions unit tests.', env => {
    const CHAIN_ID = 0x74657374;
    const { ONE_ETHER, MAX_UINT256 } = constants;
    const { addFillResults, getPartialAmountCeil } = LibReferenceFunctions;
    const { safeSub } = UtilReferenceFunctions;
    const protocolFeeMultiplier = new BigNumber(150000);
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomAssetData = () => hexRandom(34);
    const randomAmount = (maxAmount: BigNumber = ONE_ETHER) => maxAmount.times(_.random(0, 100, true).toFixed(12));
    const randomTimestamp = () => new BigNumber(Math.floor(_.now() / 1000) + _.random(0, 34560));
    const randomSalt = () => new BigNumber(hexRandom(constants.WORD_LENGTH).substr(2), 16);
    const ALWAYS_FAILING_SALT = constants.MAX_UINT256;
    const ALWAYS_FAILING_SALT_REVERT_ERROR = new StringRevertError('ALWAYS_FAILING_SALT');
    const EMPTY_FILL_RESULTS = {
        makerAssetFilledAmount: constants.ZERO_AMOUNT,
        takerAssetFilledAmount: constants.ZERO_AMOUNT,
        makerFeePaid: constants.ZERO_AMOUNT,
        takerFeePaid: constants.ZERO_AMOUNT,
        protocolFeePaid: constants.ZERO_AMOUNT,
    };
    let testContract: TestWrapperFunctionsContract;
    let owner: string;
    let senderAddress: string;

    before(async () => {
        [owner, senderAddress] = await env.getAccountAddressesAsync();
        testContract = await TestWrapperFunctionsContract.deployFrom0xArtifactAsync(
            artifacts.TestWrapperFunctions,
            env.provider,
            {
                ...env.txDefaults,
                from: owner,
            },
            {},
        );

        // Set the protocol fee multiplier.
        await testContract.setProtocolFeeMultiplier(protocolFeeMultiplier).awaitTransactionSuccessAsync({
            from: owner,
        });
    });

    function randomOrder(fields?: Partial<Order>): Order {
        return {
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            feeRecipientAddress: randomAddress(),
            senderAddress: randomAddress(),
            takerAssetAmount: randomAmount(),
            makerAssetAmount: randomAmount(),
            makerFee: randomAmount(),
            takerFee: randomAmount(),
            expirationTimeSeconds: randomTimestamp(),
            salt: randomSalt(),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            exchangeAddress: constants.NULL_ADDRESS,
            chainId: CHAIN_ID,
            ...(fields || {}),
        };
    }

    // Computes the expected (fake) fill results from `TestWrapperFunctions` `_fillOrder` implementation.
    function getExpectedFillResults(order: Order, signature: string): FillResults {
        if (order.salt === ALWAYS_FAILING_SALT) {
            return EMPTY_FILL_RESULTS;
        }
        return {
            makerAssetFilledAmount: order.makerAssetAmount,
            takerAssetFilledAmount: order.takerAssetAmount,
            makerFeePaid: order.makerFee,
            takerFeePaid: order.takerFee,
            protocolFeePaid: protocolFeeMultiplier,
        };
    }

    // Creates a deterministic order signature, even though no signature validation
    // actually occurs in the test contract.
    function createOrderSignature(order: Order): string {
        return ethjs.bufferToHex(ethjs.sha3(ethjs.toBuffer(orderHashUtils.getOrderHashHex(order))));
    }

    // Asserts that `_fillOrder()` was called in the same order and with the same
    // arguments as given by examining receipt logs.
    function assertFillOrderCallsFromLogs(logs: LogEntry[], calls: Array<[Order, BigNumber, string]>): void {
        expect(logs.length).to.eq(calls.length);
        for (const i of _.times(calls.length)) {
            const log = (logs[i] as any) as LogWithDecodedArgs<FillOrderCalledEventArgs>;
            const [expectedOrder, expectedTakerAssetFillAmount, expectedSignature] = calls[i];
            expect(log.event).to.eq('FillOrderCalled');
            assertSameOrderFromEvent(log.args.order as any, expectedOrder);
            expect(log.args.takerAssetFillAmount).to.bignumber.eq(expectedTakerAssetFillAmount);
            expect(log.args.signature).to.eq(expectedSignature);
        }
    }

    function assertSameOrderFromEvent(actual: any[], expected: Order): void {
        expect(actual.length === 14);
        expect(actual[0].toLowerCase()).to.be.eq(expected.makerAddress);
        expect(actual[1].toLowerCase()).to.be.eq(expected.takerAddress);
        expect(actual[2].toLowerCase()).to.be.eq(expected.feeRecipientAddress);
        expect(actual[3].toLowerCase()).to.be.eq(expected.senderAddress);
        expect(actual[4]).to.be.bignumber.eq(expected.makerAssetAmount);
        expect(actual[5]).to.be.bignumber.eq(expected.takerAssetAmount);
        expect(actual[6]).to.be.bignumber.eq(expected.makerFee);
        expect(actual[7]).to.be.bignumber.eq(expected.takerFee);
        expect(actual[8]).to.be.bignumber.eq(expected.expirationTimeSeconds);
        expect(actual[9]).to.be.bignumber.eq(expected.salt);
        expect(actual[10]).to.be.eq(expected.makerAssetData);
        expect(actual[11]).to.be.eq(expected.takerAssetData);
        expect(actual[12]).to.be.eq(expected.makerFeeAssetData);
        expect(actual[13]).to.be.eq(expected.takerFeeAssetData);
    }

    describe('fillOrKillOrder', () => {
        it('works if the order is filled by exactly `takerAssetFillAmount`', async () => {
            const fillAmount = randomAmount();
            const order = randomOrder({
                // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
                // the `takerAssetFilledAmount`.
                takerAssetAmount: fillAmount,
            });
            const signature = createOrderSignature(order);
            const expectedResult = getExpectedFillResults(order, signature);
            const expectedCalls = [[order, fillAmount, signature]];
            const contractFn = testContract.fillOrKillOrder(order, fillAmount, signature);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('reverts if the order is filled by less than `takerAssetFillAmount`', async () => {
            const fillAmount = randomAmount();
            const order = randomOrder({
                // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
                // the `takerAssetFilledAmount`.
                takerAssetAmount: fillAmount.minus(1),
            });
            const signature = createOrderSignature(order);
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                fillAmount,
                fillAmount.minus(1),
            );
            const tx = testContract.fillOrKillOrder(order, fillAmount, signature).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if the order is filled by greater than `takerAssetFillAmount`', async () => {
            const fillAmount = randomAmount();
            const order = randomOrder({
                // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
                // the `takerAssetFilledAmount`.
                takerAssetAmount: fillAmount.plus(1),
            });
            const signature = createOrderSignature(order);
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                fillAmount,
                fillAmount.plus(1),
            );
            const tx = testContract.fillOrKillOrder(order, fillAmount, signature).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if `_fillOrder()` reverts', async () => {
            const fillAmount = randomAmount();
            const order = randomOrder({
                salt: ALWAYS_FAILING_SALT,
            });
            const signature = createOrderSignature(order);
            const expectedError = ALWAYS_FAILING_SALT_REVERT_ERROR;
            const tx = testContract.fillOrKillOrder(order, fillAmount, signature).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('fillOrderNoThrow', () => {
        it('calls `fillOrder()` and returns its result', async () => {
            const fillAmount = randomAmount();
            const order = randomOrder();
            const signature = createOrderSignature(order);
            const expectedResult = getExpectedFillResults(order, signature);
            const expectedCalls = [[order, fillAmount, signature]];
            const contractFn = testContract.fillOrderNoThrow(order, fillAmount, signature);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('does not revert if `fillOrder()` reverts', async () => {
            const fillAmount = randomAmount();
            const order = randomOrder({
                salt: ALWAYS_FAILING_SALT,
            });
            const signature = createOrderSignature(order);
            const expectedResult = EMPTY_FILL_RESULTS;
            const contractFn = testContract.fillOrderNoThrow(order, fillAmount, signature);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, []);
        });
    });

    describe('batchFillOrders', () => {
        it('works with no fills', async () => {
            const contractFn = testContract.batchFillOrders([], [], []);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq([]);
            assertFillOrderCallsFromLogs(receipt.logs, []);
        });

        it('works with one fill', async () => {
            const COUNT = 1;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrders(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('works with many fills', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrders(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('works with duplicate orders', async () => {
            const NUM_UNIQUE_ORDERS = 2;
            const COUNT = 4;
            const uniqueOrders = _.times(NUM_UNIQUE_ORDERS, () => randomOrder());
            const orders = _.shuffle(_.flatten(_.times(COUNT / NUM_UNIQUE_ORDERS, () => uniqueOrders)));
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount.dividedToIntegerBy(COUNT));
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrders(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('reverts if there are more orders than fill amounts', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT - 1, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedError = new AnyRevertError(); // Just a generic revert.
            const tx = testContract.batchFillOrders(orders, fillAmounts, signatures).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if there are more orders than signatures', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT - 1, i => createOrderSignature(orders[i]));
            const expectedError = new AnyRevertError(); // Just a generic revert.
            const tx = testContract.batchFillOrders(orders, fillAmounts, signatures).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batchFillOrKillOrders', () => {
        it('works with no fills', async () => {
            const contractFn = testContract.batchFillOrKillOrders([], [], []);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq([]);
            assertFillOrderCallsFromLogs(receipt.logs, []);
        });

        it('works with one fill', async () => {
            const COUNT = 1;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrKillOrders(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('works with many fills', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrKillOrders(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('works with duplicate orders', async () => {
            const NUM_UNIQUE_ORDERS = 2;
            const COUNT = 4;
            const uniqueOrders = _.times(NUM_UNIQUE_ORDERS, () => randomOrder());
            const orders = _.shuffle(_.flatten(_.times(COUNT / NUM_UNIQUE_ORDERS, () => uniqueOrders)));
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrKillOrders(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('reverts if any fill sells less than its takerAssetFillAmount', async () => {
            const COUNT = 8;
            const FAILING_ORDER_INDEX = 6;
            const orders = _.times(COUNT, () => randomOrder());
            const failingOrder = orders[FAILING_ORDER_INDEX];
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const failingAmount = fillAmounts[FAILING_ORDER_INDEX];
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
            // the `takerAssetFilledAmount`.
            failingOrder.takerAssetAmount = failingOrder.takerAssetAmount.minus(1);
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                failingAmount,
                failingAmount.minus(1),
            );
            const tx = testContract
                .batchFillOrKillOrders(orders, fillAmounts, signatures)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if any fill sells more than its takerAssetFillAmount', async () => {
            const COUNT = 8;
            const FAILING_ORDER_INDEX = 6;
            const orders = _.times(COUNT, () => randomOrder());
            const failingOrder = orders[FAILING_ORDER_INDEX];
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const failingAmount = fillAmounts[FAILING_ORDER_INDEX];
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
            // the `takerAssetFilledAmount`.
            failingOrder.takerAssetAmount = failingOrder.takerAssetAmount.plus(1);
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                failingAmount,
                failingAmount.plus(1),
            );
            const tx = testContract
                .batchFillOrKillOrders(orders, fillAmounts, signatures)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if there are more orders than fill amounts', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT - 1, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedError = new AnyRevertError(); // Just a generic revert.
            const tx = testContract
                .batchFillOrKillOrders(orders, fillAmounts, signatures)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if there are more orders than signatures', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT - 1, i => createOrderSignature(orders[i]));
            const expectedError = new AnyRevertError(); // Just a generic revert.
            const tx = testContract
                .batchFillOrKillOrders(orders, fillAmounts, signatures)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batchFillOrdersNoThrow', () => {
        it('works with no fills', async () => {
            const contractFn = testContract.batchFillOrdersNoThrow([], [], []);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq([]);
            assertFillOrderCallsFromLogs(receipt.logs, []);
        });

        it('works with one fill', async () => {
            const COUNT = 1;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrdersNoThrow(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('works with many fills', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrdersNoThrow(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('works with duplicate orders', async () => {
            const NUM_UNIQUE_ORDERS = 2;
            const COUNT = 4;
            const uniqueOrders = _.times(NUM_UNIQUE_ORDERS, () => randomOrder());
            const orders = _.shuffle(_.flatten(_.times(COUNT / NUM_UNIQUE_ORDERS, () => uniqueOrders)));
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount.dividedToIntegerBy(COUNT));
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            const contractFn = testContract.batchFillOrdersNoThrow(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('works if a fill fails', async () => {
            const COUNT = 8;
            const FAILING_ORDER_INDEX = 6;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const failingOrder = orders[FAILING_ORDER_INDEX];
            failingOrder.salt = ALWAYS_FAILING_SALT;
            const expectedResult = _.times(COUNT, i => getExpectedFillResults(orders[i], signatures[i]));
            const expectedCalls = _.zip(orders, fillAmounts, signatures);
            expectedCalls.splice(FAILING_ORDER_INDEX, 1);
            const contractFn = testContract.batchFillOrdersNoThrow(orders, fillAmounts, signatures);
            const actualResult = await contractFn.callAsync();
            const receipt = await contractFn.awaitTransactionSuccessAsync();
            expect(actualResult).to.deep.eq(expectedResult);
            assertFillOrderCallsFromLogs(receipt.logs, expectedCalls as any);
        });

        it('reverts if there are more orders than fill amounts', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT - 1, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
            const expectedError = new AnyRevertError(); // Just a generic revert.
            const tx = testContract
                .batchFillOrdersNoThrow(orders, fillAmounts, signatures)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if there are more orders than signatures', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder());
            const fillAmounts = _.times(COUNT, i => orders[i].takerAssetAmount);
            const signatures = _.times(COUNT - 1, i => createOrderSignature(orders[i]));
            const expectedError = new AnyRevertError(); // Just a generic revert.
            const tx = testContract
                .batchFillOrdersNoThrow(orders, fillAmounts, signatures)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    type ExpectedFillOrderCallArgs = [Order, BigNumber, string];
    type MarketSellBuyArgs = [Order[], BigNumber, string[], ...any[]];
    type MarketSellBuyContractFn = (...args: MarketSellBuyArgs) => ContractTxFunctionObj<FillResults>;
    type MarketSellBuySimulator = (...args: MarketSellBuyArgs) => [FillResults, ExpectedFillOrderCallArgs[]];

    describe('marketSell*', () => {
        function defineCommonMarketSellOrdersTests(
            getContractFn: () => MarketSellBuyContractFn,
            simulator: MarketSellBuySimulator,
        ): void {
            it('works with one order', async () => {
                const COUNT = 1;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, takerAssetFillAmount, signatures);
                expect(expectedCalls.length).to.eq(COUNT);
                const fnWithArgs = getContractFn()(orders, takerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('works with many orders', async () => {
                const COUNT = 8;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, takerAssetFillAmount, signatures);
                expect(expectedCalls.length).to.eq(COUNT);
                const fnWithArgs = getContractFn()(orders, takerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('works with duplicate orders', async () => {
                const NUM_UNIQUE_ORDERS = 2;
                const COUNT = 4;
                const uniqueOrders = _.times(NUM_UNIQUE_ORDERS, () => randomOrder());
                const orders = _.shuffle(_.flatten(_.times(COUNT / NUM_UNIQUE_ORDERS, () => uniqueOrders)));
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, takerAssetFillAmount, signatures);
                expect(expectedCalls.length).to.eq(COUNT);
                const fnWithArgs = getContractFn()(orders, takerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('stops when filled == `takerAssetFillAmount`', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                // Skip the last order in our `takerAssetFillAmount` calculation.
                const takerAssetFillAmount = _.reduce(
                    orders.slice(0, COUNT - 1),
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, takerAssetFillAmount, signatures);
                // It should stop filling after the penultimate order.
                expect(expectedCalls.length).to.eq(COUNT - 1);
                const fnWithArgs = getContractFn()(orders, takerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('stops when filled > `takerAssetFillAmount`', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                // Because `TestWrapperFunctions` always fills `takerAssetAmount`
                // setting the first order's `takerAssetAmount` to larger than
                // `takerAssetFillAmount` will cause an overfill.
                orders[0].takerAssetAmount = takerAssetFillAmount.plus(1);
                const [expectedResult, expectedCalls] = simulator(orders, takerAssetFillAmount, signatures);
                // It should stop filling after first order.
                expect(expectedCalls.length).to.eq(1);
                const fnWithArgs = getContractFn()(orders, takerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('reverts when an overflow occurs when summing fill results', async () => {
                const COUNT = 2;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                orders[1].takerAssetAmount = MAX_UINT256;
                const takerAssetFillAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                    orders[0].takerAssetAmount,
                    orders[1].takerAssetAmount,
                );
                const tx = getContractFn()(orders, takerAssetFillAmount, signatures).awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('returns empty fill results with no orders', async () => {
                const [expectedResult, expectedCalls] = simulator([], constants.ZERO_AMOUNT, []);
                expect(expectedCalls.length).to.eq(0);
                const fnWithArgs = getContractFn()([], constants.ZERO_AMOUNT, []);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });
        }

        function simulateMarketSellOrders(
            orders: Order[],
            takerAssetFillAmount: BigNumber,
            signatures: string[],
        ): [FillResults, ExpectedFillOrderCallArgs[]] {
            const fillOrderCalls = [];
            let fillResults = _.cloneDeep(EMPTY_FILL_RESULTS);
            for (const [order, signature] of _.zip(orders, signatures) as [[Order, string]]) {
                const remainingTakerAssetFillAmount = safeSub(takerAssetFillAmount, fillResults.takerAssetFilledAmount);
                if (order.salt !== ALWAYS_FAILING_SALT) {
                    fillOrderCalls.push([order, remainingTakerAssetFillAmount, signature]);
                }
                fillResults = addFillResults(fillResults, getExpectedFillResults(order, signature));
                if (fillResults.takerAssetFilledAmount.gte(takerAssetFillAmount)) {
                    break;
                }
            }
            return [fillResults, fillOrderCalls as any];
        }

        describe('marketSellOrdersNoThrow', () => {
            defineCommonMarketSellOrdersTests(
                () => testContract.marketSellOrdersNoThrow.bind(testContract),
                simulateMarketSellOrders,
            );

            it('works when any fills revert', async () => {
                const COUNT = 4;
                const BAD_ORDERS_COUNT = 2;
                const orders = _.times(COUNT, () => randomOrder());
                const badOrders = _.sampleSize(orders, BAD_ORDERS_COUNT);
                for (const order of badOrders) {
                    order.salt = ALWAYS_FAILING_SALT;
                }
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulateMarketSellOrders(
                    orders,
                    takerAssetFillAmount,
                    signatures,
                );
                expect(expectedCalls.length).to.eq(COUNT - BAD_ORDERS_COUNT);
                const contractFn = testContract.marketSellOrdersNoThrow(orders, takerAssetFillAmount, signatures);
                const actualResult = await contractFn.callAsync();
                const receipt = await contractFn.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('works when all fills revert', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder({ salt: ALWAYS_FAILING_SALT }));
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulateMarketSellOrders(
                    orders,
                    takerAssetFillAmount,
                    signatures,
                );
                expect(expectedCalls.length).to.eq(0);
                const contractFn = testContract.marketSellOrdersNoThrow(orders, takerAssetFillAmount, signatures);
                const actualResult = await contractFn.callAsync();
                const receipt = await contractFn.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });
        });

        describe('marketSellOrdersFillOrKill', () => {
            defineCommonMarketSellOrdersTests(
                () => testContract.marketSellOrdersNoThrow.bind(testContract),
                simulateMarketSellOrders,
            );

            it('reverts when filled < `takerAssetFillAmount`', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                ).plus(1);
                const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                    ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteMarketSellOrders,
                    takerAssetFillAmount,
                    takerAssetFillAmount.minus(1),
                );
                const tx = testContract
                    .marketSellOrdersFillOrKill(orders, takerAssetFillAmount, signatures)
                    .awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('works when fills fail but can still sell `takerAssetFillAmount`', async () => {
                const COUNT = 4;
                const BAD_ORDERS_COUNT = 2;
                const orders = _.times(COUNT, () => randomOrder());
                const badOrders = _.sampleSize(orders, BAD_ORDERS_COUNT);
                for (const order of badOrders) {
                    order.salt = ALWAYS_FAILING_SALT;
                }
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                ).minus(_.reduce(badOrders, (total, o) => o.takerAssetAmount.plus(total), constants.ZERO_AMOUNT));
                const [expectedResult, expectedCalls] = simulateMarketSellOrders(
                    orders,
                    takerAssetFillAmount,
                    signatures,
                );
                expect(expectedCalls.length).to.eq(COUNT - BAD_ORDERS_COUNT);
                const contractFn = testContract.marketSellOrdersFillOrKill(orders, takerAssetFillAmount, signatures);
                const actualResult = await contractFn.callAsync();
                const receipt = await contractFn.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('reverts when a failed fill results in selling less than `takerAssetFillAmount`', async () => {
                const COUNT = 4;
                const BAD_ORDERS_COUNT = 2;
                const orders = _.times(COUNT, () => randomOrder());
                const badOrders = _.sampleSize(orders, BAD_ORDERS_COUNT);
                for (const order of badOrders) {
                    order.salt = ALWAYS_FAILING_SALT;
                }
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const badOrdersAmount = _.reduce(
                    badOrders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const takerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.takerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                )
                    .minus(badOrdersAmount)
                    .plus(1);
                const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                    ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteMarketSellOrders,
                    takerAssetFillAmount,
                    takerAssetFillAmount.minus(1),
                );
                const tx = testContract
                    .marketSellOrdersFillOrKill(orders, takerAssetFillAmount, signatures)
                    .awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });
        });
    });

    describe('marketBuy*', () => {
        function defineCommonMarketBuyOrdersTests(
            getContractFn: () => MarketSellBuyContractFn,
            simulator: MarketSellBuySimulator,
        ): void {
            it('works with one order', async () => {
                const COUNT = 1;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, makerAssetFillAmount, signatures);
                expect(expectedCalls.length).to.eq(COUNT);
                const fnWithArgs = getContractFn()(orders, makerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();

                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('works with many orders', async () => {
                const COUNT = 8;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, makerAssetFillAmount, signatures);
                expect(expectedCalls.length).to.eq(COUNT);
                const fnWithArgs = getContractFn()(orders, makerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('works with duplicate orders', async () => {
                const NUM_UNIQUE_ORDERS = 2;
                const COUNT = 4;
                const uniqueOrders = _.times(NUM_UNIQUE_ORDERS, () => randomOrder());
                const orders = _.shuffle(_.flatten(_.times(COUNT / NUM_UNIQUE_ORDERS, () => uniqueOrders)));
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, makerAssetFillAmount, signatures);
                expect(expectedCalls.length).to.eq(COUNT);
                const fnWithArgs = getContractFn()(orders, makerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('stops when filled == `makerAssetFillAmount`', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                // Skip the last order in our `makerAssetFillAmount` calculation.
                const makerAssetFillAmount = _.reduce(
                    orders.slice(0, COUNT - 1),
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulator(orders, makerAssetFillAmount, signatures);
                // It should stop filling after the penultimate order.
                expect(expectedCalls.length).to.eq(COUNT - 1);
                const fnWithArgs = getContractFn()(orders, makerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('stops when filled > `makerAssetFillAmount`', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                // Because `TestWrapperFunctions` always fills `makerAssetAmount`
                // setting the first order's `makerAssetAmount` to larger than
                // `makerAssetFillAmount` will cause an overfill.
                orders[0].makerAssetAmount = makerAssetFillAmount.plus(1);
                const [expectedResult, expectedCalls] = simulator(orders, makerAssetFillAmount, signatures);
                // It should stop filling after first order.
                expect(expectedCalls.length).to.eq(1);
                const fnWithArgs = getContractFn()(orders, makerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('reverts when an overflow occurs when computing `remainingTakerAssetFillAmount`', async () => {
                const orders = [randomOrder({ takerAssetAmount: MAX_UINT256 })];
                const signatures = _.times(orders.length, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = new BigNumber(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    orders[0].takerAssetAmount,
                    makerAssetFillAmount,
                );
                const tx = getContractFn()(orders, makerAssetFillAmount, signatures).awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it("reverts when an order's `makerAssetAmount` is zero", async () => {
                const orders = [randomOrder({ makerAssetAmount: constants.ZERO_AMOUNT })];
                const signatures = _.times(orders.length, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = ONE_ETHER;
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                    constants.ZERO_AMOUNT,
                    new BigNumber(1),
                );
                const tx = getContractFn()(orders, makerAssetFillAmount, signatures).awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('reverts when an overflow occurs when summing fill results', async () => {
                const orders = [
                    randomOrder({
                        takerAssetAmount: new BigNumber(1),
                        makerAssetAmount: new BigNumber(1),
                    }),
                    randomOrder({
                        takerAssetAmount: new BigNumber(1),
                        makerAssetAmount: MAX_UINT256,
                    }),
                ];
                const signatures = _.times(orders.length, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = new BigNumber(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                    orders[0].makerAssetAmount,
                    orders[1].makerAssetAmount,
                );
                const tx = getContractFn()(orders, makerAssetFillAmount, signatures).awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('returns empty fill results with no orders', async () => {
                const [expectedResult, expectedCalls] = simulator([], constants.ZERO_AMOUNT, []);
                expect(expectedCalls.length).to.eq(0);
                const fnWithArgs = getContractFn()([], constants.ZERO_AMOUNT, []);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });
        }

        function simulateMarketBuyOrdersNoThrow(
            orders: Order[],
            makerAssetFillAmount: BigNumber,
            signatures: string[],
        ): [FillResults, ExpectedFillOrderCallArgs[]] {
            const fillOrderCalls = [];
            let fillResults = _.cloneDeep(EMPTY_FILL_RESULTS);
            for (const [order, signature] of _.zip(orders, signatures) as [[Order, string]]) {
                const remainingMakerAssetFillAmount = safeSub(makerAssetFillAmount, fillResults.makerAssetFilledAmount);
                const remainingTakerAssetFillAmount = getPartialAmountCeil(
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                    remainingMakerAssetFillAmount,
                );
                if (order.salt !== ALWAYS_FAILING_SALT) {
                    fillOrderCalls.push([order, remainingTakerAssetFillAmount, signature]);
                }
                fillResults = addFillResults(fillResults, getExpectedFillResults(order, signature));
                if (fillResults.makerAssetFilledAmount.gte(makerAssetFillAmount)) {
                    break;
                }
            }
            return [fillResults, fillOrderCalls as any];
        }

        describe('marketBuyOrdersNoThrow', () => {
            defineCommonMarketBuyOrdersTests(
                () => testContract.marketBuyOrdersNoThrow.bind(testContract),
                simulateMarketBuyOrdersNoThrow,
            );

            it('works when any fills revert', async () => {
                const COUNT = 4;
                const BAD_ORDERS_COUNT = 2;
                const orders = _.times(COUNT, () => randomOrder());
                const badOrders = _.sampleSize(orders, BAD_ORDERS_COUNT);
                for (const order of badOrders) {
                    order.salt = ALWAYS_FAILING_SALT;
                }
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulateMarketBuyOrdersNoThrow(
                    orders,
                    makerAssetFillAmount,
                    signatures,
                );
                expect(expectedCalls.length).to.eq(COUNT - BAD_ORDERS_COUNT);
                const contractFn = testContract.marketBuyOrdersNoThrow(orders, makerAssetFillAmount, signatures);
                const actualResult = await contractFn.callAsync();
                const receipt = await contractFn.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('works when all fills revert', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder({ salt: ALWAYS_FAILING_SALT }));
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const [expectedResult, expectedCalls] = simulateMarketBuyOrdersNoThrow(
                    orders,
                    makerAssetFillAmount,
                    signatures,
                );
                expect(expectedCalls.length).to.eq(0);
                const contractFn = testContract.marketBuyOrdersNoThrow(orders, makerAssetFillAmount, signatures);
                const actualResult = await contractFn.callAsync();
                const receipt = await contractFn.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            describe('partial fills', () => {
                let roundingTestContract: TestFillRoundingContract;
                // Use another test contract with `_fillOrder()` preserved so the
                // correct fill results are returned and we can test partial fills.
                // TODO(dorothy-zbornak): Consolidate these contracts into one.
                before(async () => {
                    roundingTestContract = await TestFillRoundingContract.deployFrom0xArtifactAsync(
                        artifacts.TestFillRounding,
                        env.provider,
                        {
                            ...env.txDefaults,
                        },
                        {},
                    );
                });

                it('small quantities', async () => {
                    const orders = [
                        randomOrder({
                            makerAssetAmount: new BigNumber(30000),
                            takerAssetAmount: new BigNumber(20000),
                        }),
                    ];
                    const signatures = [hexRandom()];
                    const fillAmount = new BigNumber(10000);
                    const fillResults = await roundingTestContract
                        .marketBuyOrdersNoThrow(orders, fillAmount, signatures)
                        .callAsync();
                    expect(fillResults.makerAssetFilledAmount).to.bignumber.eq(10000);
                });

                it('large quantities', async () => {
                    const orders = [
                        randomOrder({
                            makerAssetAmount: new BigNumber('21400000000000000000'),
                            takerAssetAmount: new BigNumber('6300000000000000000'),
                        }),
                    ];
                    const signatures = [hexRandom()];
                    const fillAmount = new BigNumber('2400000000000000000');
                    const fillResults = await roundingTestContract
                        .marketBuyOrdersNoThrow(orders, fillAmount, signatures)
                        .callAsync();
                    expect(fillResults.makerAssetFilledAmount).to.bignumber.eq('2400000000000000002');
                });

                it('large full precision quantities', async () => {
                    const orders = [
                        randomOrder({
                            makerAssetAmount: new BigNumber('942848588381848588533'),
                            takerAssetAmount: new BigNumber('103048102885858024121'),
                        }),
                    ];
                    const signatures = [hexRandom()];
                    const fillAmount = new BigNumber('84819838457312347759');
                    const fillResults = await roundingTestContract
                        .marketBuyOrdersNoThrow(orders, fillAmount, signatures)
                        .callAsync();
                    expect(fillResults.makerAssetFilledAmount).to.bignumber.eq('84819838457312347760');
                });

                describe.optional('full precision fuzzing', () => {
                    const FUZZ_COUNT = 256;
                    for (const i of _.times(FUZZ_COUNT)) {
                        it(`${i + 1}/${FUZZ_COUNT}`, async () => {
                            const ordersCount = _.random(1, 10);
                            const orders = _.times(ordersCount, () => randomOrder());
                            const signatures = orders.map(() => hexRandom());
                            const totalMakerAssetAmount = BigNumber.sum(...orders.map(o => o.makerAssetAmount));
                            const fillAmount = getRandomPortion(totalMakerAssetAmount);
                            const fillResults = await roundingTestContract
                                .marketBuyOrdersNoThrow(orders, fillAmount, signatures)
                                .callAsync();
                            expect(fillResults.makerAssetFilledAmount).to.bignumber.gte(fillAmount);
                        });
                    }
                });
            });
        });

        describe('marketBuyOrdersFillOrKill', () => {
            defineCommonMarketBuyOrdersTests(
                () => testContract.marketBuyOrdersFillOrKill.bind(testContract),
                simulateMarketBuyOrdersNoThrow,
            );

            it('reverts when filled < `makerAssetFillAmount`', async () => {
                const COUNT = 4;
                const orders = _.times(COUNT, () => randomOrder());
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                ).plus(1);
                const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                    ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteMarketBuyOrders,
                    makerAssetFillAmount,
                    makerAssetFillAmount.minus(1),
                );
                const tx = testContract
                    .marketBuyOrdersFillOrKill(orders, makerAssetFillAmount, signatures)
                    .awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('works when fills fail but can still buy `makerAssetFillAmount`', async () => {
                const COUNT = 4;
                const BAD_ORDERS_COUNT = 2;
                const orders = _.times(COUNT, () => randomOrder());
                const badOrders = _.sampleSize(orders, BAD_ORDERS_COUNT);
                for (const order of badOrders) {
                    order.salt = ALWAYS_FAILING_SALT;
                }
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                ).minus(_.reduce(badOrders, (total, o) => o.makerAssetAmount.plus(total), constants.ZERO_AMOUNT));
                const [expectedResult, expectedCalls] = simulateMarketBuyOrdersNoThrow(
                    orders,
                    makerAssetFillAmount,
                    signatures,
                );
                expect(expectedCalls.length).to.eq(COUNT - BAD_ORDERS_COUNT);
                const fnWithArgs = testContract.marketBuyOrdersFillOrKill(orders, makerAssetFillAmount, signatures);
                const actualResult = await fnWithArgs.callAsync();
                const receipt = await fnWithArgs.awaitTransactionSuccessAsync();
                expect(actualResult).to.deep.eq(expectedResult);
                assertFillOrderCallsFromLogs(receipt.logs, expectedCalls);
            });

            it('reverts when a failed fill results in buying less than `makerAssetFillAmount`', async () => {
                const COUNT = 4;
                const BAD_ORDERS_COUNT = 2;
                const orders = _.times(COUNT, () => randomOrder());
                const badOrders = _.sampleSize(orders, BAD_ORDERS_COUNT);
                for (const order of badOrders) {
                    order.salt = ALWAYS_FAILING_SALT;
                }
                const signatures = _.times(COUNT, i => createOrderSignature(orders[i]));
                const badOrdersAmount = _.reduce(
                    badOrders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                );
                const makerAssetFillAmount = _.reduce(
                    orders,
                    (total, o) => o.makerAssetAmount.plus(total),
                    constants.ZERO_AMOUNT,
                )
                    .minus(badOrdersAmount)
                    .plus(1);
                const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                    ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteMarketBuyOrders,
                    makerAssetFillAmount,
                    makerAssetFillAmount.minus(1),
                );
                const tx = testContract
                    .marketBuyOrdersFillOrKill(orders, makerAssetFillAmount, signatures)
                    .awaitTransactionSuccessAsync();
                return expect(tx).to.revertWith(expectedError);
            });
        });
    });

    describe('batchCancelOrders', () => {
        // Asserts that `_cancelOrder()` was called in the same order and with the same
        // arguments as given by examining receipt logs.
        function assertCancelOrderCallsFromLogs(logs: LogEntry[], calls: Order[]): void {
            expect(logs.length).to.eq(calls.length);
            for (const i of _.times(calls.length)) {
                const log = (logs[i] as any) as LogWithDecodedArgs<CancelOrderCalledEventArgs>;
                const expectedOrder = calls[i];
                expect(log.event).to.eq('CancelOrderCalled');
                assertSameOrderFromEvent(log.args.order as any, expectedOrder);
            }
        }

        it('works with no orders', async () => {
            const { logs } = await testContract.batchCancelOrders([]).awaitTransactionSuccessAsync();
            assertCancelOrderCallsFromLogs(logs, []);
        });

        it('works with many orders', async () => {
            const COUNT = 8;
            const orders = _.times(COUNT, () => randomOrder({ makerAddress: senderAddress }));
            const { logs } = await testContract.batchCancelOrders(orders).awaitTransactionSuccessAsync();
            assertCancelOrderCallsFromLogs(logs, orders);
        });

        it('works with duplicate orders', async () => {
            const UNIQUE_ORDERS = 2;
            const COUNT = 6;
            const uniqueOrders = _.times(UNIQUE_ORDERS, () => randomOrder({ makerAddress: senderAddress }));
            const orders = _.shuffle(_.flatten(_.times(COUNT / UNIQUE_ORDERS, () => uniqueOrders)));
            const { logs } = await testContract.batchCancelOrders(orders).awaitTransactionSuccessAsync();
            assertCancelOrderCallsFromLogs(logs, orders);
        });

        it('reverts if one `_cancelOrder()` reverts', async () => {
            const COUNT = 8;
            const FAILING_ORDER_INDEX = 4;
            const orders = _.times(COUNT, () => randomOrder({ makerAddress: senderAddress }));
            const failingOrder = orders[FAILING_ORDER_INDEX];
            failingOrder.salt = ALWAYS_FAILING_SALT;
            const expectedError = ALWAYS_FAILING_SALT_REVERT_ERROR;
            const tx = testContract.batchCancelOrders(orders).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
// tslint:disable-next-line: max-file-line-count
