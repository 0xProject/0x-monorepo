import { artifacts, ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { blockchainTests, describe, expect, toBaseUnitAmount, Web3ProviderEngine } from '@0x/contracts-test-utils';
import { RPCSubprovider } from '@0x/dev-utils/node_modules/@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';

export const VB = '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b';
blockchainTests.configure({
    fork: {
        unlockedAccounts: [VB],
    },
});

blockchainTests.fork.resets('Mainnet Sampler Tests', env => {
    let testContract: ERC20BridgeSamplerContract;
    const fakeSamplerAddress = '0x1111111111111111111111111111111111111111';
    const overrides = {
        [fakeSamplerAddress]: {
            code: artifacts.ERC20BridgeSampler.compilerOutput.evm.deployedBytecode.object,
        },
    };
    before(async () => {
        const provider = new Web3ProviderEngine();
        // tslint:disable-next-line:no-non-null-assertion
        provider.addProvider(new RPCSubprovider(process.env.FORK_RPC_URL!));
        providerUtils.startProviderEngine(provider);
        testContract = new ERC20BridgeSamplerContract(fakeSamplerAddress, provider, {
            ...env.txDefaults,
            from: VB,
        });
    });
    describe('Curve', () => {
        const CURVE_ADDRESS = '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56';
        const DAI_TOKEN_INDEX = new BigNumber(0);
        const USDC_TOKEN_INDEX = new BigNumber(1);

        describe('sampleSellsFromCurve()', () => {
            it('samples sells from Curve DAI->USDC', async () => {
                const samples = await testContract
                    .sampleSellsFromCurve(CURVE_ADDRESS, DAI_TOKEN_INDEX, USDC_TOKEN_INDEX, [toBaseUnitAmount(1)])
                    .callAsync({ overrides });
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });

            it('samples sells from Curve USDC->DAI', async () => {
                const samples = await testContract
                    .sampleSellsFromCurve(CURVE_ADDRESS, USDC_TOKEN_INDEX, DAI_TOKEN_INDEX, [toBaseUnitAmount(1, 6)])
                    .callAsync({ overrides });
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
                    .callAsync({ overrides });
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });

            it('samples buys from Curve USDC->DAI', async () => {
                // From USDC to DAI
                // I want to buy 1 DAI
                const samples = await testContract
                    .sampleBuysFromCurve(CURVE_ADDRESS, USDC_TOKEN_INDEX, DAI_TOKEN_INDEX, [toBaseUnitAmount(1)])
                    .callAsync({ overrides });
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
        const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
        const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
        const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        describe('sampleSellsFromKyberNetwork()', () => {
            it('samples sells from Kyber DAI->WETH', async () => {
                const samples = await testContract
                    .sampleSellsFromKyberNetwork(DAI, WETH, [toBaseUnitAmount(1)])
                    .callAsync({ overrides });
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });
            it('samples sells from Kyber WETH->DAI', async () => {
                const samples = await testContract
                    .sampleSellsFromKyberNetwork(WETH, DAI, [toBaseUnitAmount(1)])
                    .callAsync({ overrides });
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });
            it('samples sells from Kyber DAI->USDC', async () => {
                const samples = await testContract
                    .sampleSellsFromKyberNetwork(DAI, USDC, [toBaseUnitAmount(1)])
                    .callAsync({ overrides });
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });
        });

        describe('sampleBuysFromKyber()', () => {
            it('samples buys from Kyber WETH->DAI', async () => {
                // From ETH to DAI
                // I want to buy 1 DAI
                const samples = await testContract
                    .sampleBuysFromKyberNetwork(WETH, DAI, [toBaseUnitAmount(1)], FAKE_BUY_OPTS)
                    .callAsync({ overrides });
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });

            it('samples buys from Kyber DAI->WETH', async () => {
                // From USDC to DAI
                // I want to buy 1 WETH
                const samples = await testContract
                    .sampleBuysFromKyberNetwork(DAI, WETH, [toBaseUnitAmount(1)], FAKE_BUY_OPTS)
                    .callAsync({ overrides });
                expect(samples.length).to.be.bignumber.greaterThan(0);
                expect(samples[0]).to.be.bignumber.greaterThan(0);
            });
        });
    });
});
