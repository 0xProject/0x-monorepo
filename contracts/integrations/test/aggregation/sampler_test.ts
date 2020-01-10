import { SwapQuoter } from '@0x/asset-swapper';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import * as _ from 'lodash';

import { tokens } from './tokens';

blockchainTests.live.only('ERC20BridgeSampler Mainnet Tests', env => {
    const ETH_TOKEN = tokens.ETH;

    describe('sampler', () => {
        let sampler: ERC20BridgeSamplerContract;
        before(async () => {
            const { erc20BridgeSampler: samplerAddress } =
                getContractAddressesForChainOrThrow(await env.getChainIdAsync());
            sampler = new ERC20BridgeSamplerContract(samplerAddress, env.provider, env.txDefaults);
        });

        function getSampleAmounts(maxAmount: Numberish, count: number = 16): BigNumber[] {
            const stepSize = new BigNumber(maxAmount).div(Math.max(1, count - 1));
            return _.times(count, i => stepSize.times(i).integerValue());
        }

        it('can get valid sETH samples from uniswap', async () => {
            const token = tokens.sETH;
            const amount = new BigNumber(10).pow(token.decimals).times(10);
            const samples = getSampleAmounts(amount);
            const r = await sampler.sampleSellsFromUniswap(ETH_TOKEN.address, token.address, samples).callAsync();
            expect(_.some(r, v => !v.isZero())).to.be.true();
        });
    });

    describe('swap quoter', () => {
        const swapQuoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(env.provider, 'https://api.0x.org/sra');

        it('can get a sETH market sell from SwapQuoter', async () => {
            const token = tokens.sETH;
            const amount = new BigNumber(10).pow(token.decimals).times(10);
            const quote = await swapQuoter.getMarketSellSwapQuoteAsync(token.address, ETH_TOKEN.address, amount);
            const { makerAssetAmount } = quote.bestCaseQuoteInfo;
            logUtils.log(makerAssetAmount);
            expect(makerAssetAmount).to.bignumber.not.eq(0);
        });

        it('can get a sETH market buy from SwapQuoter', async () => {
            const token = tokens.sETH;
            const amount = new BigNumber(10).pow(token.decimals).times(10);
            const quote = await swapQuoter.getMarketBuySwapQuoteAsync(token.address, ETH_TOKEN.address, amount);
            const { takerAssetAmount } = quote.bestCaseQuoteInfo;
            logUtils.log(takerAssetAmount);
            expect(takerAssetAmount).to.bignumber.not.eq(0);
        });
    });
});
