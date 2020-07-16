import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    getRandomInteger,
    Numberish,
    randomAddress,
    toBaseUnitAmount,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { AssetProxyId, Order } from '@0x/types';
import { BigNumber, hexUtils, RawRevertError } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
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

const randomAssetData = () => hexUtils.random(34);
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

blockchainTests.only('Eth2DaiBridge unit tests', env => {
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
            let actualEntry = NULL_RECURRING_BUY;
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
            const expectedEntry = {
                ...randomRecurringBuy(),
                currentBuyWindowStart: new BigNumber(await env.web3Wrapper.getBlockTimestampAsync('latest')),
            };
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
            let actualEntry = NULL_RECURRING_BUY;
            [
                actualEntry.sellAmount,
                actualEntry.interval,
                actualEntry.minBuyAmount,
                actualEntry.maxSlippageBps,
                actualEntry.currentBuyWindowStart,
                actualEntry.currentIntervalAmountSold,
                actualEntry.unwrapWeth,
            ] = await ritualBridge.recurringBuys(recurringBuyId).callAsync();
            expect(actualEntry).to.deep.equal(expectedEntry);
        });
        it('calls Exchange.marketSellOrdersNoThrow if orders are provided', async () => {
            const order = randomOrder();
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
            let actualEntry = NULL_RECURRING_BUY;
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
        before(async () => {});
        it('');
    });
});
