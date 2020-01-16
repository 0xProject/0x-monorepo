import { artifacts as samplerArtifacts, ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import * as _ from 'lodash';

import { tokens } from './tokens';

blockchainTests.fork.skip('ERC20BridgeSampler Forekd Mainnet Tests', env => {
    const ETH_TOKEN = tokens.ETH;
    const ETH2DAI_SOURCE = '0x39755357759ce0d7f32dc8dc45414cca409ae24e';
    const UNISWAP_SOURCE = '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95';
    const KYBER_SOURCE = '0x818e6fecd516ecc3849daf6845e3ec868087b755';
    const ALL_SOURCES = [ETH2DAI_SOURCE, UNISWAP_SOURCE, KYBER_SOURCE];
    let sampler: ERC20BridgeSamplerContract;

    before(async () => {
        sampler = await ERC20BridgeSamplerContract.deployFrom0xArtifactAsync(
            samplerArtifacts.ERC20BridgeSampler,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    it.only('can get a ETH -> SNX market sell quote', async () => {
        const token = tokens.SNX;
        const amount = new BigNumber(10).pow(ETH_TOKEN.decimals).times(10);
        const samples = [amount];
        const r = await sampler.sampleSells(ALL_SOURCES, ETH_TOKEN.address, token.address, samples).callAsync();
        logUtils.log(r);
    });
});
