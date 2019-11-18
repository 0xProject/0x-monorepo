import { Orderbook } from '@0x/orderbook';
import { Web3ProviderEngine } from '@0x/subproviders';
import { AssetPairsItem, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { SwapQuoter } from '../src';
import { constants } from '../src/constants';
import { LiquidityForTakerMakerAssetDataPair, PrunedSignedOrder } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { mockAvailableAssetDatas, mockedSwapQuoterWithPrunedSignedOrders, orderbookMock } from './utils/mocks';
import { testOrderFactory } from './utils/test_order_factory';
import { baseUnitAmount } from './utils/utils';

chaiSetup.configure();
const expect = chai.expect;

const FAKE_SRA_URL = 'https://fakeurl.com';
const FAKE_TAKER_ASSET_DATA = '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48';
const FAKE_MAKER_ASSET_DATA = '0xf47261b00000000000000000000000009f5B0C7e1623793bF0620569b9749e79DF6D0bC5';
const TOKEN_DECIMALS = 18;
const DAI_ASSET_DATA = '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359"';
const WETH_ASSET_DATA = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const WETH_DECIMALS = constants.ETHER_TOKEN_DECIMALS;
const ZERO = new BigNumber(0);

const assetsToAssetPairItems = (makerAssetData: string, takerAssetData: string): AssetPairsItem[] => {
    const defaultAssetPairItem = {
        minAmount: ZERO,
        maxAmount: ZERO,
        precision: TOKEN_DECIMALS,
    };
    return [
        {
            assetDataA: {
                ...defaultAssetPairItem,
                assetData: makerAssetData,
            },
            assetDataB: {
                ...defaultAssetPairItem,
                assetData: takerAssetData,
            },
        },
        {
            assetDataA: {
                ...defaultAssetPairItem,
                assetData: takerAssetData,
            },
            assetDataB: {
                ...defaultAssetPairItem,
                assetData: makerAssetData,
            },
        },
    ];
};

const expectLiquidityResult = async (
    web3Provider: Web3ProviderEngine,
    orderbook: Orderbook,
    prunedOrders: PrunedSignedOrder[],
    expectedLiquidityResult: LiquidityForTakerMakerAssetDataPair,
) => {
    const mockedSwapQuoter = mockedSwapQuoterWithPrunedSignedOrders(
        web3Provider,
        orderbook,
        FAKE_MAKER_ASSET_DATA,
        WETH_ASSET_DATA,
        prunedOrders,
    );
    const liquidityResult = await mockedSwapQuoter.object.getLiquidityForMakerTakerAssetDataPairAsync(
        FAKE_MAKER_ASSET_DATA,
        WETH_ASSET_DATA,
    );
    expect(liquidityResult).to.deep.equal(expectedLiquidityResult);
};

// tslint:disable:custom-no-magic-numbers
describe('SwapQuoter', () => {
    describe('getLiquidityForMakerTakerAssetDataPairAsync', () => {
        const mockWeb3Provider = TypeMoq.Mock.ofType(Web3ProviderEngine);
        const mockOrderbook = orderbookMock();

        beforeEach(() => {
            mockWeb3Provider.reset();
            mockOrderbook.reset();
        });

        afterEach(() => {
            mockWeb3Provider.verifyAll();
            mockOrderbook.verifyAll();
        });

        describe('validation', () => {
            it('should ensure takerAssetData is a string', async () => {
                const swapQuoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(
                    mockWeb3Provider.object,
                    FAKE_SRA_URL,
                );

                expect(
                    swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(FAKE_MAKER_ASSET_DATA, false as any),
                ).to.be.rejectedWith('Expected takerAssetData to be of type string, encountered: false');
            });
            it('should ensure makerAssetData is a string', async () => {
                const swapQuoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(
                    mockWeb3Provider.object,
                    FAKE_SRA_URL,
                );

                expect(
                    swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(false as any, FAKE_TAKER_ASSET_DATA),
                ).to.be.rejectedWith('Expected makerAssetData to be of type string, encountered: false');
            });
        });

        describe('asset pair not supported', () => {
            it('should return 0s when no asset pair are supported', async () => {
                mockAvailableAssetDatas(mockOrderbook, []);

                const swapQuoter = new SwapQuoter(mockWeb3Provider.object, mockOrderbook.object);
                const liquidityResult = await swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(
                    FAKE_MAKER_ASSET_DATA,
                    FAKE_TAKER_ASSET_DATA,
                );
                expect(liquidityResult).to.deep.equal({
                    makerAssetAvailableInBaseUnits: new BigNumber(0),
                    takerAssetAvailableInBaseUnits: new BigNumber(0),
                });
            });

            it('should return 0s when only other asset pair supported', async () => {
                mockAvailableAssetDatas(mockOrderbook, assetsToAssetPairItems(FAKE_MAKER_ASSET_DATA, DAI_ASSET_DATA));

                const swapQuoter = new SwapQuoter(mockWeb3Provider.object, mockOrderbook.object);
                const liquidityResult = await swapQuoter.getLiquidityForMakerTakerAssetDataPairAsync(
                    FAKE_MAKER_ASSET_DATA,
                    FAKE_TAKER_ASSET_DATA,
                );
                expect(liquidityResult).to.deep.equal({
                    makerAssetAvailableInBaseUnits: new BigNumber(0),
                    takerAssetAvailableInBaseUnits: new BigNumber(0),
                });
            });
        });

        describe('assetData is supported', () => {
            // orders
            const sellTenTokensFor10Weth: SignedOrder = testOrderFactory.generateTestSignedOrder({
                makerAssetAmount: baseUnitAmount(10),
                takerAssetAmount: baseUnitAmount(10, WETH_DECIMALS),
                chainId: 42,
            });

            beforeEach(() => {
                mockAvailableAssetDatas(mockOrderbook, assetsToAssetPairItems(WETH_ASSET_DATA, FAKE_MAKER_ASSET_DATA));
            });

            it('should return 0s when no orders available', async () => {
                const prunedOrders: PrunedSignedOrder[] = [];
                const expectedResult = {
                    makerAssetAvailableInBaseUnits: new BigNumber(0),
                    takerAssetAvailableInBaseUnits: new BigNumber(0),
                };
                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    prunedOrders,
                    expectedResult,
                );
            });

            it('should return correct computed value when orders provided with full fillableAmounts', async () => {
                const prunedOrders: PrunedSignedOrder[] = [
                    {
                        ...sellTenTokensFor10Weth,
                        ...{
                            fillableMakerAssetAmount: sellTenTokensFor10Weth.makerAssetAmount,
                            fillableTakerAssetAmount: sellTenTokensFor10Weth.takerAssetAmount,
                            fillableTakerFeeAmount: constants.ZERO_AMOUNT,
                        },
                    },
                    {
                        ...sellTenTokensFor10Weth,
                        ...{
                            fillableMakerAssetAmount: sellTenTokensFor10Weth.makerAssetAmount,
                            fillableTakerAssetAmount: sellTenTokensFor10Weth.takerAssetAmount,
                            fillableTakerFeeAmount: constants.ZERO_AMOUNT,
                        },
                    },
                ];
                const expectedMakerAssetAvailable = prunedOrders[0].makerAssetAmount.plus(
                    prunedOrders[1].makerAssetAmount,
                );
                const expectedTakerAssetAvailable = prunedOrders[0].takerAssetAmount.plus(
                    prunedOrders[1].takerAssetAmount,
                );

                const expectedResult = {
                    makerAssetAvailableInBaseUnits: expectedMakerAssetAvailable,
                    takerAssetAvailableInBaseUnits: expectedTakerAssetAvailable,
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    prunedOrders,
                    expectedResult,
                );
            });

            it('should return correct computed value with one partial fillableAmounts', async () => {
                const prunedOrders: PrunedSignedOrder[] = [
                    {
                        ...sellTenTokensFor10Weth,
                        ...{
                            fillableMakerAssetAmount: baseUnitAmount(1),
                            fillableTakerAssetAmount: baseUnitAmount(0.5, WETH_DECIMALS),
                            fillableTakerFeeAmount: constants.ZERO_AMOUNT,
                        },
                    },
                ];

                const expectedResult = {
                    makerAssetAvailableInBaseUnits: baseUnitAmount(1),
                    takerAssetAvailableInBaseUnits: baseUnitAmount(0.5, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    prunedOrders,
                    expectedResult,
                );
            });

            it('should return correct computed value with multiple orders and fillable amounts', async () => {
                const prunedOrders: PrunedSignedOrder[] = [
                    {
                        ...sellTenTokensFor10Weth,
                        ...{
                            fillableMakerAssetAmount: baseUnitAmount(1),
                            fillableTakerAssetAmount: baseUnitAmount(0.5, WETH_DECIMALS),
                            fillableTakerFeeAmount: constants.ZERO_AMOUNT,
                        },
                    },
                    {
                        ...sellTenTokensFor10Weth,
                        ...{
                            fillableMakerAssetAmount: baseUnitAmount(3),
                            fillableTakerAssetAmount: baseUnitAmount(3, WETH_DECIMALS),
                            fillableTakerFeeAmount: constants.ZERO_AMOUNT,
                        },
                    },
                ];

                const expectedResult = {
                    makerAssetAvailableInBaseUnits: baseUnitAmount(4),
                    takerAssetAvailableInBaseUnits: baseUnitAmount(3.5, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    prunedOrders,
                    expectedResult,
                );
            });

            it('should return 0s when no amounts fillable', async () => {
                const prunedOrders: PrunedSignedOrder[] = [
                    {
                        ...sellTenTokensFor10Weth,
                        ...{
                            fillableMakerAssetAmount: constants.ZERO_AMOUNT,
                            fillableTakerAssetAmount: constants.ZERO_AMOUNT,
                            fillableTakerFeeAmount: constants.ZERO_AMOUNT,
                        },
                    },
                    {
                        ...sellTenTokensFor10Weth,
                        ...{
                            fillableMakerAssetAmount: constants.ZERO_AMOUNT,
                            fillableTakerAssetAmount: constants.ZERO_AMOUNT,
                            fillableTakerFeeAmount: constants.ZERO_AMOUNT,
                        },
                    },
                ];

                const expectedResult = {
                    makerAssetAvailableInBaseUnits: constants.ZERO_AMOUNT,
                    takerAssetAvailableInBaseUnits: constants.ZERO_AMOUNT,
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    prunedOrders,
                    expectedResult,
                );
            });
        });
    });
});
