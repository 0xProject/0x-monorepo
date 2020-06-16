import {
    assertIntegerRoughlyEquals,
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    Numberish,
    randomAddress,
} from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, hexUtils, ZeroExRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import {
    encodeFillQuoteTransformerData,
    FillQuoteTransformerData,
    FillQuoteTransformerSide,
} from '../../src/transformer_data_encoders';
import { artifacts } from '../artifacts';
import {
    FillQuoteTransformerContract,
    TestFillQuoteTransformerExchangeContract,
    TestFillQuoteTransformerHostContract,
    TestMintableERC20TokenContract,
} from '../wrappers';

const { NULL_ADDRESS, NULL_BYTES, MAX_UINT256, ZERO_AMOUNT } = constants;

blockchainTests.resets('FillQuoteTransformer', env => {
    let maker: string;
    let feeRecipient: string;
    let exchange: TestFillQuoteTransformerExchangeContract;
    let transformer: FillQuoteTransformerContract;
    let host: TestFillQuoteTransformerHostContract;
    let makerToken: TestMintableERC20TokenContract;
    let takerToken: TestMintableERC20TokenContract;
    let takerFeeToken: TestMintableERC20TokenContract;
    let singleProtocolFee: BigNumber;

    const GAS_PRICE = 1337;

    before(async () => {
        [maker, feeRecipient] = await env.getAccountAddressesAsync();
        exchange = await TestFillQuoteTransformerExchangeContract.deployFrom0xArtifactAsync(
            artifacts.TestFillQuoteTransformerExchange,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        transformer = await FillQuoteTransformerContract.deployFrom0xArtifactAsync(
            artifacts.FillQuoteTransformer,
            env.provider,
            env.txDefaults,
            artifacts,
            exchange.address,
        );
        host = await TestFillQuoteTransformerHostContract.deployFrom0xArtifactAsync(
            artifacts.TestFillQuoteTransformerHost,
            env.provider,
            {
                ...env.txDefaults,
                gasPrice: GAS_PRICE,
            },
            artifacts,
        );
        [makerToken, takerToken, takerFeeToken] = await Promise.all(
            _.times(3, async () =>
                TestMintableERC20TokenContract.deployFrom0xArtifactAsync(
                    artifacts.TestMintableERC20Token,
                    env.provider,
                    env.txDefaults,
                    artifacts,
                ),
            ),
        );
        singleProtocolFee = (await exchange.protocolFeeMultiplier().callAsync()).times(GAS_PRICE);
    });

    type FilledOrder = Order & { filledTakerAssetAmount: BigNumber };

    function createOrder(fields: Partial<Order> = {}): FilledOrder {
        return {
            chainId: 1,
            exchangeAddress: exchange.address,
            expirationTimeSeconds: ZERO_AMOUNT,
            salt: ZERO_AMOUNT,
            senderAddress: NULL_ADDRESS,
            takerAddress: NULL_ADDRESS,
            makerAddress: maker,
            feeRecipientAddress: feeRecipient,
            makerAssetAmount: getRandomInteger('0.1e18', '1e18'),
            takerAssetAmount: getRandomInteger('0.1e18', '1e18'),
            makerFee: ZERO_AMOUNT,
            takerFee: getRandomInteger('0.001e18', '0.1e18'),
            makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
            makerFeeAssetData: NULL_BYTES,
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
            filledTakerAssetAmount: ZERO_AMOUNT,
            ...fields,
        };
    }

    interface QuoteFillResults {
        makerAssetBought: BigNumber;
        takerAssetSpent: BigNumber;
        protocolFeePaid: BigNumber;
    }

    const ZERO_QUOTE_FILL_RESULTS = {
        makerAssetBought: ZERO_AMOUNT,
        takerAssetSpent: ZERO_AMOUNT,
        protocolFeePaid: ZERO_AMOUNT,
    };

    function getExpectedSellQuoteFillResults(
        orders: FilledOrder[],
        takerAssetFillAmount: BigNumber = constants.MAX_UINT256,
    ): QuoteFillResults {
        const qfr = { ...ZERO_QUOTE_FILL_RESULTS };
        for (const order of orders) {
            if (qfr.takerAssetSpent.gte(takerAssetFillAmount)) {
                break;
            }
            const singleFillAmount = BigNumber.min(
                takerAssetFillAmount.minus(qfr.takerAssetSpent),
                order.takerAssetAmount.minus(order.filledTakerAssetAmount),
            );
            const fillRatio = singleFillAmount.div(order.takerAssetAmount);
            qfr.takerAssetSpent = qfr.takerAssetSpent.plus(singleFillAmount);
            qfr.protocolFeePaid = qfr.protocolFeePaid.plus(singleProtocolFee);
            qfr.makerAssetBought = qfr.makerAssetBought.plus(
                fillRatio.times(order.makerAssetAmount).integerValue(BigNumber.ROUND_DOWN),
            );
            const takerFee = fillRatio.times(order.takerFee).integerValue(BigNumber.ROUND_DOWN);
            if (order.takerAssetData === order.takerFeeAssetData) {
                // Taker fee is in taker asset.
                qfr.takerAssetSpent = qfr.takerAssetSpent.plus(takerFee);
            } else if (order.makerAssetData === order.takerFeeAssetData) {
                // Taker fee is in maker asset.
                qfr.makerAssetBought = qfr.makerAssetBought.minus(takerFee);
            }
        }
        return qfr;
    }

    function getExpectedBuyQuoteFillResults(
        orders: FilledOrder[],
        makerAssetFillAmount: BigNumber = constants.MAX_UINT256,
    ): QuoteFillResults {
        const qfr = { ...ZERO_QUOTE_FILL_RESULTS };
        for (const order of orders) {
            if (qfr.makerAssetBought.gte(makerAssetFillAmount)) {
                break;
            }
            const filledMakerAssetAmount = order.filledTakerAssetAmount
                .times(order.makerAssetAmount.div(order.takerAssetAmount))
                .integerValue(BigNumber.ROUND_DOWN);
            const singleFillAmount = BigNumber.min(
                makerAssetFillAmount.minus(qfr.makerAssetBought),
                order.makerAssetAmount.minus(filledMakerAssetAmount),
            );
            const fillRatio = singleFillAmount.div(order.makerAssetAmount);
            qfr.takerAssetSpent = qfr.takerAssetSpent.plus(
                fillRatio.times(order.takerAssetAmount).integerValue(BigNumber.ROUND_UP),
            );
            qfr.protocolFeePaid = qfr.protocolFeePaid.plus(singleProtocolFee);
            qfr.makerAssetBought = qfr.makerAssetBought.plus(singleFillAmount);
            const takerFee = fillRatio.times(order.takerFee).integerValue(BigNumber.ROUND_UP);
            if (order.takerAssetData === order.takerFeeAssetData) {
                // Taker fee is in taker asset.
                qfr.takerAssetSpent = qfr.takerAssetSpent.plus(takerFee);
            } else if (order.makerAssetData === order.takerFeeAssetData) {
                // Taker fee is in maker asset.
                qfr.makerAssetBought = qfr.makerAssetBought.minus(takerFee);
            }
        }
        return qfr;
    }

    interface Balances {
        makerAssetBalance: BigNumber;
        takerAssetBalance: BigNumber;
        takerFeeBalance: BigNumber;
        protocolFeeBalance: BigNumber;
    }

    const ZERO_BALANCES = {
        makerAssetBalance: ZERO_AMOUNT,
        takerAssetBalance: ZERO_AMOUNT,
        takerFeeBalance: ZERO_AMOUNT,
        protocolFeeBalance: ZERO_AMOUNT,
    };

    async function getBalancesAsync(owner: string): Promise<Balances> {
        const balances = { ...ZERO_BALANCES };
        [
            balances.makerAssetBalance,
            balances.takerAssetBalance,
            balances.takerFeeBalance,
            balances.protocolFeeBalance,
        ] = await Promise.all([
            makerToken.balanceOf(owner).callAsync(),
            takerToken.balanceOf(owner).callAsync(),
            takerFeeToken.balanceOf(owner).callAsync(),
            env.web3Wrapper.getBalanceInWeiAsync(owner),
        ]);
        return balances;
    }

    function assertBalances(actual: Balances, expected: Balances): void {
        assertIntegerRoughlyEquals(actual.makerAssetBalance, expected.makerAssetBalance, 10, 'makerAssetBalance');
        assertIntegerRoughlyEquals(actual.takerAssetBalance, expected.takerAssetBalance, 10, 'takerAssetBalance');
        assertIntegerRoughlyEquals(actual.takerFeeBalance, expected.takerFeeBalance, 10, 'takerFeeBalance');
        assertIntegerRoughlyEquals(actual.protocolFeeBalance, expected.protocolFeeBalance, 10, 'protocolFeeBalance');
    }

    function encodeTransformData(fields: Partial<FillQuoteTransformerData> = {}): string {
        return encodeFillQuoteTransformerData({
            side: FillQuoteTransformerSide.Sell,
            sellToken: takerToken.address,
            buyToken: makerToken.address,
            orders: [],
            signatures: [],
            maxOrderFillAmounts: [],
            fillAmount: MAX_UINT256,
            ...fields,
        });
    }

    function encodeExchangeBehavior(
        filledTakerAssetAmount: Numberish = 0,
        makerAssetMintRatio: Numberish = 1.0,
    ): string {
        return hexUtils.slice(
            exchange
                .encodeBehaviorData({
                    filledTakerAssetAmount: new BigNumber(filledTakerAssetAmount),
                    makerAssetMintRatio: new BigNumber(makerAssetMintRatio).times('1e18').integerValue(),
                })
                .getABIEncodedTransactionData(),
            4,
        );
    }

    const ERC20_ASSET_PROXY_ID = '0xf47261b0';

    describe('sell quotes', () => {
        it('can fully sell to a single order quote', async () => {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('can fully sell to multi order quote', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('can partially sell to single order quote', async () => {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(
                orders,
                getExpectedSellQuoteFillResults(orders).takerAssetSpent.dividedToIntegerBy(2),
            );
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('can partially sell to multi order quote and refund unused protocol fees', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders.slice(0, 2));
            const maxProtocolFees = singleProtocolFee.times(orders.length);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: maxProtocolFees });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
                protocolFeeBalance: singleProtocolFee,
            });
        });

        it('can sell to multi order quote with a failing order', async () => {
            const orders = _.times(3, () => createOrder());
            // First order will fail.
            const validOrders = orders.slice(1);
            const signatures = [NULL_BYTES, ...validOrders.map(() => encodeExchangeBehavior())];
            const qfr = getExpectedSellQuoteFillResults(validOrders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('succeeds if an order transfers too few maker tokens', async () => {
            const mintScale = 0.5;
            const orders = _.times(3, () => createOrder());
            // First order mints less than expected.
            const signatures = [
                encodeExchangeBehavior(0, mintScale),
                ...orders.slice(1).map(() => encodeExchangeBehavior()),
            ];
            const qfr = getExpectedSellQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought
                    .minus(orders[0].makerAssetAmount.times(1 - mintScale))
                    .integerValue(BigNumber.ROUND_DOWN),
            });
        });

        it('can fail if an order is partially filled', async () => {
            const orders = _.times(3, () => createOrder());
            // First order is partially filled.
            const filledOrder = {
                ...orders[0],
                filledTakerAssetAmount: orders[0].takerAssetAmount.dividedToIntegerBy(2),
            };
            // First order is partially filled.
            const signatures = [
                encodeExchangeBehavior(filledOrder.filledTakerAssetAmount),
                ...orders.slice(1).map(() => encodeExchangeBehavior()),
            ];
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.IncompleteFillSellQuoteError(
                    takerToken.address,
                    getExpectedSellQuoteFillResults([filledOrder, ...orders.slice(1)]).takerAssetSpent,
                    qfr.takerAssetSpent,
                ),
            );
        });

        it('fails if not enough protocol fee provided', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid.minus(1) });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.InsufficientProtocolFeeError(
                    singleProtocolFee.minus(1),
                    singleProtocolFee,
                ),
            );
        });

        it('can sell less than the taker token balance', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const takerTokenBalance = qfr.takerAssetSpent.times(1.01).integerValue();
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    takerTokenBalance,
                    encodeTransformData({
                        orders,
                        signatures,
                        fillAmount: qfr.takerAssetSpent,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
                takerAssetBalance: qfr.takerAssetSpent.times(0.01).integerValue(),
            });
        });

        it('fails to sell more than the taker token balance', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const takerTokenBalance = qfr.takerAssetSpent.times(0.99).integerValue();
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    takerTokenBalance,
                    encodeTransformData({
                        orders,
                        signatures,
                        fillAmount: qfr.takerAssetSpent,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.IncompleteFillSellQuoteError(
                    takerToken.address,
                    getExpectedSellQuoteFillResults(orders.slice(0, 2)).takerAssetSpent,
                    qfr.takerAssetSpent,
                ),
            );
        });

        it('can fully sell to a single order with maker asset taker fees', async () => {
            const orders = _.times(1, () =>
                createOrder({
                    takerFeeAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
                }),
            );
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('fails if an order has a non-standard taker fee asset', async () => {
            const BAD_ASSET_DATA = hexUtils.random(36);
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.InvalidERC20AssetDataError(BAD_ASSET_DATA),
            );
        });

        it('fails if an order has a fee asset that is neither maker or taker asset', async () => {
            const badToken = randomAddress();
            const BAD_ASSET_DATA = hexUtils.concat(ERC20_ASSET_PROXY_ID, hexUtils.leftPad(badToken));
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return expect(tx).to.revertWith(new ZeroExRevertErrors.TransformERC20.InvalidTakerFeeTokenError(badToken));
        });

        it('respects `maxOrderFillAmounts`', async () => {
            const orders = _.times(2, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders.slice(1));
            const protocolFee = singleProtocolFee.times(2);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        // Skip the first order.
                        maxOrderFillAmounts: [ZERO_AMOUNT],
                    }),
                )
                .awaitTransactionSuccessAsync({ value: protocolFee });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });
    });

    describe('buy quotes', () => {
        it('can fully buy from a single order quote', async () => {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('can fully buy from a multi order quote', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('can partially buy from a single order quote', async () => {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(
                orders,
                getExpectedBuyQuoteFillResults(orders).makerAssetBought.dividedToIntegerBy(2),
            );
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('can partially buy from multi order quote and refund unused protocol fees', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders.slice(0, 2));
            const maxProtocolFees = singleProtocolFee.times(orders.length);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: maxProtocolFees });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
                protocolFeeBalance: singleProtocolFee,
            });
        });

        it('can buy from multi order quote with a failing order', async () => {
            const orders = _.times(3, () => createOrder());
            // First order will fail.
            const validOrders = orders.slice(1);
            const signatures = [NULL_BYTES, ...validOrders.map(() => encodeExchangeBehavior())];
            const qfr = getExpectedBuyQuoteFillResults(validOrders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('succeeds if an order transfers too many maker tokens', async () => {
            const orders = _.times(2, () => createOrder());
            // First order will mint its tokens + the maker tokens of the second.
            const mintScale = orders[1].makerAssetAmount.div(orders[0].makerAssetAmount.minus(1)).plus(1);
            const signatures = [
                encodeExchangeBehavior(0, mintScale),
                ...orders.slice(1).map(() => encodeExchangeBehavior()),
            ];
            const qfr = getExpectedBuyQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: orders[0].makerAssetAmount.times(mintScale).integerValue(BigNumber.ROUND_DOWN),
                takerAssetBalance: orders[1].takerAssetAmount.plus(orders[1].takerFee),
                protocolFeeBalance: singleProtocolFee,
            });
        });

        it('fails to buy more than available in orders', async () => {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought.plus(1),
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.IncompleteFillBuyQuoteError(
                    makerToken.address,
                    qfr.makerAssetBought,
                    qfr.makerAssetBought.plus(1),
                ),
            );
        });

        it('can fully buy from a single order with maker asset taker fees', async () => {
            const orders = _.times(1, () =>
                createOrder({
                    takerFeeAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
                }),
            );
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });

        it('fails if an order has a non-standard taker fee asset', async () => {
            const BAD_ASSET_DATA = hexUtils.random(36);
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.InvalidERC20AssetDataError(BAD_ASSET_DATA),
            );
        });

        it('fails if an order has a fee asset that is neither maker or taker asset', async () => {
            const badToken = randomAddress();
            const BAD_ASSET_DATA = hexUtils.concat(ERC20_ASSET_PROXY_ID, hexUtils.leftPad(badToken));
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            const tx = host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                    }),
                )
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return expect(tx).to.revertWith(new ZeroExRevertErrors.TransformERC20.InvalidTakerFeeTokenError(badToken));
        });

        it('respects `maxOrderFillAmounts`', async () => {
            const orders = _.times(2, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders.slice(1));
            const protocolFee = singleProtocolFee.times(2);
            await host
                .executeTransform(
                    transformer.address,
                    takerToken.address,
                    qfr.takerAssetSpent,
                    encodeTransformData({
                        orders,
                        signatures,
                        side: FillQuoteTransformerSide.Buy,
                        fillAmount: qfr.makerAssetBought,
                        // Skip the first order.
                        maxOrderFillAmounts: [ZERO_AMOUNT],
                    }),
                )
                .awaitTransactionSuccessAsync({ value: protocolFee });
            assertBalances(await getBalancesAsync(host.address), {
                ...ZERO_BALANCES,
                makerAssetBalance: qfr.makerAssetBought,
            });
        });
    });
});
