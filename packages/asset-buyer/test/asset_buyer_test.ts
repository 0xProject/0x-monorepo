import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { Web3ProviderEngine } from '@0x/subproviders';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { AssetBuyer } from '../src';
import { constants } from '../src/constants';
import { LiquidityForAssetData, OrderProvider, OrdersAndFillableAmounts } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import {
    mockAvailableAssetDatas,
    mockedAssetBuyerWithOrdersAndFillableAmounts,
    orderProviderMock,
} from './utils/mocks';

chaiSetup.configure();
const expect = chai.expect;

const FAKE_SRA_URL = 'https://fakeurl.com';
const FAKE_ASSET_DATA = '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48';
const TOKEN_DECIMALS = 18;
const DAI_ASSET_DATA = '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359"';
const WETH_ASSET_DATA = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const WETH_DECIMALS = constants.ETHER_TOKEN_DECIMALS;

const baseUnitAmount = (unitAmount: number, decimals = TOKEN_DECIMALS): BigNumber => {
    return Web3Wrapper.toBaseUnitAmount(new BigNumber(unitAmount), decimals);
};

const expectLiquidityResult = async (
    web3Provider: Web3ProviderEngine,
    orderProvider: OrderProvider,
    ordersAndFillableAmounts: OrdersAndFillableAmounts,
    expectedLiquidityResult: LiquidityForAssetData,
) => {
    const mockedAssetBuyer = mockedAssetBuyerWithOrdersAndFillableAmounts(
        web3Provider,
        orderProvider,
        FAKE_ASSET_DATA,
        ordersAndFillableAmounts,
    );
    const liquidityResult = await mockedAssetBuyer.object.getLiquidityForAssetDataAsync(FAKE_ASSET_DATA);
    expect(liquidityResult).to.deep.equal(expectedLiquidityResult);
};

// tslint:disable:custom-no-magic-numbers
describe('AssetBuyer', () => {
    describe('getLiquidityForAssetDataAsync', () => {
        const mockWeb3Provider = TypeMoq.Mock.ofType(Web3ProviderEngine);
        const mockOrderProvider = orderProviderMock();

        beforeEach(() => {
            mockWeb3Provider.reset();
            mockOrderProvider.reset();
        });

        afterEach(() => {
            mockWeb3Provider.verifyAll();
            mockOrderProvider.verifyAll();
        });

        describe('validation', () => {
            it('should ensure assetData is a string', async () => {
                const assetBuyer = AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(
                    mockWeb3Provider.object,
                    FAKE_SRA_URL,
                );

                expect(assetBuyer.getLiquidityForAssetDataAsync(false as any)).to.be.rejectedWith(
                    'Expected assetData to be of type string, encountered: false',
                );
            });
        });

        describe('asset pair not supported', () => {
            it('should return 0s when no asset pair not supported', async () => {
                mockAvailableAssetDatas(mockOrderProvider, FAKE_ASSET_DATA, []);

                const assetBuyer = new AssetBuyer(mockWeb3Provider.object, mockOrderProvider.object);
                const liquidityResult = await assetBuyer.getLiquidityForAssetDataAsync(FAKE_ASSET_DATA);
                expect(liquidityResult).to.deep.equal({
                    tokensAvailableInBaseUnits: new BigNumber(0),
                    ethValueAvailableInWei: new BigNumber(0),
                });
            });
            it('should return 0s when only other asset pair supported', async () => {
                mockAvailableAssetDatas(mockOrderProvider, FAKE_ASSET_DATA, [DAI_ASSET_DATA]);

                const assetBuyer = new AssetBuyer(mockWeb3Provider.object, mockOrderProvider.object);
                const liquidityResult = await assetBuyer.getLiquidityForAssetDataAsync(FAKE_ASSET_DATA);
                expect(liquidityResult).to.deep.equal({
                    tokensAvailableInBaseUnits: new BigNumber(0),
                    ethValueAvailableInWei: new BigNumber(0),
                });
            });
        });

        // TODO (xianny): needs to be updated to new SignedOrder interface
        describe('assetData is supported', () => {
            const chainId = 1;
            // orders
            const sellTwoTokensFor1Weth: SignedOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: baseUnitAmount(2),
                takerAssetAmount: baseUnitAmount(1, WETH_DECIMALS),
                chainId,
            });
            const sellTenTokensFor10Weth: SignedOrder = orderFactory.createSignedOrderFromPartial({
                makerAssetAmount: baseUnitAmount(10),
                takerAssetAmount: baseUnitAmount(10, WETH_DECIMALS),
                chainId,
            });

            beforeEach(() => {
                mockAvailableAssetDatas(mockOrderProvider, FAKE_ASSET_DATA, [WETH_ASSET_DATA]);
            });

            it('should return 0s when no orders available', async () => {
                const ordersAndFillableAmounts: OrdersAndFillableAmounts = {
                    orders: [],
                    remainingFillableMakerAssetAmounts: [],
                };
                const expectedResult = {
                    tokensAvailableInBaseUnits: new BigNumber(0),
                    ethValueAvailableInWei: new BigNumber(0),
                };
                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderProvider.object,
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

                const expectedTokensAvailable = orders[0].makerAssetAmount.plus(orders[1].makerAssetAmount);
                const expectedEthValueAvailable = orders[0].takerAssetAmount.plus(orders[1].takerAssetAmount);
                const expectedResult = {
                    tokensAvailableInBaseUnits: expectedTokensAvailable,
                    ethValueAvailableInWei: expectedEthValueAvailable,
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderProvider.object,
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
                    tokensAvailableInBaseUnits: baseUnitAmount(1),
                    ethValueAvailableInWei: baseUnitAmount(0.5, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderProvider.object,
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
                    tokensAvailableInBaseUnits: baseUnitAmount(4),
                    ethValueAvailableInWei: baseUnitAmount(3.5, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderProvider.object,
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
                    tokensAvailableInBaseUnits: baseUnitAmount(0),
                    ethValueAvailableInWei: baseUnitAmount(0, WETH_DECIMALS),
                };

                await expectLiquidityResult(
                    mockWeb3Provider.object,
                    mockOrderProvider.object,
                    ordersAndFillableAmounts,
                    expectedResult,
                );
            });
        });
    });
});
