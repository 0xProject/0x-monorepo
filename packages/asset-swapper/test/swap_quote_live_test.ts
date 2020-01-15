import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';

import { BigNumber, logUtils, providerUtils } from '@0x/utils';
import fetchAsync from 'axios';
import * as _ from 'lodash';

import { SwapQuoter } from '../src/swap_quoter';

// tslint:disable: custom-no-magic-numbers
describe.skip('swap quote live test', () => {
    const TAKER_TOKEN = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const MAKER_TOKEN = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
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

    async function fetchDexAgQuoteAsync(fillSize: BigNumber): Promise<BigNumber> {
        const response = await fetchAsync({
            url: 'https://api.dex.ag/price',
            params: {
                to: 'ETH',
                from: 'DAI',
                dex: 'ag',
                fromAmount: fillSize.dividedToIntegerBy(TOKEN_UNITS_BASE).toString(10),
            },
        });
        return new BigNumber(response.data.price);
    }

    const USD_VALUES = [1e3, 5e3, 10e3, 50e3, 100e3];
    const TEST_SCENARIOS = USD_VALUES.map(v => [new BigNumber(v), TOKEN_UNITS_BASE.times(v)]);
    const OPTS = {
        // runLimit: 2 ** 15,
        // numSamples: 11,
        // slippagePercentage: 0.15,
        // bridgeSlippage: 0,
        // dustFractionThreshold: 0.0025,
        // sampleDistributionBase: 1.25,
    };

    for (const [usdValue, fillSize] of TEST_SCENARIOS) {
        it(`${usdValue} DAI -> ETH quote`, async () => {
            const [sq, competitorPrice] = await Promise.all([
                swapQuoter.getMarketSellSwapQuoteAsync(MAKER_TOKEN, TAKER_TOKEN, fillSize, OPTS),
                await fetchDexAgQuoteAsync(fillSize),
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
});
// tslint:disable-next-line: max-file-line-count
