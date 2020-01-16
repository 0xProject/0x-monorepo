import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';

import { BigNumber, logUtils, providerUtils } from '@0x/utils';
import fetchAsync from 'axios';
import * as _ from 'lodash';

import { SwapQuoter } from '../src/swap_quoter';
import { ERC20BridgeSource } from '../src/utils/market_operation_utils/types';

// tslint:disable: custom-no-magic-numbers
describe.only('swap quote live test', () => {
    const DAI_TOKEN = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const ETH_TOKEN = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const USDT_TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const SNX_TOKEN = '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F';
    const TOKEN_UNITS_BASE = new BigNumber(10).pow(18);
    let swapQuoter: SwapQuoter;

    function createWeb3Provider(rpcHost: string): Web3ProviderEngine {
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new RPCSubprovider(rpcHost));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }

    before(async () => {
        swapQuoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(
            createWeb3Provider(process.env.LIVE_RPC_URL as string),
            'https://api.0x.org/sra',
        );
    });

    async function fetch1InchQuoteAsync(fillSize: BigNumber): Promise<BigNumber> {
        const response = await fetchAsync({
            url: 'https://api.1inch.exchange/v1.1/quote',
            params: {
                toTokenSymbol: 'ETH',
                fromTokenSymbol: 'DAI',
                disabledExchangesList: ['Bancor', 'Airswap', 'PMM'].join(','),
                amount: fillSize.toString(10),
            },
        });
        return new BigNumber(response.data.toTokenAmount);
    }

    async function fetchDexAgQuoteAsync(fromToken: string, toToken: string, fillSize: BigNumber): Promise<BigNumber> {
        const response = await fetchAsync({
            url: 'https://api.dex.ag/price',
            params: {
                to: toToken,
                from: fromToken,
                dex: 'ag',
                fromAmount: fillSize.div(TOKEN_UNITS_BASE).toString(10),
            },
        });
        return new BigNumber(response.data.price);
    }

    const USD_VALUES = [100, 1e3, 5e3, 10e3, 50e3, 100e3];
    let TEST_SCENARIOS = USD_VALUES.map(v => [new BigNumber(v), TOKEN_UNITS_BASE.times(v)]);
    const OPTS = {
        // runLimit: 2 ** 17,
        // numSamples: 11,
        // slippagePercentage: 0,
        // bridgeSlippage: 0,
        // dustFractionThreshold: 0.0025,
        // sampleDistributionBase: 0.95,
    };

    for (const [usdValue, fillSize] of TEST_SCENARIOS) {
        it(`${usdValue} DAI -> ETH quote`, async () => {
            const [sq, competitorPrice] = await Promise.all([
                swapQuoter.getMarketSellSwapQuoteAsync(ETH_TOKEN, DAI_TOKEN, fillSize, OPTS),
                fetchDexAgQuoteAsync('DAI', 'ETH', fillSize),
            ]);
            const price = sq.bestCaseQuoteInfo.makerAssetAmount.div(sq.bestCaseQuoteInfo.takerAssetAmount);
            const gain = price.minus(competitorPrice).div(BigNumber.max(price, competitorPrice));
            logUtils.log({
                ourPrice: price,
                dexAgPrice: competitorPrice,
                gain: `${gain.times(100).toFixed(3)}%`,
            });
        });
    }

    const ETH_DAI_PRICE = 160;
    TEST_SCENARIOS = USD_VALUES.map(v => [new BigNumber(v), TOKEN_UNITS_BASE.times(v / ETH_DAI_PRICE)]);
    for (const [usdValue, fillSize] of TEST_SCENARIOS) {
        it(`$${usdValue} of ETH -> DAI quote`, async () => {
            const [sq, competitorPrice] = await Promise.all([
                swapQuoter.getMarketSellSwapQuoteAsync(DAI_TOKEN, ETH_TOKEN, fillSize, OPTS),
                fetchDexAgQuoteAsync('ETH', 'DAI', fillSize),
            ]);
            const price = sq.bestCaseQuoteInfo.makerAssetAmount.div(sq.bestCaseQuoteInfo.takerAssetAmount);
            const gain = price.minus(competitorPrice).div(BigNumber.max(price, competitorPrice));
            logUtils.log({
                ourPrice: price,
                dexAgPrice: competitorPrice,
                gain: `${gain.times(100).toFixed(3)}%`,
            });
        });
    }

    const ETH_SNX_PRICE = 0.91;
    TEST_SCENARIOS = USD_VALUES.slice(-1).map(v => [new BigNumber(v), TOKEN_UNITS_BASE.times(v / ETH_DAI_PRICE / ETH_SNX_PRICE)]);
    for (const [usdValue, fillSize] of TEST_SCENARIOS) {
        it.only(`$${usdValue} of ETH -> SNX quote`, async () => {
            const [sq, competitorPrice] = await Promise.all([
                swapQuoter.getMarketSellSwapQuoteAsync(SNX_TOKEN, ETH_TOKEN, fillSize, OPTS ),
                fetchDexAgQuoteAsync('ETH', 'SNX', fillSize),
            ]);
            console.log(fillSize, sq.bestCaseQuoteInfo, sq.orders);
            const price = sq.bestCaseQuoteInfo.makerAssetAmount.div(sq.bestCaseQuoteInfo.takerAssetAmount);
            const gain = price.minus(competitorPrice).div(BigNumber.max(price, competitorPrice));
            logUtils.log({
                ourPrice: price,
                dexAgPrice: competitorPrice,
                gain: `${gain.times(100).toFixed(3)}%`,
            });
        });
    }

    it(`10 ETH -> USDT quote`, async () => {
        const fillSize = new BigNumber(10).pow(18).times(10);
        const fromToken = ETH_TOKEN;
        const toToken = USDT_TOKEN;
        const [sq, competitorPrice] = await Promise.all([
            swapQuoter.getMarketSellSwapQuoteAsync(toToken, fromToken, fillSize, OPTS),
            fetchDexAgQuoteAsync('ETH', 'USDT', fillSize),
        ]);
        const price = sq.bestCaseQuoteInfo.makerAssetAmount.div(1e6).div(sq.bestCaseQuoteInfo.takerAssetAmount.div(1e18));
        const gain = price.minus(competitorPrice).div(BigNumber.max(price, competitorPrice));
        logUtils.log({
            ourPrice: price,
            dexAgPrice: competitorPrice,
            gain: `${gain.times(100).toFixed(3)}%`,
        });
    });
});
// tslint:disable-next-line: max-file-line-count
