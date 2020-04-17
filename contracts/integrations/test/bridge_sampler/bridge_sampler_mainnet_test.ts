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
    describe('Curve', () => {
        const CURVE_ADDRESS = '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56';
        const DAI_TOKEN_INDEX = new BigNumber(0);
        const USDC_TOKEN_INDEX = new BigNumber(1);

        describe('sampleSellsFromCurve()', () => {
            it('samples sells from Curve DAI->USDC', async () => {
                const samples = await testContract
                    .sampleSellsFromCurve(CURVE_ADDRESS, DAI_TOKEN_INDEX, USDC_TOKEN_INDEX, [toBaseUnitAmount(1)])
                    .callAsync();
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });

            it('samples sells from Curve USDC->DAI', async () => {
                const samples = await testContract
                    .sampleSellsFromCurve(CURVE_ADDRESS, USDC_TOKEN_INDEX, DAI_TOKEN_INDEX, [toBaseUnitAmount(1, 6)])
                    .callAsync();
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });
        });

        describe('sampleBuysFromCurve()', () => {
            it('samples buys from Curve DAI->USDC', async () => {
                // From DAI to USDC
                // I want to buy 1 USDC
                const samples = await testContract
                    .sampleBuysFromCurve(CURVE_ADDRESS, DAI_TOKEN_INDEX, USDC_TOKEN_INDEX, [toBaseUnitAmount(1, 6)])
                    .callAsync();
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });

            it('samples buys from Curve USDC->DAI', async () => {
                // From USDC to DAI
                // I want to buy 1 DAI
                const samples = await testContract
                    .sampleBuysFromCurve(CURVE_ADDRESS, USDC_TOKEN_INDEX, DAI_TOKEN_INDEX, [toBaseUnitAmount(1)])
                    .callAsync();
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });
        });
    });
    describe('Kyber', () => {
        const FAKE_BUY_OPTS = {
            targetSlippageBps: new BigNumber(5),
            maxIterations: new BigNumber(5),
        };
        const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
        const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

        describe('sampleBuysFromKyber()', () => {
            it('samples buys from Kyber WETH->DAI', async () => {
                // From ETH to DAI
                // I want to buy 1 DAI
                const samples = await testContract
                    .sampleBuysFromKyberNetwork(WETH_ADDRESS, DAI_ADDRESS, [toBaseUnitAmount(1)], FAKE_BUY_OPTS)
                    .callAsync();
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });

            it('samples buys from Kyber DAI->WETH', async () => {
                // From USDC to DAI
                // I want to buy 1 WETH
                const samples = await testContract
                    .sampleBuysFromKyberNetwork(DAI_ADDRESS, WETH_ADDRESS, [toBaseUnitAmount(1)], FAKE_BUY_OPTS)
                    .callAsync();
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });
        });
    });
});
