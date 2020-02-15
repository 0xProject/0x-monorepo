import { artifacts, ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { blockchainTests, describe, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

blockchainTests.fork.resets('Mainnet Sampler Tests', env => {
    let testContract: ERC20BridgeSamplerContract;
    before(async () => {
        testContract = await ERC20BridgeSamplerContract.deployFrom0xArtifactAsync(
            artifacts.ERC20BridgeSampler,
            env.provider,
            { ...env.txDefaults, from: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b' },
            {},
        );
    });

    describe('sampleSellsFromCurve()', () => {
        const curveAddress = '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51';
        const daiTokenIdx = new BigNumber(0);
        const usdcTokenIdx = new BigNumber(1);

        it('samples sells from Curve DAI->USDC', async () => {
            const samples = await testContract
                .sampleSellsFromCurve(curveAddress, daiTokenIdx, usdcTokenIdx, [toBaseUnitAmount(1)])
                .callAsync();
            expect(samples.length).to.be.bignumber.greaterThan(0);
            expect(samples[0]).to.be.bignumber.greaterThan(0);
        });

        it('samples sells from Curve USDC->DAI', async () => {
            const samples = await testContract
                .sampleSellsFromCurve(curveAddress, usdcTokenIdx, daiTokenIdx, [toBaseUnitAmount(1, 6)])
                .callAsync();
            expect(samples.length).to.be.bignumber.greaterThan(0);
            expect(samples[0]).to.be.bignumber.greaterThan(0);
        });
    });
});
