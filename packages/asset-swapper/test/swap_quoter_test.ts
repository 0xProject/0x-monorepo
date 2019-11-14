import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { Orderbook } from '@0x/orderbook';
import { Web3ProviderEngine } from '@0x/subproviders';
import { AssetPairsItem, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { SwapQuoter } from '../src';
import { constants } from '../src/constants';
import { LiquidityForAssetData, OrdersAndFillableAmounts } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { mockAvailableAssetDatas, mockedSwapQuoterWithOrdersAndFillableAmounts, orderbookMock } from './utils/mocks';

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

const baseUnitAmount = (unitAmount: number, decimals = TOKEN_DECIMALS): BigNumber => {
    return Web3Wrapper.toBaseUnitAmount(new BigNumber(unitAmount), decimals);
};

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
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    expectedLiquidityResult: LiquidityForAssetData,
) => {
    const mockedSwapQuoter = mockedSwapQuoterWithOrdersAndFillableAmounts(
        web3Provider,
        orderbook,
        FAKE_MAKER_ASSET_DATA,
        WETH_ASSET_DATA,
        ordersAndFillableAmounts,
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
                    makerTokensAvailableInBaseUnits: new BigNumber(0),
                    takerTokensAvailableInBaseUnits: new BigNumber(0),
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
                    makerTokensAvailableInBaseUnits: new BigNumber(0),
                    takerTokensAvailableInBaseUnits: new BigNumber(0),
                });
            });
        });

        describe('assetData is supported', () => {
            // orders
            const sellTwoTokensFor1Weth: SignedOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: baseUnitAmount(1, WETH_DECIMALS),
                chainId: 42,
            });
            const sellTenTokensFor10Weth: SignedOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: baseUnitAmount(10),
                takerAssetAmount: baseUnitAmount(10, WETH_DECIMALS),
                chainId: 42,
            });

            beforeEach(() => {
                mockAvailableAssetDatas(mockOrderbook, assetsToAssetPairItems(WETH_ASSET_DATA, FAKE_MAKER_ASSET_DATA));
            });

            it('should return 0s when no orders available', async () => {
                const ordersAndFillableAmounts: OrdersAndFillableAmounts = {
                    orders: [],
                    remainingFillableMakerAssetAmounts: [],
                };
                const expectedResult = {
                    makerTokensAvailableInBaseUnits: new BigNumber(0),
                    takerTokensAvailableInBaseUnits: new BigNumber(0),
                };
                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    ordersAndFillableAmounts,
                    expectedResult,
                );
            });

            it('should return correct computed value when orders provided with full fillableAmounts', async () => {
                const orders: SignedOrder[] = [sellTwoTokensFor1Weth, sellTenTokensFor10Weth];
                const ordersAndFillableAmounts = {
                    orders: [sellTwoTokensFor1Weth, sellTenTokensFor10Weth],
                    remainingFillableMakerAssetAmounts: orders.map(o => o.makerAssetAmount),
                };

                const expectedMakerTokensAvailable = orders[0].makerAssetAmount.plus(orders[1].makerAssetAmount);
                const expectedTakerTokensAvailable = orders[0].takerAssetAmount.plus(orders[1].takerAssetAmount);

                const expectedResult = {
                    makerTokensAvailableInBaseUnits: expectedMakerTokensAvailable,
                    takerTokensAvailableInBaseUnits: expectedTakerTokensAvailable,
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    ordersAndFillableAmounts,
                    expectedResult,
                );
            });

            it('should return correct computed value with one partial fillableAmounts', async () => {
                const ordersAndFillableAmounts = {
                    orders: [sellTwoTokensFor1Weth],
                    remainingFillableMakerAssetAmounts: [baseUnitAmount(1)],
                };

                const expectedResult = {
                    makerTokensAvailableInBaseUnits: baseUnitAmount(1),
                    takerTokensAvailableInBaseUnits: baseUnitAmount(0.5, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    ordersAndFillableAmounts,
                    expectedResult,
                );
            });

            it('should return correct computed value with multiple orders and fillable amounts', async () => {
                const ordersAndFillableAmounts = {
                    orders: [sellTwoTokensFor1Weth, sellTenTokensFor10Weth],
                    remainingFillableMakerAssetAmounts: [baseUnitAmount(1), baseUnitAmount(3)],
                };

                const expectedResult = {
                    makerTokensAvailableInBaseUnits: baseUnitAmount(4),
                    takerTokensAvailableInBaseUnits: baseUnitAmount(3.5, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    ordersAndFillableAmounts,
                    expectedResult,
                );
            });

            it('should return 0s when no amounts fillable', async () => {
                const ordersAndFillableAmounts = {
                    orders: [sellTwoTokensFor1Weth, sellTenTokensFor10Weth],
                    remainingFillableMakerAssetAmounts: [baseUnitAmount(0), baseUnitAmount(0)],
                };

                const expectedResult = {
                    makerTokensAvailableInBaseUnits: baseUnitAmount(0),
                    takerTokensAvailableInBaseUnits: baseUnitAmount(0, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderbook.object,
                    ordersAndFillableAmounts,
                    expectedResult,
                );
            });
        });
    });
});
