import { MarketBuySwapQuote, MarketSellSwapQuote, Orderbook, SwapQuoter } from '@0x/asset-swapper';
import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { FillResults, SignedOrder } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import * as _ from 'lodash';

import { TestMainnetAggregatorFillsContract } from '../wrappers';

import { tokens } from './tokens';

blockchainTests.live('Aggregator Mainnet Tests', env => {
    // Mainnet address of the `TestMainnetAggregatorFills` contract.
    const TEST_CONTRACT_ADDRESS = '0x37Ca306F42748b7fe105F89FCBb2CD03D27c8146';
    const TAKER_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'; // Vitalik
    const GAS_PRICE = new BigNumber(1);
    const TAKER_ASSET_ETH_VALUE = 500e18;
    const MIN_BALANCE = 500.1e18;
    const SYMBOLS = ['ETH', 'DAI', 'USDC', 'FOAM'];
    const TEST_PAIRS = _.flatten(SYMBOLS.map(m => SYMBOLS.filter(t => t !== m).map(t => [m, t])));
    const FILL_VALUES = [1, 10, 1e2, 1e3, 1e4, 2.5e4, 5e4];

    let testContract: TestMainnetAggregatorFillsContract;
    let swapQuoter: SwapQuoter;
    let takerEthBalance: BigNumber;
    const orderbooks: Orderbook[] = [];

    async function getTakerOrdersAsync(takerAssetSymbol: string): Promise<SignedOrder[]> {
        if (takerAssetSymbol === 'ETH') {
            return [];
        }
        return getOrdersAsync(takerAssetSymbol, 'ETH');
    }

    // Fetches ETH -> taker asset orders for the forwarder contract.
    async function getOrdersAsync(makerAssetSymbol: string, takerAssetSymbol: string): Promise<SignedOrder[]> {
        const takerTokenAddress = tokens[takerAssetSymbol].address;
        const makerTokenAddress = tokens[makerAssetSymbol].address;
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
        const orders = _.flatten(
            await Promise.all(orderbooks.map(book => book.getOrdersAsync(makerAssetData, takerAssetData))),
        ).map(o => o.order);
        const uniqueOrders: SignedOrder[] = [];
        for (const order of orders) {
            if (!order.makerFee.eq(0) || !order.takerFee.eq(0)) {
                continue;
            }
            if (uniqueOrders.findIndex(o => isSameOrder(order, o)) === -1) {
                uniqueOrders.push(order);
            }
        }
        return uniqueOrders;
    }

    function isSameOrder(a: SignedOrder, b: SignedOrder): boolean {
        for (const [k, v] of Object.entries(a)) {
            if (k in (b as any)) {
                if (BigNumber.isBigNumber(v) && !v.eq((b as any)[k])) {
                    return false;
                }
                if (v !== (b as any)[k]) {
                    return false;
                }
            }
        }
        return true;
    }

    function toTokenUnits(symbol: string, weis: Numberish): BigNumber {
        return new BigNumber(weis).div(new BigNumber(10).pow(tokens[symbol].decimals));
    }

    function fromTokenUnits(symbol: string, units: Numberish): BigNumber {
        return new BigNumber(units)
            .times(new BigNumber(10).pow(tokens[symbol].decimals))
            .integerValue(BigNumber.ROUND_DOWN);
    }

    interface MarketOperationResult {
        makerAssetBalanceBefore: BigNumber;
        takerAssetBalanceBefore: BigNumber;
        makerAssetBalanceAfter: BigNumber;
        takerAssetBalanceAfter: BigNumber;
        fillResults: FillResults;
    }

    // Liquidity is low right now so it's possible we didn't have
    // enough taker assets to cover the orders, so occasionally we'll get incomplete
    // fills. This function will catch those cases.
    // TODO(dorothy-zbornak): Remove this special case when liquidity is up.
    function checkHadEnoughTakerAsset(
        quote: MarketBuySwapQuote | MarketSellSwapQuote,
        result: MarketOperationResult,
    ): boolean {
        if (result.takerAssetBalanceBefore.gte(quote.worstCaseQuoteInfo.takerAssetAmount)) {
            return true;
        }
        const takerAssetPct = result.takerAssetBalanceBefore
            .div(quote.worstCaseQuoteInfo.takerAssetAmount)
            .times(100)
            .toNumber()
            .toFixed(1);
        logUtils.warn(`Could not acquire enough taker asset to complete the fill: ${takerAssetPct}%`);
        expect(result.fillResults.makerAssetFilledAmount).to.bignumber.lt(quote.worstCaseQuoteInfo.makerAssetAmount);
        return false;
    }

    before(async () => {
        testContract = new TestMainnetAggregatorFillsContract(TEST_CONTRACT_ADDRESS, env.provider, {
            ...env.txDefaults,
            gasPrice: GAS_PRICE,
            gas: 10e6,
        });
        swapQuoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(env.provider, 'https://api.0x.org/sra');
        // Pool orderbooks because we're desperate for liquidity.
        orderbooks.push(
            swapQuoter.orderbook,
            Orderbook.getOrderbookForPollingProvider({
                httpEndpoint: 'https://sra.bamboorelay.com/0x/v3',
                pollingIntervalMs: 1000,
            }),
        );
        takerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(TAKER_ADDRESS);
    });

    it('taker has minimum ETH', async () => {
        expect(takerEthBalance).to.bignumber.gte(MIN_BALANCE);
    });

    describe('market sells', () => {
        for (const [makerSymbol, takerSymbol] of TEST_PAIRS) {
            for (const fillValue of FILL_VALUES) {
                const fillAmount = fromTokenUnits(takerSymbol, new BigNumber(fillValue).div(tokens[takerSymbol].price));
                it(`sell ${toTokenUnits(takerSymbol, fillAmount)} ${takerSymbol} for ${makerSymbol}`, async () => {
                    const [quote, takerOrders] = await Promise.all([
                        swapQuoter.getMarketSellSwapQuoteAsync(
                            tokens[makerSymbol].address,
                            tokens[takerSymbol].address,
                            fillAmount,
                            { gasPrice: GAS_PRICE },
                        ),
                        getTakerOrdersAsync(takerSymbol),
                    ]);
                    // Buy taker assets from `takerOrders` and and perform a
                    // market sell on the bridge orders.
                    const fill = await testContract
                        .marketSell(
                            tokens[makerSymbol].address,
                            tokens[takerSymbol].address,
                            quote.orders,
                            takerOrders,
                            quote.orders.map(o => o.signature),
                            takerOrders.map(o => o.signature),
                            quote.takerAssetFillAmount,
                        )
                        .callAsync({
                            value: quote.worstCaseQuoteInfo.protocolFeeInWeiAmount.plus(TAKER_ASSET_ETH_VALUE),
                            from: TAKER_ADDRESS,
                            gasPrice: quote.gasPrice,
                        });
                    if (checkHadEnoughTakerAsset(quote, fill)) {
                        expect(fill.fillResults.makerAssetFilledAmount, 'makerAssetFilledAmount').to.bignumber.gte(
                            quote.worstCaseQuoteInfo.makerAssetAmount,
                        );
                        expect(fill.fillResults.takerAssetFilledAmount, 'takerAssetFilledAmount').to.bignumber.lte(
                            quote.takerAssetFillAmount,
                        );
                    }
                });
            }
        }
    });

    describe('market buys', () => {
        for (const [makerSymbol, takerSymbol] of TEST_PAIRS) {
            for (const fillValue of FILL_VALUES) {
                const fillAmount = fromTokenUnits(makerSymbol, new BigNumber(fillValue).div(tokens[makerSymbol].price));
                it(`buy ${toTokenUnits(makerSymbol, fillAmount)} ${makerSymbol} with ${takerSymbol}`, async () => {
                    const [quote, takerOrders] = await Promise.all([
                        swapQuoter.getMarketBuySwapQuoteAsync(
                            tokens[makerSymbol].address,
                            tokens[takerSymbol].address,
                            fillAmount,
                            { gasPrice: GAS_PRICE },
                        ),
                        getTakerOrdersAsync(takerSymbol),
                    ]);
                    // Buy taker assets from `takerOrders` and and perform a
                    // market buy on the bridge orders.
                    const fill = await testContract
                        .marketBuy(
                            tokens[makerSymbol].address,
                            tokens[takerSymbol].address,
                            quote.orders,
                            takerOrders,
                            quote.orders.map(o => o.signature),
                            takerOrders.map(o => o.signature),
                            quote.makerAssetFillAmount,
                        )
                        .callAsync({
                            value: quote.worstCaseQuoteInfo.protocolFeeInWeiAmount.plus(TAKER_ASSET_ETH_VALUE),
                            from: TAKER_ADDRESS,
                            gasPrice: quote.gasPrice,
                        });
                    if (checkHadEnoughTakerAsset(quote, fill)) {
                        expect(fill.fillResults.takerAssetFilledAmount, 'takerAssetFilledAmount').to.bignumber.lte(
                            quote.worstCaseQuoteInfo.takerAssetAmount,
                        );
                        expect(fill.fillResults.makerAssetFilledAmount, 'makerAssetFilledAmount').to.bignumber.gte(
                            quote.makerAssetFillAmount,
                        );
                    }
                });
            }
        }
    });
});
