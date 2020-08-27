import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import {
    constants,
    expect,
    getRandomFloat,
    getRandomInteger,
    randomAddress,
    toBaseUnitAmount,
} from '@0x/contracts-test-utils';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import {
    BalancerPool,
    computeBalancerBuyQuote,
    computeBalancerSellQuote,
} from '../src/utils/market_operation_utils/balancer_utils';
import { DexOrderSampler, getSampleAmounts } from '../src/utils/market_operation_utils/sampler';
import { ERC20BridgeSource } from '../src/utils/market_operation_utils/types';

import { MockBalancerPoolsCache } from './utils/mock_balancer_pools_cache';
import { MockBancorService } from './utils/mock_bancor_service';
import { MockSamplerContract } from './utils/mock_sampler_contract';
import { provider } from './utils/web3_wrapper';

const CHAIN_ID = 1;
// tslint:disable: custom-no-magic-numbers
describe('DexSampler tests', () => {
    const MAKER_TOKEN = randomAddress();
    const TAKER_TOKEN = randomAddress();
    const MAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(MAKER_TOKEN);
    const TAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(TAKER_TOKEN);

    const wethAddress = getContractAddressesForChainOrThrow(CHAIN_ID).etherToken;
    const exchangeAddress = getContractAddressesForChainOrThrow(CHAIN_ID).exchange;

    describe('getSampleAmounts()', () => {
        const FILL_AMOUNT = getRandomInteger(1, 1e18);
        const NUM_SAMPLES = 16;

        it('generates the correct number of amounts', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            expect(amounts).to.be.length(NUM_SAMPLES);
        });

        it('first amount is nonzero', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            expect(amounts[0]).to.not.bignumber.eq(0);
        });

        it('last amount is the fill amount', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            expect(amounts[NUM_SAMPLES - 1]).to.bignumber.eq(FILL_AMOUNT);
        });

        it('can generate a single amount', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, 1);
            expect(amounts).to.be.length(1);
            expect(amounts[0]).to.bignumber.eq(FILL_AMOUNT);
        });

        it('generates ascending amounts', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            for (const i of _.times(NUM_SAMPLES).slice(1)) {
                const prev = amounts[i - 1];
                const amount = amounts[i];
                expect(prev).to.bignumber.lt(amount);
            }
        });
    });

    function createOrder(overrides?: Partial<SignedOrder>): SignedOrder {
        return {
            chainId: CHAIN_ID,
            exchangeAddress: randomAddress(),
            makerAddress: constants.NULL_ADDRESS,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: randomAddress(),
            salt: generatePseudoRandomSalt(),
            expirationTimeSeconds: getRandomInteger(0, 2 ** 64),
            makerAssetData: MAKER_ASSET_DATA,
            takerAssetData: TAKER_ASSET_DATA,
            makerFeeAssetData: constants.NULL_BYTES,
            takerFeeAssetData: constants.NULL_BYTES,
            makerAssetAmount: getRandomInteger(1, 1e18),
            takerAssetAmount: getRandomInteger(1, 1e18),
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            signature: hexUtils.random(),
            ...overrides,
        };
    }
    const ORDERS = _.times(4, () => createOrder());
    const SIMPLE_ORDERS = ORDERS.map(o => _.omit(o, ['signature', 'chainId', 'exchangeAddress']));

    describe('operations', () => {
        it('getOrderFillableMakerAmounts()', async () => {
            const expectedFillableAmounts = ORDERS.map(() => getRandomInteger(0, 100e18));
            const sampler = new MockSamplerContract({
                getOrderFillableMakerAssetAmounts: (orders, signatures) => {
                    expect(orders).to.deep.eq(SIMPLE_ORDERS);
                    expect(signatures).to.deep.eq(ORDERS.map(o => o.signature));
                    return expectedFillableAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getOrderFillableMakerAmounts(ORDERS, exchangeAddress),
            );
            expect(fillableAmounts).to.deep.eq(expectedFillableAmounts);
        });

        it('getOrderFillableTakerAmounts()', async () => {
            const expectedFillableAmounts = ORDERS.map(() => getRandomInteger(0, 100e18));
            const sampler = new MockSamplerContract({
                getOrderFillableTakerAssetAmounts: (orders, signatures) => {
                    expect(orders).to.deep.eq(SIMPLE_ORDERS);
                    expect(signatures).to.deep.eq(ORDERS.map(o => o.signature));
                    return expectedFillableAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getOrderFillableTakerAmounts(ORDERS, exchangeAddress),
            );
            expect(fillableAmounts).to.deep.eq(expectedFillableAmounts);
        });

        it('getKyberSellQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const sampler = new MockSamplerContract({
                sampleSellsFromKyberNetwork: (_reserveId, takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return ['0x', expectedMakerFillAmounts];
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getKyberSellQuotes(
                    '0x',
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedTakerFillAmounts,
                ),
            );
            expect(fillableAmounts).to.deep.eq(expectedMakerFillAmounts);
        });

        it('getLiquidityProviderSellQuotes()', async () => {
            const expectedMakerToken = randomAddress();
            const expectedTakerToken = randomAddress();
            const registry = randomAddress();
            const poolAddress = randomAddress();
            const sampler = new MockSamplerContract({
                sampleSellsFromLiquidityProviderRegistry: (registryAddress, takerToken, makerToken, _fillAmounts) => {
                    expect(registryAddress).to.eq(registry);
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    return [[toBaseUnitAmount(1001)], poolAddress];
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [result] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getSellQuotes(
                    [ERC20BridgeSource.LiquidityProvider],
                    expectedMakerToken,
                    expectedTakerToken,
                    [toBaseUnitAmount(1000)],
                    wethAddress,
                    registry,
                ),
            );
            expect(result).to.deep.equal([
                [
                    {
                        source: 'LiquidityProvider',
                        output: toBaseUnitAmount(1001),
                        input: toBaseUnitAmount(1000),
                        fillData: { poolAddress },
                    },
                ],
            ]);
        });

        it('getLiquidityProviderBuyQuotes()', async () => {
            const expectedMakerToken = randomAddress();
            const expectedTakerToken = randomAddress();
            const registry = randomAddress();
            const poolAddress = randomAddress();
            const sampler = new MockSamplerContract({
                sampleBuysFromLiquidityProviderRegistry: (registryAddress, takerToken, makerToken, _fillAmounts) => {
                    expect(registryAddress).to.eq(registry);
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    return [[toBaseUnitAmount(999)], poolAddress];
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [result] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getBuyQuotes(
                    [ERC20BridgeSource.LiquidityProvider],
                    expectedMakerToken,
                    expectedTakerToken,
                    [toBaseUnitAmount(1000)],
                    wethAddress,
                    registry,
                ),
            );
            expect(result).to.deep.equal([
                [
                    {
                        source: 'LiquidityProvider',
                        output: toBaseUnitAmount(999),
                        input: toBaseUnitAmount(1000),
                        fillData: { poolAddress },
                    },
                ],
            ]);
        });

        it('getMultiBridgeSellQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const multiBridge = randomAddress();

            const sampler = new MockSamplerContract({
                sampleSellsFromMultiBridge: (
                    multiBridgeAddress,
                    takerToken,
                    _intermediateToken,
                    makerToken,
                    _fillAmounts,
                ) => {
                    expect(multiBridgeAddress).to.eq(multiBridge);
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    return [toBaseUnitAmount(1001)];
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [result] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getSellQuotes(
                    [ERC20BridgeSource.MultiBridge],
                    expectedMakerToken,
                    expectedTakerToken,
                    [toBaseUnitAmount(1000)],
                    randomAddress(),
                    randomAddress(),
                    multiBridge,
                ),
            );
            expect(result).to.deep.equal([
                [
                    {
                        source: 'MultiBridge',
                        output: toBaseUnitAmount(1001),
                        input: toBaseUnitAmount(1000),
                        fillData: { poolAddress: multiBridge },
                    },
                ],
            ]);
        });

        it('getEth2DaiSellQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const sampler = new MockSamplerContract({
                sampleSellsFromEth2Dai: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return expectedMakerFillAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getEth2DaiSellQuotes(expectedMakerToken, expectedTakerToken, expectedTakerFillAmounts),
            );
            expect(fillableAmounts).to.deep.eq(expectedMakerFillAmounts);
        });

        it('getUniswapSellQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const sampler = new MockSamplerContract({
                sampleSellsFromUniswap: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return expectedMakerFillAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getUniswapSellQuotes(expectedMakerToken, expectedTakerToken, expectedTakerFillAmounts),
            );
            expect(fillableAmounts).to.deep.eq(expectedMakerFillAmounts);
        });

        it('getUniswapV2SellQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const sampler = new MockSamplerContract({
                sampleSellsFromUniswapV2: (path, fillAmounts) => {
                    expect(path).to.deep.eq([expectedMakerToken, expectedTakerToken]);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return expectedMakerFillAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getUniswapV2SellQuotes(
                    [expectedMakerToken, expectedTakerToken],
                    expectedTakerFillAmounts,
                ),
            );
            expect(fillableAmounts).to.deep.eq(expectedMakerFillAmounts);
        });

        it('getEth2DaiBuyQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const sampler = new MockSamplerContract({
                sampleBuysFromEth2Dai: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedMakerFillAmounts);
                    return expectedTakerFillAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getEth2DaiBuyQuotes(expectedMakerToken, expectedTakerToken, expectedMakerFillAmounts),
            );
            expect(fillableAmounts).to.deep.eq(expectedTakerFillAmounts);
        });

        it('getUniswapBuyQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const sampler = new MockSamplerContract({
                sampleBuysFromUniswap: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedMakerFillAmounts);
                    return expectedTakerFillAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getUniswapBuyQuotes(expectedMakerToken, expectedTakerToken, expectedMakerFillAmounts),
            );
            expect(fillableAmounts).to.deep.eq(expectedTakerFillAmounts);
        });

        interface RatesBySource {
            [src: string]: BigNumber;
        }

        it('getSellQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const sources = [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Uniswap, ERC20BridgeSource.UniswapV2];
            const ratesBySource: RatesBySource = {
                [ERC20BridgeSource.Kyber]: getRandomFloat(0, 100),
                [ERC20BridgeSource.Eth2Dai]: getRandomFloat(0, 100),
                [ERC20BridgeSource.Uniswap]: getRandomFloat(0, 100),
                [ERC20BridgeSource.UniswapV2]: getRandomFloat(0, 100),
            };
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 3);
            const sampler = new MockSamplerContract({
                sampleSellsFromUniswap: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return fillAmounts.map(a => a.times(ratesBySource[ERC20BridgeSource.Uniswap]).integerValue());
                },
                sampleSellsFromEth2Dai: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return fillAmounts.map(a => a.times(ratesBySource[ERC20BridgeSource.Eth2Dai]).integerValue());
                },
                sampleSellsFromUniswapV2: (path, fillAmounts) => {
                    if (path.length === 2) {
                        expect(path).to.deep.eq([expectedTakerToken, expectedMakerToken]);
                    } else if (path.length === 3) {
                        expect(path).to.deep.eq([expectedTakerToken, wethAddress, expectedMakerToken]);
                    } else {
                        expect(path).to.have.lengthOf.within(2, 3);
                    }
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return fillAmounts.map(a => a.times(ratesBySource[ERC20BridgeSource.UniswapV2]).integerValue());
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [quotes] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getSellQuotes(
                    sources,
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedTakerFillAmounts,
                    wethAddress,
                ),
            );
            const expectedQuotes = sources.map(s =>
                expectedTakerFillAmounts.map(a => ({
                    source: s,
                    input: a,
                    output: a.times(ratesBySource[s]).integerValue(),
                    fillData:
                        s === ERC20BridgeSource.UniswapV2
                            ? { tokenAddressPath: [expectedTakerToken, expectedMakerToken] }
                            : {},
                })),
            );
            const uniswapV2ETHQuotes = [
                expectedTakerFillAmounts.map(a => ({
                    source: ERC20BridgeSource.UniswapV2,
                    input: a,
                    output: a.times(ratesBySource[ERC20BridgeSource.UniswapV2]).integerValue(),
                    fillData: {
                        tokenAddressPath: [expectedTakerToken, wethAddress, expectedMakerToken],
                    },
                })),
            ];
            //  extra quote for Uniswap V2, which provides a direct quote (tokenA -> tokenB) AND an ETH quote (tokenA -> ETH -> tokenB)
            const additionalSourceCount = 1;
            expect(quotes).to.have.lengthOf(sources.length + additionalSourceCount);
            expect(quotes).to.deep.eq(expectedQuotes.concat(uniswapV2ETHQuotes));
        });
        it('getSellQuotes() uses samples from Balancer', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 3);
            const pools: BalancerPool[] = [generateBalancerPool(), generateBalancerPool()];
            const balancerPoolsCache = new MockBalancerPoolsCache({
                getPoolsForPairAsync: async (takerToken: string, makerToken: string) => {
                    expect(takerToken).equal(expectedTakerToken);
                    expect(makerToken).equal(expectedMakerToken);
                    return Promise.resolve(pools);
                },
            });
            const dexOrderSampler = new DexOrderSampler(
                new MockSamplerContract({}),
                undefined,
                undefined,
                balancerPoolsCache,
            );
            const quotes = await dexOrderSampler.getBalancerSellQuotesOffChainAsync(
                expectedMakerToken,
                expectedTakerToken,
                expectedTakerFillAmounts,
            );
            const expectedQuotes = pools.map(p =>
                expectedTakerFillAmounts.map(a => ({
                    source: ERC20BridgeSource.Balancer,
                    input: a,
                    output: computeBalancerSellQuote(p, a),
                    fillData: { poolAddress: p.id },
                })),
            );
            expect(quotes).to.have.lengthOf(2); // one array per pool
            expect(quotes).to.deep.eq(expectedQuotes);
        });
        it('getSellQuotes() uses samples from Bancor', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const networkAddress = randomAddress();
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 3);
            const rate = getRandomFloat(0, 100);
            const bancorService = new MockBancorService(provider, {
                getQuoteAsync: async (fromToken: string, toToken: string, amount: BigNumber) => {
                    expect(fromToken).equal(expectedTakerToken);
                    expect(toToken).equal(expectedMakerToken);
                    return Promise.resolve({
                        fillData: { path: [fromToken, toToken], networkAddress },
                        amount: amount.multipliedBy(rate),
                    });
                },
            });
            const dexOrderSampler = new DexOrderSampler(
                new MockSamplerContract({}),
                undefined, // sampler overrides
                bancorService,
                undefined, // balancer cache
            );
            const quotes = await dexOrderSampler.getBancorSellQuotesOffChainAsync(
                expectedMakerToken,
                expectedTakerToken,
                expectedTakerFillAmounts,
            );
            const expectedQuotes = expectedTakerFillAmounts.map(a => ({
                source: ERC20BridgeSource.Bancor,
                input: a,
                output: a.multipliedBy(rate),
                fillData: { path: [expectedTakerToken, expectedMakerToken], networkAddress },
            }));
            expect(quotes).to.deep.eq(expectedQuotes);
        });
        it('getBuyQuotes()', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const sources = [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Uniswap, ERC20BridgeSource.UniswapV2];
            const ratesBySource: RatesBySource = {
                [ERC20BridgeSource.Eth2Dai]: getRandomFloat(0, 100),
                [ERC20BridgeSource.Uniswap]: getRandomFloat(0, 100),
                [ERC20BridgeSource.UniswapV2]: getRandomFloat(0, 100),
            };
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 3);
            const sampler = new MockSamplerContract({
                sampleBuysFromUniswap: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedMakerFillAmounts);
                    return fillAmounts.map(a => a.times(ratesBySource[ERC20BridgeSource.Uniswap]).integerValue());
                },
                sampleBuysFromEth2Dai: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedMakerFillAmounts);
                    return fillAmounts.map(a => a.times(ratesBySource[ERC20BridgeSource.Eth2Dai]).integerValue());
                },
                sampleBuysFromUniswapV2: (path, fillAmounts) => {
                    if (path.length === 2) {
                        expect(path).to.deep.eq([expectedTakerToken, expectedMakerToken]);
                    } else if (path.length === 3) {
                        expect(path).to.deep.eq([expectedTakerToken, wethAddress, expectedMakerToken]);
                    } else {
                        expect(path).to.have.lengthOf.within(2, 3);
                    }
                    expect(fillAmounts).to.deep.eq(expectedMakerFillAmounts);
                    return fillAmounts.map(a => a.times(ratesBySource[ERC20BridgeSource.UniswapV2]).integerValue());
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [quotes] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getBuyQuotes(
                    sources,
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedMakerFillAmounts,
                    wethAddress,
                ),
            );
            const expectedQuotes = sources.map(s =>
                expectedMakerFillAmounts.map(a => ({
                    source: s,
                    input: a,
                    output: a.times(ratesBySource[s]).integerValue(),
                    fillData:
                        s === ERC20BridgeSource.UniswapV2
                            ? { tokenAddressPath: [expectedTakerToken, expectedMakerToken] }
                            : {},
                })),
            );
            const uniswapV2ETHQuotes = [
                expectedMakerFillAmounts.map(a => ({
                    source: ERC20BridgeSource.UniswapV2,
                    input: a,
                    output: a.times(ratesBySource[ERC20BridgeSource.UniswapV2]).integerValue(),
                    fillData: {
                        tokenAddressPath: [expectedTakerToken, wethAddress, expectedMakerToken],
                    },
                })),
            ];
            //  extra quote for Uniswap V2, which provides a direct quote (tokenA -> tokenB) AND an ETH quote (tokenA -> ETH -> tokenB)
            expect(quotes).to.have.lengthOf(sources.length + 1);
            expect(quotes).to.deep.eq(expectedQuotes.concat(uniswapV2ETHQuotes));
        });
        it('getBuyQuotes() uses samples from Balancer', async () => {
            const expectedTakerToken = randomAddress();
            const expectedMakerToken = randomAddress();
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 3);
            const pools: BalancerPool[] = [generateBalancerPool(), generateBalancerPool()];
            const balancerPoolsCache = new MockBalancerPoolsCache({
                getPoolsForPairAsync: async (takerToken: string, makerToken: string) => {
                    expect(takerToken).equal(expectedTakerToken);
                    expect(makerToken).equal(expectedMakerToken);
                    return Promise.resolve(pools);
                },
            });
            const dexOrderSampler = new DexOrderSampler(
                new MockSamplerContract({}),
                undefined,
                undefined,
                balancerPoolsCache,
            );
            const quotes = await dexOrderSampler.getBalancerBuyQuotesOffChainAsync(
                expectedMakerToken,
                expectedTakerToken,
                expectedMakerFillAmounts,
            );
            const expectedQuotes = pools.map(p =>
                expectedMakerFillAmounts.map(a => ({
                    source: ERC20BridgeSource.Balancer,
                    input: a,
                    output: computeBalancerBuyQuote(p, a),
                    fillData: { poolAddress: p.id },
                })),
            );
            expect(quotes).to.have.lengthOf(2); //  one set per pool
            expect(quotes).to.deep.eq(expectedQuotes);
        });
    });

    describe('batched operations', () => {
        it('getOrderFillableMakerAmounts(), getOrderFillableTakerAmounts()', async () => {
            const expectedFillableTakerAmounts = ORDERS.map(() => getRandomInteger(0, 100e18));
            const expectedFillableMakerAmounts = ORDERS.map(() => getRandomInteger(0, 100e18));
            const sampler = new MockSamplerContract({
                getOrderFillableMakerAssetAmounts: (orders, signatures) => {
                    expect(orders).to.deep.eq(SIMPLE_ORDERS);
                    expect(signatures).to.deep.eq(ORDERS.map(o => o.signature));
                    return expectedFillableMakerAmounts;
                },
                getOrderFillableTakerAssetAmounts: (orders, signatures) => {
                    expect(orders).to.deep.eq(SIMPLE_ORDERS);
                    expect(signatures).to.deep.eq(ORDERS.map(o => o.signature));
                    return expectedFillableTakerAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableMakerAmounts, fillableTakerAmounts] = await dexOrderSampler.executeAsync(
                dexOrderSampler.getOrderFillableMakerAmounts(ORDERS, exchangeAddress),
                dexOrderSampler.getOrderFillableTakerAmounts(ORDERS, exchangeAddress),
            );
            expect(fillableMakerAmounts).to.deep.eq(expectedFillableMakerAmounts);
            expect(fillableTakerAmounts).to.deep.eq(expectedFillableTakerAmounts);
        });
    });
});
function generateBalancerPool(): BalancerPool {
    return {
        id: randomAddress(),
        balanceIn: getRandomInteger(1, 1e18),
        balanceOut: getRandomInteger(1, 1e18),
        weightIn: getRandomInteger(0, 1e5),
        weightOut: getRandomInteger(0, 1e5),
        swapFee: getRandomInteger(0, 1e5),
    };
}
// tslint:disable-next-line: max-file-line-count
