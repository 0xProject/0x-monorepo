import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    getRandomPortion,
    hexConcat,
    hexHash,
    hexLeftPad,
    hexRandom,
    randomAddress,
    toHex,
} from '@0x/contracts-test-utils';
import { Order, OrderInfo } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { TestERC20BridgeSamplerContract } from './wrappers';

blockchainTests('erc20-bridge-sampler', env => {
    let testContract: TestERC20BridgeSamplerContract;
    let allSources: { [name: string]: string };
    const RATE_DENOMINATOR = constants.ONE_ETHER;
    const MIN_RATE = new BigNumber('0.01');
    const MAX_RATE = new BigNumber('100');
    const MIN_DECIMALS = 4;
    const MAX_DECIMALS = 20;
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const KYBER_SALT = '0x0ff3ca9d46195c39f9a12afb74207b4970349fb3cfb1e459bbf170298d326bc7';
    const ETH2DAI_SALT = '0xb713b61bb9bb2958a0f5d1534b21e94fc68c4c0c034b0902ed844f2f6cd1b4f7';
    const UNISWAP_BASE_SALT = '0x1d6a6a0506b0b4a554b907a4c29d9f4674e461989d9c1921feb17b26716385ab';
    const ERC20_PROXY_ID = '0xf47261b0';
    const INVALID_ASSET_PROXY_ASSET_DATA = hexConcat('0xf47261b1', hexLeftPad(randomAddress()));
    const INVALID_ASSET_DATA = hexRandom(37);
    const SELL_SOURCES = ['Eth2Dai', 'Kyber', 'Uniswap'];
    const BUY_SOURCES = ['Eth2Dai', 'Uniswap'];
    const EMPTY_ORDERS_ERROR = 'EMPTY_ORDERS';
    const UNSUPPORTED_ASSET_PROXY_ERROR = 'UNSUPPORTED_ASSET_PROXY';
    const INVALID_ASSET_DATA_ERROR = 'INVALID_ASSET_DATA';
    const UNSUPPORTED_UNISWAP_EXCHANGE_ERROR = 'UNSUPPORTED_UNISWAP_EXCHANGE';
    const UNSUPPORTED_SOURCE_ERROR = 'UNSUPPORTED_SOURCE';
    const INVALID_TOKEN_PAIR_ERROR = 'INVALID_TOKEN_PAIR';

    before(async () => {
        testContract = await TestERC20BridgeSamplerContract.deployFrom0xArtifactAsync(
            artifacts.TestERC20BridgeSampler,
            env.provider,
            env.txDefaults,
            {},
        );
        allSources = _.zipObject(
            ['Uniswap', 'Eth2Dai', 'Kyber'],
            [
                await testContract.uniswap().callAsync(),
                await testContract.eth2Dai().callAsync(),
                await testContract.kyber().callAsync(),
            ],
        );
    });

    function getPackedHash(...args: string[]): string {
        return hexHash(hexConcat(...args.map(a => toHex(a))));
    }

    function getUniswapExchangeSalt(tokenAddress: string): string {
        return getPackedHash(UNISWAP_BASE_SALT, tokenAddress);
    }

    function getDeterministicRate(salt: string, sellToken: string, buyToken: string): BigNumber {
        const hash = getPackedHash(salt, sellToken, buyToken);
        const _minRate = RATE_DENOMINATOR.times(MIN_RATE);
        const _maxRate = RATE_DENOMINATOR.times(MAX_RATE);
        return new BigNumber(hash)
            .mod(_maxRate.minus(_minRate))
            .plus(_minRate)
            .div(RATE_DENOMINATOR);
    }

    function getDeterministicTokenDecimals(token: string): number {
        if (token === WETH_ADDRESS) {
            return 18;
        }
        // HACK(dorothy-zbornak): Linter will complain about the addition not being
        // between two numbers, even though they are.
        // tslint:disable-next-line restrict-plus-operands
        return new BigNumber(getPackedHash(token)).mod(MAX_DECIMALS - MIN_DECIMALS).toNumber() + MIN_DECIMALS;
    }

    function getDeterministicSellQuote(
        salt: string,
        sellToken: string,
        buyToken: string,
        sellAmount: BigNumber,
    ): BigNumber {
        const sellBase = new BigNumber(10).pow(getDeterministicTokenDecimals(sellToken));
        const buyBase = new BigNumber(10).pow(getDeterministicTokenDecimals(buyToken));
        const rate = getDeterministicRate(salt, sellToken, buyToken);
        return sellAmount
            .times(rate)
            .times(buyBase)
            .dividedToIntegerBy(sellBase);
    }

    function getDeterministicBuyQuote(
        salt: string,
        sellToken: string,
        buyToken: string,
        buyAmount: BigNumber,
    ): BigNumber {
        const sellBase = new BigNumber(10).pow(getDeterministicTokenDecimals(sellToken));
        const buyBase = new BigNumber(10).pow(getDeterministicTokenDecimals(buyToken));
        const rate = getDeterministicRate(salt, sellToken, buyToken);
        return buyAmount
            .times(sellBase)
            .dividedToIntegerBy(rate)
            .dividedToIntegerBy(buyBase);
    }

    function areAddressesEqual(a: string, b: string): boolean {
        return a.toLowerCase() === b.toLowerCase();
    }

    function getDeterministicUniswapSellQuote(sellToken: string, buyToken: string, sellAmount: BigNumber): BigNumber {
        if (areAddressesEqual(buyToken, WETH_ADDRESS)) {
            return getDeterministicSellQuote(getUniswapExchangeSalt(sellToken), sellToken, WETH_ADDRESS, sellAmount);
        }
        if (areAddressesEqual(sellToken, WETH_ADDRESS)) {
            return getDeterministicSellQuote(getUniswapExchangeSalt(buyToken), buyToken, WETH_ADDRESS, sellAmount);
        }
        const ethBought = getDeterministicSellQuote(
            getUniswapExchangeSalt(sellToken),
            sellToken,
            WETH_ADDRESS,
            sellAmount,
        );
        return getDeterministicSellQuote(getUniswapExchangeSalt(buyToken), buyToken, WETH_ADDRESS, ethBought);
    }

    function getDeterministicUniswapBuyQuote(sellToken: string, buyToken: string, buyAmount: BigNumber): BigNumber {
        if (areAddressesEqual(buyToken, WETH_ADDRESS)) {
            return getDeterministicBuyQuote(getUniswapExchangeSalt(sellToken), WETH_ADDRESS, sellToken, buyAmount);
        }
        if (areAddressesEqual(sellToken, WETH_ADDRESS)) {
            return getDeterministicBuyQuote(getUniswapExchangeSalt(buyToken), WETH_ADDRESS, buyToken, buyAmount);
        }
        const ethSold = getDeterministicBuyQuote(getUniswapExchangeSalt(buyToken), WETH_ADDRESS, buyToken, buyAmount);
        return getDeterministicBuyQuote(getUniswapExchangeSalt(sellToken), WETH_ADDRESS, sellToken, ethSold);
    }

    function getDeterministicSellQuotes(
        sellToken: string,
        buyToken: string,
        sources: string[],
        sampleAmounts: BigNumber[],
    ): BigNumber[][] {
        const quotes: BigNumber[][] = [];
        for (const source of sources) {
            const sampleOutputs = [];
            for (const amount of sampleAmounts) {
                if (source === 'Kyber' || source === 'Eth2Dai') {
                    sampleOutputs.push(
                        getDeterministicSellQuote(
                            source === 'Kyber' ? KYBER_SALT : ETH2DAI_SALT,
                            sellToken,
                            buyToken,
                            amount,
                        ),
                    );
                } else if (source === 'Uniswap') {
                    sampleOutputs.push(getDeterministicUniswapSellQuote(sellToken, buyToken, amount));
                }
            }
            quotes.push(sampleOutputs);
        }
        return quotes;
    }

    function getDeterministicBuyQuotes(
        sellToken: string,
        buyToken: string,
        sources: string[],
        sampleAmounts: BigNumber[],
    ): BigNumber[][] {
        const quotes: BigNumber[][] = [];
        for (const source of sources) {
            const sampleOutputs = [];
            for (const amount of sampleAmounts) {
                if (source === 'Eth2Dai') {
                    sampleOutputs.push(getDeterministicBuyQuote(ETH2DAI_SALT, sellToken, buyToken, amount));
                } else if (source === 'Uniswap') {
                    sampleOutputs.push(getDeterministicUniswapBuyQuote(sellToken, buyToken, amount));
                }
            }
            quotes.push(sampleOutputs);
        }
        return quotes;
    }

    function getDeterministicOrderInfo(order: Order): OrderInfo {
        const hash = getPackedHash(hexLeftPad(order.salt, 32));
        return {
            orderHash: hash,
            orderStatus: new BigNumber(hash).mod(255).toNumber(),
            orderTakerAssetFilledAmount: new BigNumber(hash).mod(order.takerAssetAmount),
        };
    }

    function getERC20AssetData(tokenAddress: string): string {
        return hexConcat(ERC20_PROXY_ID, hexLeftPad(tokenAddress));
    }

    function getSampleAmounts(tokenAddress: string, count?: number): BigNumber[] {
        const tokenDecimals = getDeterministicTokenDecimals(tokenAddress);
        const _upperLimit = getRandomPortion(getRandomInteger(1, 1000).times(10 ** tokenDecimals));
        const _count = count || _.random(1, 16);
        const d = _upperLimit.div(_count);
        return _.times(_count, i => d.times((i + 1) / _count).integerValue());
    }

    function createOrder(makerToken: string, takerToken: string): Order {
        return {
            chainId: 1337,
            exchangeAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            senderAddress: randomAddress(),
            feeRecipientAddress: randomAddress(),
            makerAssetAmount: getRandomInteger(1, 1e18),
            takerAssetAmount: getRandomInteger(1, 1e18),
            makerFee: getRandomInteger(1, 1e18),
            takerFee: getRandomInteger(1, 1e18),
            makerAssetData: getERC20AssetData(makerToken),
            takerAssetData: getERC20AssetData(takerToken),
            makerFeeAssetData: getERC20AssetData(randomAddress()),
            takerFeeAssetData: getERC20AssetData(randomAddress()),
            salt: new BigNumber(hexRandom()),
            expirationTimeSeconds: getRandomInteger(0, 2 ** 32),
        };
    }

    function createOrders(makerToken: string, takerToken: string, count?: number): Order[] {
        return _.times(count || _.random(1, 16), () => createOrder(makerToken, takerToken));
    }

    describe('queryOrders()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        it('returns the results of `getOrderInfo()` for each order', async () => {
            const orders = createOrders(MAKER_TOKEN, TAKER_TOKEN);
            const expected = orders.map(getDeterministicOrderInfo);
            const actual = await testContract.queryOrders(orders).callAsync();
            expect(actual).to.deep.eq(expected);
        });

        it('returns empty for no orders', async () => {
            const actual = await testContract.queryOrders([]).callAsync();
            expect(actual).to.deep.eq([]);
        });
    });

    describe('queryOrdersAndSampleSells()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('returns the results of `getOrderInfo()` for each order', async () => {
            const takerTokenAmounts = getSampleAmounts(TAKER_TOKEN);
            const orders = createOrders(MAKER_TOKEN, TAKER_TOKEN);
            const expectedOrderInfos = orders.map(getDeterministicOrderInfo);
            const [orderInfos] = await testContract
                .queryOrdersAndSampleSells(orders, SELL_SOURCES.map(n => allSources[n]), takerTokenAmounts)
                .callAsync();
            expect(orderInfos).to.deep.eq(expectedOrderInfos);
        });

        it('can return quotes for all sources', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const expectedQuotes = getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, SELL_SOURCES, sampleAmounts);
            const [, quotes] = await testContract
                .queryOrdersAndSampleSells(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN),
                    SELL_SOURCES.map(n => allSources[n]),
                    sampleAmounts,
                )
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('throws if no orders are passed in', async () => {
            const tx = testContract
                .queryOrdersAndSampleSells([], SELL_SOURCES.map(n => allSources[n]), getSampleAmounts(TAKER_TOKEN))
                .callAsync();
            return expect(tx).to.revertWith(EMPTY_ORDERS_ERROR);
        });

        it('throws with an unsupported source', async () => {
            const tx = testContract
                .queryOrdersAndSampleSells(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN),
                    [...SELL_SOURCES.map(n => allSources[n]), randomAddress()],
                    getSampleAmounts(TAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_SOURCE_ERROR);
        });

        it('throws with non-ERC20 maker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleSells(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        makerAssetData: INVALID_ASSET_PROXY_ASSET_DATA,
                    })),
                    SELL_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(TAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_ASSET_PROXY_ERROR);
        });

        it('throws with non-ERC20 taker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleSells(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        takerAssetData: INVALID_ASSET_PROXY_ASSET_DATA,
                    })),
                    SELL_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(TAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_ASSET_PROXY_ERROR);
        });

        it('throws with invalid maker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleSells(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        makerAssetData: INVALID_ASSET_DATA,
                    })),
                    SELL_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(TAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(INVALID_ASSET_DATA_ERROR);
        });

        it('throws with invalid taker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleSells(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        takerAssetData: INVALID_ASSET_DATA,
                    })),
                    SELL_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(TAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(INVALID_ASSET_DATA_ERROR);
        });
    });

    describe('queryOrdersAndSampleBuys()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('returns the results of `getOrderInfo()` for each order', async () => {
            const takerTokenAmounts = getSampleAmounts(MAKER_TOKEN);
            const orders = createOrders(MAKER_TOKEN, TAKER_TOKEN);
            const expectedOrderInfos = orders.map(getDeterministicOrderInfo);
            const [orderInfos] = await testContract
                .queryOrdersAndSampleBuys(orders, BUY_SOURCES.map(n => allSources[n]), takerTokenAmounts)
                .callAsync();
            expect(orderInfos).to.deep.eq(expectedOrderInfos);
        });

        it('can return quotes for all sources', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const expectedQuotes = getDeterministicBuyQuotes(TAKER_TOKEN, MAKER_TOKEN, BUY_SOURCES, sampleAmounts);
            const [, quotes] = await testContract
                .queryOrdersAndSampleBuys(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN),
                    BUY_SOURCES.map(n => allSources[n]),
                    sampleAmounts,
                )
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('throws if no orders are passed in', async () => {
            const tx = testContract
                .queryOrdersAndSampleBuys([], BUY_SOURCES.map(n => allSources[n]), getSampleAmounts(MAKER_TOKEN))
                .callAsync();
            return expect(tx).to.revertWith(EMPTY_ORDERS_ERROR);
        });

        it('throws with an unsupported source', async () => {
            const tx = testContract
                .queryOrdersAndSampleBuys(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN),
                    [...BUY_SOURCES.map(n => allSources[n]), randomAddress()],
                    getSampleAmounts(MAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_SOURCE_ERROR);
        });

        it('throws if kyber is passed in as a source', async () => {
            const sources = [...BUY_SOURCES, 'Kyber'];
            const tx = testContract
                .queryOrdersAndSampleBuys(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN),
                    sources.map(n => allSources[n]),
                    getSampleAmounts(MAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_SOURCE_ERROR);
        });

        it('throws with non-ERC20 maker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleBuys(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        makerAssetData: INVALID_ASSET_PROXY_ASSET_DATA,
                    })),
                    BUY_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(MAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_ASSET_PROXY_ERROR);
        });

        it('throws with non-ERC20 taker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleBuys(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        takerAssetData: INVALID_ASSET_PROXY_ASSET_DATA,
                    })),
                    BUY_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(MAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_ASSET_PROXY_ERROR);
        });

        it('throws with invalid maker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleBuys(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        makerAssetData: INVALID_ASSET_DATA,
                    })),
                    BUY_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(MAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(INVALID_ASSET_DATA_ERROR);
        });

        it('throws with invalid taker asset data', async () => {
            const tx = testContract
                .queryOrdersAndSampleBuys(
                    createOrders(MAKER_TOKEN, TAKER_TOKEN).map(o => ({
                        ...o,
                        takerAssetData: INVALID_ASSET_DATA,
                    })),
                    BUY_SOURCES.map(n => allSources[n]),
                    getSampleAmounts(MAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(INVALID_ASSET_DATA_ERROR);
        });
    });

    describe('sampleSells()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('returns empty quotes with no sample amounts', async () => {
            const emptyQuotes = _.times(SELL_SOURCES.length, () => []);
            const quotes = await testContract
                .sampleSells(SELL_SOURCES.map(n => allSources[n]), TAKER_TOKEN, MAKER_TOKEN, [])
                .callAsync();
            expect(quotes).to.deep.eq(emptyQuotes);
        });

        it('can return quotes for all sources', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const expectedQuotes = getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, SELL_SOURCES, sampleAmounts);
            const quotes = await testContract
                .sampleSells(SELL_SOURCES.map(n => allSources[n]), TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can return quotes for some sources', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const sources = _.sampleSize(SELL_SOURCES, 1);
            const expectedQuotes = getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, sources, sampleAmounts);
            const quotes = await testContract
                .sampleSells(sources.map(n => allSources[n]), TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('throws with an unsupported source', async () => {
            const tx = testContract
                .sampleSells(
                    [...SELL_SOURCES.map(n => allSources[n]), randomAddress()],
                    TAKER_TOKEN,
                    MAKER_TOKEN,
                    getSampleAmounts(TAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_SOURCE_ERROR);
        });
    });

    describe('sampleBuys()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('returns empty quotes with no sample amounts', async () => {
            const emptyQuotes = _.times(BUY_SOURCES.length, () => []);
            const quotes = await testContract
                .sampleBuys(BUY_SOURCES.map(n => allSources[n]), TAKER_TOKEN, MAKER_TOKEN, [])
                .callAsync();
            expect(quotes).to.deep.eq(emptyQuotes);
        });

        it('can return quotes for all sources', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const expectedQuotes = getDeterministicBuyQuotes(TAKER_TOKEN, MAKER_TOKEN, BUY_SOURCES, sampleAmounts);
            const quotes = await testContract
                .sampleBuys(BUY_SOURCES.map(n => allSources[n]), TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can return quotes for some sources', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const sources = _.sampleSize(BUY_SOURCES, 1);
            const expectedQuotes = getDeterministicBuyQuotes(TAKER_TOKEN, MAKER_TOKEN, sources, sampleAmounts);
            const quotes = await testContract
                .sampleBuys(sources.map(n => allSources[n]), TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('throws with an unsupported source', async () => {
            const tx = testContract
                .sampleBuys(
                    [...BUY_SOURCES.map(n => allSources[n]), randomAddress()],
                    TAKER_TOKEN,
                    MAKER_TOKEN,
                    getSampleAmounts(MAKER_TOKEN),
                )
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_SOURCE_ERROR);
        });

        it('throws if kyber is passed in as a source', async () => {
            const sources = [...BUY_SOURCES, 'Kyber'];
            const tx = testContract
                .sampleBuys(sources.map(n => allSources[n]), TAKER_TOKEN, MAKER_TOKEN, getSampleAmounts(MAKER_TOKEN))
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_SOURCE_ERROR);
        });
    });

    describe('sampleSellsFromKyberNetwork()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('throws if tokens are the same', async () => {
            const tx = testContract.sampleSellsFromKyberNetwork(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            return expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR);
        });

        it('can return no quotes', async () => {
            const quotes = await testContract.sampleSellsFromKyberNetwork(TAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            expect(quotes).to.deep.eq([]);
        });

        it('can return many quotes', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Kyber'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromKyberNetwork(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote token -> ETH', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Kyber'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromKyberNetwork(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote ETH -> token', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Kyber'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromKyberNetwork(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });
    });

    describe('sampleSellsFromEth2Dai()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('throws if tokens are the same', async () => {
            const tx = testContract.sampleSellsFromEth2Dai(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            return expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR);
        });

        it('can return no quotes', async () => {
            const quotes = await testContract.sampleSellsFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            expect(quotes).to.deep.eq([]);
        });

        it('can return many quotes', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Eth2Dai'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote token -> ETH', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Eth2Dai'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromEth2Dai(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote ETH -> token', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Eth2Dai'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromEth2Dai(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });
    });

    describe('sampleBuysFromEth2Dai()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('throws if tokens are the same', async () => {
            const tx = testContract.sampleBuysFromEth2Dai(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            return expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR);
        });

        it('can return no quotes', async () => {
            const quotes = await testContract.sampleBuysFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            expect(quotes).to.deep.eq([]);
        });

        it('can return many quotes', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const [expectedQuotes] = getDeterministicBuyQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Eth2Dai'], sampleAmounts);
            const quotes = await testContract
                .sampleBuysFromEth2Dai(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote token -> ETH', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const [expectedQuotes] = getDeterministicBuyQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Eth2Dai'], sampleAmounts);
            const quotes = await testContract
                .sampleBuysFromEth2Dai(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote ETH -> token', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const [expectedQuotes] = getDeterministicBuyQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Eth2Dai'], sampleAmounts);
            const quotes = await testContract
                .sampleBuysFromEth2Dai(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });
    });

    describe('sampleSellsFromUniswap()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('throws if tokens are the same', async () => {
            const tx = testContract.sampleSellsFromUniswap(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            return expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR);
        });

        it('can return no quotes', async () => {
            const quotes = await testContract.sampleSellsFromUniswap(TAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            expect(quotes).to.deep.eq([]);
        });

        it('can return many quotes', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Uniswap'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromUniswap(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote token -> ETH', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Uniswap'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromUniswap(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote ETH -> token', async () => {
            const sampleAmounts = getSampleAmounts(TAKER_TOKEN);
            const [expectedQuotes] = getDeterministicSellQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Uniswap'], sampleAmounts);
            const quotes = await testContract
                .sampleSellsFromUniswap(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('throws if no exchange exists for the maker token', async () => {
            const nonExistantToken = randomAddress();
            const tx = testContract
                .sampleSellsFromUniswap(TAKER_TOKEN, nonExistantToken, getSampleAmounts(TAKER_TOKEN))
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_UNISWAP_EXCHANGE_ERROR);
        });

        it('throws if no exchange exists for the taker token', async () => {
            const nonExistantToken = randomAddress();
            const tx = testContract
                .sampleSellsFromUniswap(nonExistantToken, MAKER_TOKEN, getSampleAmounts(nonExistantToken))
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_UNISWAP_EXCHANGE_ERROR);
        });
    });

    describe('sampleBuysFromUniswap()', () => {
        const MAKER_TOKEN = randomAddress();
        const TAKER_TOKEN = randomAddress();

        before(async () => {
            await testContract.createTokenExchanges([MAKER_TOKEN, TAKER_TOKEN]).awaitTransactionSuccessAsync();
        });

        it('throws if tokens are the same', async () => {
            const tx = testContract.sampleBuysFromUniswap(MAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            return expect(tx).to.revertWith(INVALID_TOKEN_PAIR_ERROR);
        });

        it('can return no quotes', async () => {
            const quotes = await testContract.sampleBuysFromUniswap(TAKER_TOKEN, MAKER_TOKEN, []).callAsync();
            expect(quotes).to.deep.eq([]);
        });

        it('can return many quotes', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const [expectedQuotes] = getDeterministicBuyQuotes(TAKER_TOKEN, MAKER_TOKEN, ['Uniswap'], sampleAmounts);
            const quotes = await testContract
                .sampleBuysFromUniswap(TAKER_TOKEN, MAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote token -> ETH', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const [expectedQuotes] = getDeterministicBuyQuotes(TAKER_TOKEN, WETH_ADDRESS, ['Uniswap'], sampleAmounts);
            const quotes = await testContract
                .sampleBuysFromUniswap(TAKER_TOKEN, WETH_ADDRESS, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('can quote ETH -> token', async () => {
            const sampleAmounts = getSampleAmounts(MAKER_TOKEN);
            const [expectedQuotes] = getDeterministicBuyQuotes(WETH_ADDRESS, TAKER_TOKEN, ['Uniswap'], sampleAmounts);
            const quotes = await testContract
                .sampleBuysFromUniswap(WETH_ADDRESS, TAKER_TOKEN, sampleAmounts)
                .callAsync();
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('throws if no exchange exists for the maker token', async () => {
            const nonExistantToken = randomAddress();
            const tx = testContract
                .sampleBuysFromUniswap(TAKER_TOKEN, nonExistantToken, getSampleAmounts(TAKER_TOKEN))
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_UNISWAP_EXCHANGE_ERROR);
        });

        it('throws if no exchange exists for the taker token', async () => {
            const nonExistantToken = randomAddress();
            const tx = testContract
                .sampleBuysFromUniswap(nonExistantToken, MAKER_TOKEN, getSampleAmounts(nonExistantToken))
                .callAsync();
            return expect(tx).to.revertWith(UNSUPPORTED_UNISWAP_EXCHANGE_ERROR);
        });
    });
});
