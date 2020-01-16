import { SwapQuoter } from '@0x/asset-swapper';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { artifacts as samplerArtifacts, ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import * as _ from 'lodash';

import { IKyberNetworkContract } from './i_kyber_network';
import { tokens } from './tokens';

blockchainTests.live.only('ERC20BridgeSampler Mainnet Tests', env => {
    const ETH_TOKEN = tokens.ETH;

    describe('USDT tests', () => {
        let samplerAddress: string;
        let token: ERC20TokenContract;

        before(async () => {
            samplerAddress = getContractAddressesForChainOrThrow(await env.getChainIdAsync()).erc20BridgeSampler;
            token = new ERC20TokenContract(tokens.USDT.address, env.provider, env.txDefaults);
        });

        it('has decials', async () => {
            const decimals = await token.decimals().callAsync({ from: samplerAddress });
            expect(decimals).to.bignumber.eq(6);
        });
    });

    describe('direct kyber tests', () => {
        let samplerAddress: string;
        let kyber: IKyberNetworkContract;

        before(async () => {
            samplerAddress = getContractAddressesForChainOrThrow(await env.getChainIdAsync()).erc20BridgeSampler;
            kyber = new IKyberNetworkContract(
                '0x818E6FECD516Ecc3849DAf6845e3EC868087B755',
                env.provider,
                env.txDefaults,
            );
        });

        it('can get an ETH -> USDT sell quote directly from kyber', async () => {
            const token = tokens.USDT;
            const amount = new BigNumber(10).pow(ETH_TOKEN.decimals).times(10);
            const r = await kyber
                .getExpectedRate('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', token.address, amount)
                .callAsync({ from: samplerAddress });
            logUtils.log(r);
        });

        it('can get a big ETH -> DAI sell quote directly from kyber', async () => {
            const token = tokens.DAI;
            const amount = new BigNumber(10).pow(token.decimals).times(80e3);
            const r = await kyber
                .getExpectedRate(token.address, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', amount)
                .callAsync({ gas: 1e6 });
            logUtils.log(r);
        });
    });

    describe('sampler', () => {
        let sampler: ERC20BridgeSamplerContract;
        before(async () => {
            const { erc20BridgeSampler: samplerAddress } = getContractAddressesForChainOrThrow(
                await env.getChainIdAsync(),
            );
            sampler = new ERC20BridgeSamplerContract(samplerAddress, env.provider, env.txDefaults);
        });

        function getSampleAmounts(maxAmount: Numberish, count: number = 16): BigNumber[] {
            const stepSize = new BigNumber(maxAmount).div(Math.max(1, count - 1));
            return _.times(count, i => stepSize.times(i).integerValue());
        }

        it('can get valid ETH -> sETH sell samples from uniswap', async () => {
            const token = tokens.sETH;
            const amount = new BigNumber(10).pow(ETH_TOKEN.decimals).times(10);
            const samples = getSampleAmounts(amount);
            const r = await sampler.sampleSellsFromUniswap(ETH_TOKEN.address, token.address, samples).callAsync();
            expect(_.some(r, v => !v.isZero())).to.be.true();
        });

        it('can get valid ETH -> USDT sell samples from kyber', async () => {
            const token = tokens.USDT;
            const amount = new BigNumber(10).pow(token.decimals).times(10);
            const samples = getSampleAmounts(amount);
            const r = await sampler.sampleSellsFromKyberNetwork(ETH_TOKEN.address, token.address, samples).callAsync();
            expect(_.some(r, v => !v.isZero())).to.be.true();
        });
    });

    describe('swap quoter', () => {
        const swapQuoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(env.provider, 'https://api.0x.org/sra');

        it('can get a ETH -> sETH market sell from SwapQuoter', async () => {
            const token = tokens.sETH;
            const amount = new BigNumber(10).pow(ETH_TOKEN.decimals).times(10);
            const quote = await swapQuoter.getMarketSellSwapQuoteAsync(token.address, ETH_TOKEN.address, amount);
            const { makerAssetAmount } = quote.bestCaseQuoteInfo;
            expect(makerAssetAmount).to.bignumber.not.eq(0);
        });

        it('can get a ETH -> sETH market buy from SwapQuoter', async () => {
            const token = tokens.sETH;
            const amount = new BigNumber(10).pow(token.decimals).times(10);
            const quote = await swapQuoter.getMarketBuySwapQuoteAsync(token.address, ETH_TOKEN.address, amount);
            const { takerAssetAmount } = quote.bestCaseQuoteInfo;
            expect(takerAssetAmount).to.bignumber.not.eq(0);
        });

        it.only('can get a ETH -> SNX market sell from SwapQuoter', async () => {
            const token = tokens.SNX;
            const amount = new BigNumber(10).pow(ETH_TOKEN.decimals).times(10);
            const quote = await swapQuoter.getMarketSellSwapQuoteAsync(token.address, ETH_TOKEN.address, amount);
            const { makerAssetAmount } = quote.bestCaseQuoteInfo;
            expect(makerAssetAmount).to.bignumber.not.eq(0);
        });
    });
});
