import {
    assertIntegerRoughlyEquals,
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    randomAddress,
} from '@0x/contracts-test-utils';
import { Order } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { TestNativeOrderSamplerContract } from '../wrappers';

const { NULL_BYTES, ZERO_AMOUNT } = constants;

// tslint:disable: custom-no-magic-numbers

blockchainTests.resets('NativeOrderSampler contract', env => {
    let testContract: TestNativeOrderSamplerContract;
    let makerToken: string;
    let takerToken: string;
    let feeToken: string;
    let erc20Proxy: string;
    const ERC20_PROXY_ID = '0xf47261b0';
    const VALID_SIGNATURE = '0x01';
    const INVALID_SIGNATURE = '0x00';

    before(async () => {
        testContract = await TestNativeOrderSamplerContract.deployFrom0xArtifactAsync(
            artifacts.TestNativeOrderSampler,
            env.provider,
            env.txDefaults,
            {},
        );
        erc20Proxy = await testContract.getAssetProxy(ERC20_PROXY_ID).callAsync();
        const NUM_TOKENS = new BigNumber(3);
        [makerToken, takerToken, feeToken] = await testContract.createTokens(NUM_TOKENS).callAsync();
        await testContract.createTokens(NUM_TOKENS).awaitTransactionSuccessAsync();
    });

    function getPackedHash(...args: string[]): string {
        return hexUtils.hash(hexUtils.concat(...args.map(a => hexUtils.toHex(a))));
    }

    interface OrderInfo {
        orderHash: string;
        orderStatus: number;
        orderTakerAssetFilledAmount: BigNumber;
    }

    function getOrderInfo(order: Order): OrderInfo {
        const hash = getPackedHash(hexUtils.leftPad(order.salt));
        const orderStatus = order.salt.mod(255).eq(0) ? 3 : 5;
        const filledAmount = order.expirationTimeSeconds;
        return {
            orderStatus,
            orderHash: hash,
            orderTakerAssetFilledAmount: filledAmount,
        };
    }

    function createFillableOrderSalt(): BigNumber {
        return new BigNumber(hexUtils.concat(hexUtils.slice(hexUtils.random(), 0, -1), '0x01'));
    }

    function createUnfillableOrderSalt(): BigNumber {
        return new BigNumber(hexUtils.concat(hexUtils.slice(hexUtils.random(), 0, -1), '0xff'));
    }

    function getOrderFillableTakerAmount(order: Order): BigNumber {
        return order.takerAssetAmount.minus(getOrderInfo(order).orderTakerAssetFilledAmount);
    }

    function getERC20AssetData(tokenAddress: string): string {
        return hexUtils.concat(ERC20_PROXY_ID, hexUtils.leftPad(tokenAddress));
    }

    function createOrder(fields: Partial<Order> = {}, filledTakerAssetAmount: BigNumber = ZERO_AMOUNT): Order {
        return {
            chainId: 1337,
            exchangeAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            senderAddress: randomAddress(),
            feeRecipientAddress: randomAddress(),
            makerAssetAmount: getRandomInteger(1e18, 10e18),
            takerAssetAmount: getRandomInteger(1e18, 10e18),
            makerFee: getRandomInteger(1e18, 10e18),
            takerFee: getRandomInteger(1e18, 10e18),
            makerAssetData: getERC20AssetData(makerToken),
            takerAssetData: getERC20AssetData(takerToken),
            makerFeeAssetData: getERC20AssetData(feeToken),
            takerFeeAssetData: getERC20AssetData(randomAddress()),
            salt: createFillableOrderSalt(),
            // Expiration time will be used to determine filled amount.
            expirationTimeSeconds: filledTakerAssetAmount,
            ...fields,
        };
    }

    async function fundMakerAsync(
        order: Order,
        assetData: string,
        balanceScaling: number = 1,
        allowanceScaling: number = 1,
    ): Promise<void> {
        let token;
        let amount;
        if (assetData === order.makerAssetData) {
            token = makerToken;
            amount =
                order.makerAssetData === order.makerFeeAssetData
                    ? order.makerAssetAmount.plus(order.makerFee)
                    : order.makerAssetAmount;
        } else {
            token = feeToken;
            amount = order.makerFee;
        }
        amount = amount.times(getOrderFillableTakerAmount(order).div(BigNumber.max(1, order.takerAssetAmount)));
        await testContract
            .setTokenBalanceAndAllowance(
                token,
                order.makerAddress,
                erc20Proxy,
                amount.times(balanceScaling).integerValue(),
                amount.times(allowanceScaling).integerValue(),
            )
            .awaitTransactionSuccessAsync();
    }

    describe('getOrderFillableTakerAmount()', () => {
        it('returns the full amount for a fully funded order', async () => {
            const order = createOrder();
            const expected = getOrderFillableTakerAmount(order);
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(actual).to.bignumber.eq(expected);
        });

        it('returns the full amount for a fully funded order without maker fees', async () => {
            const order = createOrder({ makerFee: ZERO_AMOUNT });
            const expected = getOrderFillableTakerAmount(order);
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(actual).to.bignumber.eq(expected);
        });

        it('returns the full amount for a fully funded order without maker fee asset data', async () => {
            const order = createOrder({ makerFeeAssetData: NULL_BYTES });
            const expected = getOrderFillableTakerAmount(order);
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(actual).to.bignumber.eq(expected);
        });

        it('returns the full amount for a fully funded order with maker fees denominated in the maker asset', async () => {
            const order = createOrder({ makerFeeAssetData: getERC20AssetData(makerToken) });
            const expected = getOrderFillableTakerAmount(order);
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(actual).to.bignumber.eq(expected);
        });

        it('returns partial amount with insufficient maker asset balance', async () => {
            const order = createOrder();
            const expected = getOrderFillableTakerAmount(order)
                .times(0.5)
                .integerValue(BigNumber.ROUND_DOWN);
            await fundMakerAsync(order, order.makerAssetData, 0.5);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            assertIntegerRoughlyEquals(actual, expected, 100);
        });

        it('returns partial amount with insufficient maker asset allowance', async () => {
            const order = createOrder();
            const expected = getOrderFillableTakerAmount(order)
                .times(0.5)
                .integerValue(BigNumber.ROUND_DOWN);
            await fundMakerAsync(order, order.makerAssetData, 1, 0.5);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            assertIntegerRoughlyEquals(actual, expected, 100);
        });

        it('returns partial amount with insufficient maker fee asset balance', async () => {
            const order = createOrder();
            const expected = getOrderFillableTakerAmount(order)
                .times(0.5)
                .integerValue(BigNumber.ROUND_DOWN);
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData, 0.5);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            assertIntegerRoughlyEquals(actual, expected, 100);
        });

        it('returns partial amount with insufficient maker fee asset allowance', async () => {
            const order = createOrder();
            const expected = getOrderFillableTakerAmount(order)
                .times(0.5)
                .integerValue(BigNumber.ROUND_DOWN);
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData, 1, 0.5);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            assertIntegerRoughlyEquals(actual, expected, 100);
        });

        it('returns partial amount with insufficient maker asset balance (maker asset fees)', async () => {
            const order = createOrder({ makerFeeAssetData: getERC20AssetData(makerToken) });
            const expected = getOrderFillableTakerAmount(order)
                .times(0.5)
                .integerValue(BigNumber.ROUND_DOWN);
            await fundMakerAsync(order, order.makerAssetData, 0.5);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            assertIntegerRoughlyEquals(actual, expected, 100);
        });

        it('returns partial amount with insufficient maker asset allowance (maker asset fees)', async () => {
            const order = createOrder({ makerFeeAssetData: getERC20AssetData(makerToken) });
            const expected = getOrderFillableTakerAmount(order)
                .times(0.5)
                .integerValue(BigNumber.ROUND_DOWN);
            await fundMakerAsync(order, order.makerAssetData, 1, 0.5);
            const actual = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            assertIntegerRoughlyEquals(actual, expected, 100);
        });

        it('returns zero for an that is not fillable', async () => {
            const order = {
                ...createOrder(),
                salt: createUnfillableOrderSalt(),
            };
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const fillableTakerAmount = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(fillableTakerAmount).to.bignumber.eq(ZERO_AMOUNT);
        });

        it('returns zero for an order with zero maker asset amount', async () => {
            const order = {
                ...createOrder(),
                makerAssetAmount: ZERO_AMOUNT,
            };
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const fillableTakerAmount = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(fillableTakerAmount).to.bignumber.eq(ZERO_AMOUNT);
        });

        it('returns zero for an order with zero taker asset amount', async () => {
            const order = {
                ...createOrder(),
                takerAssetAmount: ZERO_AMOUNT,
            };
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const fillableTakerAmount = await testContract
                .getOrderFillableTakerAmount(order, VALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(fillableTakerAmount).to.bignumber.eq(ZERO_AMOUNT);
        });

        it('returns zero for an order with an empty signature', async () => {
            const order = createOrder();
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const fillableTakerAmount = await testContract
                .getOrderFillableTakerAmount(order, NULL_BYTES, testContract.address)
                .callAsync();
            expect(fillableTakerAmount).to.bignumber.eq(ZERO_AMOUNT);
        });

        it('returns zero for an order with an invalid signature', async () => {
            const order = createOrder();
            await fundMakerAsync(order, order.makerAssetData);
            await fundMakerAsync(order, order.makerFeeAssetData);
            const fillableTakerAmount = await testContract
                .getOrderFillableTakerAmount(order, INVALID_SIGNATURE, testContract.address)
                .callAsync();
            expect(fillableTakerAmount).to.bignumber.eq(ZERO_AMOUNT);
        });
    });
});
