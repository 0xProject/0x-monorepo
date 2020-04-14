import { artifacts, ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { blockchainTests, constants, describe, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

export const VB = '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b';
blockchainTests.configure({
    fork: {
        unlockedAccounts: [VB],
    },
});

blockchainTests.fork.resets('Mainnet Sampler Tests', env => {
    let testContract: ERC20BridgeSamplerContract;
    before(async () => {
        testContract = await ERC20BridgeSamplerContract.deployFrom0xArtifactAsync(
            artifacts.ERC20BridgeSampler,
            env.provider,
            { ...env.txDefaults, from: VB },
            {},
            constants.NULL_ADDRESS,
        );
    });

    const curveAddress = '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56';
    const daiTokenIdx = new BigNumber(0);
    const usdcTokenIdx = new BigNumber(1);

    describe('sampleSellsFromCurve()', () => {
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

    describe('sampleBuysFromCurve()', () => {
        it('samples buys from Curve DAI->USDC', async () => {
            // From DAI to USDC
            // I want 1 to buy USDC
            const samples = await testContract
                .sampleBuysFromCurve(curveAddress, daiTokenIdx, usdcTokenIdx, [toBaseUnitAmount(1, 6)])
                .callAsync();
            expect(samples.length).to.be.bignumber.greaterThan(0);
            expect(samples[0]).to.be.bignumber.greaterThan(0);
        });

        it('samples buys from Curve USDC->DAI', async () => {
            // From USDC to DAI
            // I want 1 to buy 1 DAI
            const samples = await testContract
                .sampleBuysFromCurve(curveAddress, usdcTokenIdx, daiTokenIdx, [toBaseUnitAmount(1)])
                .callAsync();
            expect(samples.length).to.be.bignumber.greaterThan(0);
            expect(samples[0]).to.be.bignumber.greaterThan(0);
        });
    });
});
