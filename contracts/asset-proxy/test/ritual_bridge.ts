import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    randomAddress,
    toBaseUnitAmount,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { AbiEncoder, BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from './artifacts';

import { TestRitualBridgeContract, TestRitualBridgeEvents } from './wrappers';

interface RecurringBuy {
    sellAmount: BigNumber;
    interval: BigNumber;
    minBuyAmount: BigNumber;
    maxSlippageBps: BigNumber;
    currentBuyWindowStart: BigNumber;
    currentIntervalAmountSold: BigNumber;
    unwrapWeth: boolean;
}

const NULL_RECURRING_BUY: RecurringBuy = {
    sellAmount: constants.ZERO_AMOUNT,
    interval: constants.ZERO_AMOUNT,
    minBuyAmount: constants.ZERO_AMOUNT,
    maxSlippageBps: constants.ZERO_AMOUNT,
    currentBuyWindowStart: constants.ZERO_AMOUNT,
    currentIntervalAmountSold: constants.ZERO_AMOUNT,
    unwrapWeth: false,
};
const ONE_DAY_IN_SECONDS = new BigNumber(24 * 60 * 60);
const BUY_WINDOW_LENGTH = ONE_DAY_IN_SECONDS;
const MIN_INTERVAL_LENGTH = ONE_DAY_IN_SECONDS;

const randomAssetData = () => hexUtils.random(36);
const randomAmount = () => getRandomInteger(0, constants.MAX_UINT256);
const randomTimestamp = () => new BigNumber(Math.floor(_.now() / 1000) + _.random(0, 34560));
const randomSalt = () => new BigNumber(hexUtils.random(constants.WORD_LENGTH).substr(2), 16);

function randomRecurringBuy(): RecurringBuy {
    const sellAmount = getRandomInteger(1, constants.MAX_UINT256);
    return {
        sellAmount,
        interval: getRandomInteger(MIN_INTERVAL_LENGTH, constants.MAX_UINT256),
        minBuyAmount: randomAmount(),
        maxSlippageBps: randomAmount(),
        currentBuyWindowStart: randomTimestamp(),
        currentIntervalAmountSold: constants.ZERO_AMOUNT,
        unwrapWeth: false,
    };
}

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
        chainId: 1337,
        ...(fields || {}),
    };
}

blockchainTests.only('RitualBridge unit tests', env => {
    let weth: WETH9Contract;
    let sellToken: DummyERC20TokenContract;
    let buyToken: DummyERC20TokenContract;
    let ritualBridge: TestRitualBridgeContract;
    let recurringBuyer: string;
    let taker: string;
    let recurringBuyId: string;

    before(async () => {
        weth = await WETH9Contract.deployFrom0xArtifactAsync(
            erc20Artifacts.WETH9,
            env.provider,
            env.txDefaults,
            erc20Artifacts,
        );
        [sellToken, buyToken] = await Promise.all(
            _.times(2, () =>
                DummyERC20TokenContract.deployFrom0xArtifactAsync(
                    erc20Artifacts.DummyERC20Token,
                    env.provider,
                    env.txDefaults,
                    erc20Artifacts,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
                    constants.DUMMY_TOKEN_DECIMALS,
                    constants.DUMMY_TOKEN_TOTAL_SUPPLY,
                ),
            ),
        );
        ritualBridge = await TestRitualBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestRitualBridge,
            env.provider,
            env.txDefaults,
            artifacts,
            weth.address,
        );
        [, recurringBuyer, taker] = await env.getAccountAddressesAsync();
        await sellToken
            .approve(ritualBridge.address, constants.INITIAL_ERC20_ALLOWANCE)
            .awaitTransactionSuccessAsync({ from: recurringBuyer });
        await sellToken.setBalance(recurringBuyer, constants.INITIAL_ERC20_BALANCE).awaitTransactionSuccessAsync();
        await buyToken.setBalance(taker, constants.INITIAL_ERC20_BALANCE).awaitTransactionSuccessAsync();
        await buyToken
            .approve(await ritualBridge.getExchangeAddress().callAsync(), constants.INITIAL_ERC20_ALLOWANCE)
            .awaitTransactionSuccessAsync({ from: taker });
    });

    describe('isValidSignature()', () => {
        it('returns success bytes', async () => {
            const LEGACY_WALLET_MAGIC_VALUE = '0xb0671381';
            const result = await ritualBridge
                .isValidSignature(hexUtils.random(), hexUtils.random(_.random(0, 32)))
                .callAsync();
            expect(result).to.eq(LEGACY_WALLET_MAGIC_VALUE);
        });
    });

    describe('setRecurringBuy()', () => {
        it('reverts if interval < 1 day', async () => {
            const tx = ritualBridge
                .setRecurringBuy(
                    sellToken.address,
                    buyToken.address,
                    getRandomInteger(1, constants.MAX_UINT256),
                    ONE_DAY_IN_SECONDS.minus(1),
                    constants.ZERO_AMOUNT,
                    constants.MAX_UINT256,
                    false,
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith('RitualBridge::setRecurringBuy/INTERVAL_TOO_SHORT');
        });
        it('reverts if sellToken == buyToken', async () => {
            const tx = ritualBridge
                .setRecurringBuy(
                    sellToken.address,
                    sellToken.address,
                    getRandomInteger(1, constants.MAX_UINT256),
                    getRandomInteger(MIN_INTERVAL_LENGTH, constants.MAX_UINT256),
                    constants.ZERO_AMOUNT,
                    constants.MAX_UINT256,
                    false,
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith('RitualBridge::setRecurringBuy/INVALID_TOKEN_PAIR');
        });
        it('sets recurringBuys entry', async () => {
            const expectedEntry = randomRecurringBuy();
            const call = ritualBridge.setRecurringBuy(
                sellToken.address,
                buyToken.address,
                expectedEntry.sellAmount,
                expectedEntry.interval,
                expectedEntry.minBuyAmount,
                expectedEntry.maxSlippageBps,
                expectedEntry.unwrapWeth,
                [],
                [],
            );
            const [id, amountBought] = await call.callAsync({ from: recurringBuyer });
            expect(amountBought).to.bignumber.equal(constants.ZERO_AMOUNT);
            await call.awaitTransactionSuccessAsync({ from: recurringBuyer });
            const actualEntry = NULL_RECURRING_BUY;
            [
                actualEntry.sellAmount,
                actualEntry.interval,
                actualEntry.minBuyAmount,
                actualEntry.maxSlippageBps,
                actualEntry.currentBuyWindowStart,
                actualEntry.currentIntervalAmountSold,
                actualEntry.unwrapWeth,
            ] = await ritualBridge.recurringBuys(id).callAsync();

            expectedEntry.currentBuyWindowStart = new BigNumber(await env.web3Wrapper.getBlockTimestampAsync('latest'));
            expect(actualEntry).to.deep.equal(expectedEntry);
            recurringBuyId = id;
        });
        it('updates recurringBuys entry', async () => {
            const expectedEntry = randomRecurringBuy();
            await ritualBridge
                .setRecurringBuy(
                    sellToken.address,
                    buyToken.address,
                    expectedEntry.sellAmount,
                    expectedEntry.interval,
                    expectedEntry.minBuyAmount,
                    expectedEntry.maxSlippageBps,
                    expectedEntry.unwrapWeth,
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync({ from: recurringBuyer });
            const actualEntry = NULL_RECURRING_BUY;
            [
                actualEntry.sellAmount,
                actualEntry.interval,
                actualEntry.minBuyAmount,
                actualEntry.maxSlippageBps,
                actualEntry.currentBuyWindowStart,
                actualEntry.currentIntervalAmountSold,
                actualEntry.unwrapWeth,
            ] = await ritualBridge.recurringBuys(recurringBuyId).callAsync();
            expectedEntry.currentBuyWindowStart = new BigNumber(await env.web3Wrapper.getBlockTimestampAsync('latest'));
            expect(actualEntry).to.deep.equal(expectedEntry);
        });
        it('calls Exchange.marketSellOrdersNoThrow if orders are provided', async () => {
            const order = randomOrder({
                makerAddress: taker,
                makerAssetData: assetDataUtils.encodeERC20AssetData(buyToken.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(sellToken.address),
                makerAssetAmount: toBaseUnitAmount(1),
                takerAssetAmount: toBaseUnitAmount(1),
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const params = { ...randomRecurringBuy(), sellAmount: constants.ONE_ETHER };
            const msgValue = new BigNumber(1337);
            const tx = await ritualBridge
                .setRecurringBuy(
                    sellToken.address,
                    buyToken.address,
                    params.sellAmount,
                    params.interval,
                    params.minBuyAmount,
                    params.maxSlippageBps,
                    params.unwrapWeth,
                    [order],
                    ['0x'],
                )
                .awaitTransactionSuccessAsync({ from: recurringBuyer, value: msgValue });
            verifyEventsFromLogs(
                tx.logs,
                [{ takerAssetFillAmount: params.sellAmount, msgValue }],
                TestRitualBridgeEvents.MarketSellCalled,
            );
        });
    });
    describe('cancelRecurringBuy()', () => {
        it('deletes recurringBuys entry', async () => {
            await ritualBridge
                .cancelRecurringBuy(sellToken.address, buyToken.address)
                .awaitTransactionSuccessAsync({ from: recurringBuyer });
            const actualEntry = NULL_RECURRING_BUY;
            [
                actualEntry.sellAmount,
                actualEntry.interval,
                actualEntry.minBuyAmount,
                actualEntry.maxSlippageBps,
                actualEntry.currentBuyWindowStart,
                actualEntry.currentIntervalAmountSold,
                actualEntry.unwrapWeth,
            ] = await ritualBridge.recurringBuys(recurringBuyId).callAsync();
            expect(actualEntry).to.deep.equal(NULL_RECURRING_BUY);
        });
    });

    blockchainTests.resets('bridgeTransferFrom()', () => {
        const recurringBuy: RecurringBuy = {
            ...NULL_RECURRING_BUY,
            sellAmount: toBaseUnitAmount(1337),
            interval: ONE_DAY_IN_SECONDS.times(7),
            minBuyAmount: toBaseUnitAmount(420),
            maxSlippageBps: new BigNumber(123),
            unwrapWeth: true,
        };

        const bridgeDataEncoder = AbiEncoder.create([
            { name: 'takerToken', type: 'address' },
            { name: 'recurringBuyer', type: 'address' },
        ]);

        before(async () => {
            await ritualBridge
                .setRecurringBuy(
                    sellToken.address,
                    buyToken.address,
                    recurringBuy.sellAmount,
                    recurringBuy.interval,
                    recurringBuy.minBuyAmount,
                    recurringBuy.maxSlippageBps,
                    recurringBuy.unwrapWeth,
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync({ from: recurringBuyer });
            recurringBuy.currentBuyWindowStart = new BigNumber(await env.web3Wrapper.getBlockTimestampAsync('latest'));
        });

        it('Reverts if there is no active buy', async () => {
            await ritualBridge
                .cancelRecurringBuy(sellToken.address, buyToken.address)
                .awaitTransactionSuccessAsync({ from: recurringBuyer });
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount)
                .awaitTransactionSuccessAsync({ from: taker });
            const tx = ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount,
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            return expect(tx).to.revertWith(
                'RitualBridge::_validateAndUpdateRecurringBuy/NO_ACTIVE_RECURRING_BUY_FOUND',
            );
        });
        it('Reverts if the order price is worse than the worst acceptable price', async () => {
            const worstPrice = recurringBuy.minBuyAmount.div(recurringBuy.sellAmount);
            const takerAssetAmount = getRandomInteger(0, recurringBuy.sellAmount);
            const minBuyAmountScaled = takerAssetAmount.times(worstPrice).integerValue(BigNumber.ROUND_DOWN);
            await buyToken
                .transfer(ritualBridge.address, minBuyAmountScaled.minus(1))
                .awaitTransactionSuccessAsync({ from: taker });
            const tx = ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    takerAssetAmount,
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            return expect(tx).to.revertWith('RitualBridge::_validateAndUpdateRecurringBuy/INVALID_PRICE');
        });
        it('Reverts if executing trade would exceed the sell amount of the recurring buy', async () => {
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount.times(2))
                .awaitTransactionSuccessAsync({ from: taker });
            const tx = ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount.times(2),
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            return expect(tx).to.revertWith('RitualBridge::_validateAndUpdateRecurringBuy/EXCEEDS_SELL_AMOUNT');
        });
        it('Reverts if outside of buy window', async () => {
            await env.web3Wrapper.increaseTimeAsync(BUY_WINDOW_LENGTH.plus(1).toNumber());
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount)
                .awaitTransactionSuccessAsync({ from: taker });
            const tx = ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount,
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            return expect(tx).to.revertWith('RitualBridge::_validateAndUpdateRecurringBuy/OUTSIDE_OF_BUY_WINDOW');
        });
        // it('Reverts if outside of slippage range', async () => {
        //     const oracleAddress = await ritualBridge.getOracleAddress().callAsync();
        //     await new TestOracleContract(oracleAddress, env.provider)
        //         .setLatestAnswer(new BigNumber(100000000))
        //         .awaitTransactionSuccessAsync({ from: taker });
        //     await buyToken
        //         .transfer(ritualBridge.address, recurringBuy.minBuyAmount)
        //         .awaitTransactionSuccessAsync({ from: taker });
        //     const tx = ritualBridge
        //         .bridgeTransferFrom(
        //             sellToken.address,
        //             constants.NULL_ADDRESS,
        //             taker,
        //             recurringBuy.sellAmount,
        //             bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
        //         )
        //         .awaitTransactionSuccessAsync({ from: taker });
        //     return expect(tx).to.revertWith(
        //         'RitualBridge::_validateAndUpdateRecurringBuy/EXCEEDS_MAX_ALLOWED_SLIPPAGE',
        //     );
        // });
        it('Succeeds otherwise', async () => {
            const recurringBuyerBalanceBefore = await buyToken.balanceOf(recurringBuyer).callAsync();
            const takerBalanceBefore = await sellToken.balanceOf(taker).callAsync();
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount)
                .awaitTransactionSuccessAsync({ from: taker });
            await ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount,
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });

            const recurringBuyerBalanceAfter = await buyToken.balanceOf(recurringBuyer).callAsync();
            const takerBalanceAfter = await sellToken.balanceOf(taker).callAsync();
            expect(recurringBuyerBalanceAfter).to.bignumber.equal(
                recurringBuyerBalanceBefore.plus(recurringBuy.minBuyAmount),
            );
            expect(takerBalanceAfter).to.bignumber.equal(takerBalanceBefore.plus(recurringBuy.sellAmount));
        });
        it('Succeeds in consecutive intervals', async () => {
            const recurringBuyerBalanceBefore = await buyToken.balanceOf(recurringBuyer).callAsync();
            const takerBalanceBefore = await sellToken.balanceOf(taker).callAsync();
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount)
                .awaitTransactionSuccessAsync({ from: taker });
            await ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount,
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            await env.web3Wrapper.increaseTimeAsync(recurringBuy.interval.plus(BUY_WINDOW_LENGTH.div(2)).toNumber());
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount)
                .awaitTransactionSuccessAsync({ from: taker });
            await ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount,
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            const recurringBuyerBalanceAfter = await buyToken.balanceOf(recurringBuyer).callAsync();
            const takerBalanceAfter = await sellToken.balanceOf(taker).callAsync();
            expect(recurringBuyerBalanceAfter).to.bignumber.equal(
                recurringBuyerBalanceBefore.plus(recurringBuy.minBuyAmount.times(2)),
            );
            expect(takerBalanceAfter).to.bignumber.equal(takerBalanceBefore.plus(recurringBuy.sellAmount.times(2)));
        });
        it('Succeeds with two partial fills in the same buy period', async () => {
            const recurringBuyerBalanceBefore = await buyToken.balanceOf(recurringBuyer).callAsync();
            const takerBalanceBefore = await sellToken.balanceOf(taker).callAsync();
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount.div(2))
                .awaitTransactionSuccessAsync({ from: taker });
            await ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount.div(2),
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            await buyToken
                .transfer(ritualBridge.address, recurringBuy.minBuyAmount.div(2))
                .awaitTransactionSuccessAsync({ from: taker });
            await ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    recurringBuy.sellAmount.div(2),
                    bridgeDataEncoder.encode({ takerToken: buyToken.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });
            const recurringBuyerBalanceAfter = await buyToken.balanceOf(recurringBuyer).callAsync();
            const takerBalanceAfter = await sellToken.balanceOf(taker).callAsync();
            expect(recurringBuyerBalanceAfter).to.bignumber.equal(
                recurringBuyerBalanceBefore.plus(recurringBuy.minBuyAmount),
            );
            expect(takerBalanceAfter).to.bignumber.equal(takerBalanceBefore.plus(recurringBuy.sellAmount));
        });
        it('Unwraps wETH before transferring to recurring buyer', async () => {
            await ritualBridge
                .setRecurringBuy(
                    sellToken.address,
                    weth.address,
                    recurringBuy.sellAmount,
                    recurringBuy.interval,
                    constants.ONE_ETHER,
                    recurringBuy.maxSlippageBps,
                    recurringBuy.unwrapWeth,
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync({ from: recurringBuyer });
            const recurringBuyerBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(recurringBuyer);
            const takerBalanceBefore = await sellToken.balanceOf(taker).callAsync();
            await weth.deposit().awaitTransactionSuccessAsync({ from: taker, value: constants.ONE_ETHER });
            await weth
                .transfer(ritualBridge.address, constants.ONE_ETHER)
                .awaitTransactionSuccessAsync({ from: taker });
            // NOTE(jalextowle): Changing this to stay within price guardrails
            const buyAmount = constants.ONE_ETHER;
            await ritualBridge
                .bridgeTransferFrom(
                    sellToken.address,
                    constants.NULL_ADDRESS,
                    taker,
                    buyAmount,
                    bridgeDataEncoder.encode({ takerToken: weth.address, recurringBuyer }),
                )
                .awaitTransactionSuccessAsync({ from: taker });

            const recurringBuyerBalanceAfter = await env.web3Wrapper.getBalanceInWeiAsync(recurringBuyer);
            const takerBalanceAfter = await sellToken.balanceOf(taker).callAsync();
            expect(recurringBuyerBalanceAfter).to.bignumber.equal(
                recurringBuyerBalanceBefore.plus(constants.ONE_ETHER),
            );
            expect(takerBalanceAfter).to.bignumber.equal(takerBalanceBefore.plus(buyAmount));
        });
    });
    blockchainTests.resets('fillRecurringBuy()', () => {
        const recurringBuy: RecurringBuy = {
            ...NULL_RECURRING_BUY,
            sellAmount: toBaseUnitAmount(3),
            interval: ONE_DAY_IN_SECONDS.times(7),
            minBuyAmount: toBaseUnitAmount(4),
            maxSlippageBps: new BigNumber(123),
            unwrapWeth: true,
        };
        before(async () => {
            await ritualBridge
                .setRecurringBuy(
                    sellToken.address,
                    buyToken.address,
                    recurringBuy.sellAmount,
                    recurringBuy.interval,
                    recurringBuy.minBuyAmount,
                    recurringBuy.maxSlippageBps,
                    recurringBuy.unwrapWeth,
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync({ from: recurringBuyer });
            recurringBuy.currentBuyWindowStart = new BigNumber(await env.web3Wrapper.getBlockTimestampAsync('latest'));
        });
        // it('reverts to fill an order when the price is outside of the guardrails', async () => {
        //     const order = randomOrder();
        //     order.makerAssetAmount = recurringBuy.sellAmount;
        //     order.takerAssetAmount = recurringBuy.sellAmount.div(2);
        //     order.makerFee = constants.ZERO_AMOUNT;
        //     order.takerFee = constants.ZERO_AMOUNT;
        //     const msgValue = new BigNumber(1337);
        //     const tx = ritualBridge
        //         .fillRecurringBuy(recurringBuyer, sellToken.address, buyToken.address, [order], ['0x'])
        //         .awaitTransactionSuccessAsync({ from: taker, value: msgValue });
        //     return expect(tx).to.revertWith(
        //         'RitualBridge::_validateAndUpdateRecurringBuy/EXCEEDS_MAX_ALLOWED_SLIPPAGE',
        //     );
        // });
        it('can fill an order when the price is within the guardrails', async () => {
            const order = randomOrder({
                makerAddress: taker,
                makerAssetData: assetDataUtils.encodeERC20AssetData(buyToken.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(sellToken.address),
                makerAssetAmount: recurringBuy.minBuyAmount,
                takerAssetAmount: recurringBuy.sellAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const msgValue = new BigNumber(1337);
            const tx = await ritualBridge
                .fillRecurringBuy(recurringBuyer, sellToken.address, buyToken.address, [order], ['0x'])
                .awaitTransactionSuccessAsync({ from: taker, value: msgValue });
            verifyEventsFromLogs(
                tx.logs,
                [{ takerAssetFillAmount: recurringBuy.sellAmount, msgValue }],
                TestRitualBridgeEvents.MarketSellCalled,
            );
        });
    });
});
// tslint:disable max-file-line-count
