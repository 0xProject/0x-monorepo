import { constants, expect, getRandomFloat, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { DexOrderSampler, getSampleAmounts } from '../src/utils/market_operation_utils/sampler';
import { ERC20BridgeSource } from '../src/utils/market_operation_utils/types';

import { MockSamplerContract } from './utils/mock_sampler_contract';

const CHAIN_ID = 1;
// tslint:disable: custom-no-magic-numbers
describe('DexSampler tests', () => {
    const MAKER_TOKEN = randomAddress();
    const TAKER_TOKEN = randomAddress();
    const MAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(MAKER_TOKEN);
    const TAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(TAKER_TOKEN);

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
            exchangeAddress: hexUtils.random(20),
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
                DexOrderSampler.ops.getOrderFillableMakerAmounts(ORDERS),
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
                DexOrderSampler.ops.getOrderFillableTakerAmounts(ORDERS),
            );
            expect(fillableAmounts).to.deep.eq(expectedFillableAmounts);
        });

        it('getKyberSellQuotes()', async () => {
            const expectedTakerToken = hexUtils.random(20);
            const expectedMakerToken = hexUtils.random(20);
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const expectedMakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 10);
            const sampler = new MockSamplerContract({
                sampleSellsFromKyberNetwork: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return expectedMakerFillAmounts;
                },
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [fillableAmounts] = await dexOrderSampler.executeAsync(
                DexOrderSampler.ops.getKyberSellQuotes(
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedTakerFillAmounts,
                ),
            );
            expect(fillableAmounts).to.deep.eq(expectedMakerFillAmounts);
        });

        it('getEth2DaiSellQuotes()', async () => {
            const expectedTakerToken = hexUtils.random(20);
            const expectedMakerToken = hexUtils.random(20);
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
                DexOrderSampler.ops.getEth2DaiSellQuotes(
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedTakerFillAmounts,
                ),
            );
            expect(fillableAmounts).to.deep.eq(expectedMakerFillAmounts);
        });

        it('getUniswapSellQuotes()', async () => {
            const expectedTakerToken = hexUtils.random(20);
            const expectedMakerToken = hexUtils.random(20);
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
                DexOrderSampler.ops.getUniswapSellQuotes(
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedTakerFillAmounts,
                ),
            );
            expect(fillableAmounts).to.deep.eq(expectedMakerFillAmounts);
        });

        it('getEth2DaiBuyQuotes()', async () => {
            const expectedTakerToken = hexUtils.random(20);
            const expectedMakerToken = hexUtils.random(20);
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
                DexOrderSampler.ops.getEth2DaiBuyQuotes(
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedMakerFillAmounts,
                ),
            );
            expect(fillableAmounts).to.deep.eq(expectedTakerFillAmounts);
        });

        it('getUniswapBuyQuotes()', async () => {
            const expectedTakerToken = hexUtils.random(20);
            const expectedMakerToken = hexUtils.random(20);
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
                DexOrderSampler.ops.getUniswapBuyQuotes(
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedMakerFillAmounts,
                ),
            );
            expect(fillableAmounts).to.deep.eq(expectedTakerFillAmounts);
        });

        interface RatesBySource {
            [src: string]: BigNumber;
        }

        it('getSellQuotes()', async () => {
            const expectedTakerToken = hexUtils.random(20);
            const expectedMakerToken = hexUtils.random(20);
            const sources = [ERC20BridgeSource.Kyber, ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Uniswap];
            const ratesBySource: RatesBySource = {
                [ERC20BridgeSource.Kyber]: getRandomFloat(0, 100),
                [ERC20BridgeSource.Eth2Dai]: getRandomFloat(0, 100),
                [ERC20BridgeSource.Uniswap]: getRandomFloat(0, 100),
            };
            const expectedTakerFillAmounts = getSampleAmounts(new BigNumber(100e18), 3);
            const sampler = new MockSamplerContract({
                sampleSellsFromKyberNetwork: (takerToken, makerToken, fillAmounts) => {
                    expect(takerToken).to.eq(expectedTakerToken);
                    expect(makerToken).to.eq(expectedMakerToken);
                    expect(fillAmounts).to.deep.eq(expectedTakerFillAmounts);
                    return fillAmounts.map(a => a.times(ratesBySource[ERC20BridgeSource.Kyber]).integerValue());
                },
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
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [quotes] = await dexOrderSampler.executeAsync(
                DexOrderSampler.ops.getSellQuotes(
                    sources,
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedTakerFillAmounts,
                ),
            );
            expect(quotes).to.be.length(sources.length);
            const expectedQuotes = sources.map(s =>
                expectedTakerFillAmounts.map(a => ({
                    source: s,
                    input: a,
                    output: a.times(ratesBySource[s]).integerValue(),
                })),
            );
            expect(quotes).to.deep.eq(expectedQuotes);
        });

        it('getBuyQuotes()', async () => {
            const expectedTakerToken = hexUtils.random(20);
            const expectedMakerToken = hexUtils.random(20);
            const sources = [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Uniswap];
            const ratesBySource: RatesBySource = {
                [ERC20BridgeSource.Eth2Dai]: getRandomFloat(0, 100),
                [ERC20BridgeSource.Uniswap]: getRandomFloat(0, 100),
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
            });
            const dexOrderSampler = new DexOrderSampler(sampler);
            const [quotes] = await dexOrderSampler.executeAsync(
                DexOrderSampler.ops.getBuyQuotes(
                    sources,
                    expectedMakerToken,
                    expectedTakerToken,
                    expectedMakerFillAmounts,
                ),
            );
            expect(quotes).to.be.length(sources.length);
            const expectedQuotes = sources.map(s =>
                expectedMakerFillAmounts.map(a => ({
                    source: s,
                    input: a,
                    output: a.times(ratesBySource[s]).integerValue(),
                })),
            );
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
                DexOrderSampler.ops.getOrderFillableMakerAmounts(ORDERS),
                DexOrderSampler.ops.getOrderFillableTakerAmounts(ORDERS),
            );
            expect(fillableMakerAmounts).to.deep.eq(expectedFillableMakerAmounts);
            expect(fillableTakerAmounts).to.deep.eq(expectedFillableTakerAmounts);
        });
    });
});
// tslint:disable-next-line: max-file-line-count
