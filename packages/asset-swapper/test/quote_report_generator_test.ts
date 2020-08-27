// tslint:disable:custom-no-magic-numbers
import { orderHashUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { MarketOperation } from '../src/types';
import {
    CollapsedFill,
    DexSample,
    ERC20BridgeSource,
    MultiHopFillData,
    NativeCollapsedFill,
} from '../src/utils/market_operation_utils/types';
import { QuoteRequestor } from '../src/utils/quote_requestor';

import {
    BridgeReportSource,
    generateQuoteReport,
    MultiHopReportSource,
    NativeOrderbookReportSource,
    NativeRFQTReportSource,
    QuoteReportSource,
} from './../src/utils/quote_report_generator';
import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';

chaiSetup.configure();
const expect = chai.expect;

const collapsedFillFromNativeOrder = (order: SignedOrder): NativeCollapsedFill => {
    return {
        sourcePathId: hexUtils.random(),
        source: ERC20BridgeSource.Native,
        input: order.takerAssetAmount,
        output: order.makerAssetAmount,
        fillData: {
            order: {
                ...order,
                fillableMakerAssetAmount: new BigNumber(1),
                fillableTakerAssetAmount: new BigNumber(1),
                fillableTakerFeeAmount: new BigNumber(1),
            },
        },
        subFills: [],
    };
};

describe('generateQuoteReport', async () => {
    it('should generate report properly for sell', () => {
        const marketOperation: MarketOperation = MarketOperation.Sell;

        const kyberSample1: DexSample = {
            source: ERC20BridgeSource.Kyber,
            input: new BigNumber(10000),
            output: new BigNumber(10001),
        };
        const kyberSample2: DexSample = {
            source: ERC20BridgeSource.Kyber,
            input: new BigNumber(10003),
            output: new BigNumber(10004),
        };
        const uniswapSample1: DexSample = {
            source: ERC20BridgeSource.UniswapV2,
            input: new BigNumber(10003),
            output: new BigNumber(10004),
        };
        const uniswapSample2: DexSample = {
            source: ERC20BridgeSource.UniswapV2,
            input: new BigNumber(10005),
            output: new BigNumber(10006),
        };
        const dexQuotes: DexSample[] = [kyberSample1, kyberSample2, uniswapSample1, uniswapSample2];

        const orderbookOrder1FillableAmount = new BigNumber(1000);
        const orderbookOrder1 = testOrderFactory.generateTestSignedOrder({
            signature: 'orderbookOrder1',
            takerAssetAmount: orderbookOrder1FillableAmount,
        });
        const orderbookOrder2FillableAmount = new BigNumber(99);
        const orderbookOrder2 = testOrderFactory.generateTestSignedOrder({
            signature: 'orderbookOrder2',
            takerAssetAmount: orderbookOrder2FillableAmount.plus(99),
        });
        const rfqtOrder1FillableAmount = new BigNumber(100);
        const rfqtOrder1 = testOrderFactory.generateTestSignedOrder({
            signature: 'rfqtOrder1',
            takerAssetAmount: rfqtOrder1FillableAmount,
        });
        const rfqtOrder2FillableAmount = new BigNumber(1001);
        const rfqtOrder2 = testOrderFactory.generateTestSignedOrder({
            signature: 'rfqtOrder2',
            takerAssetAmount: rfqtOrder2FillableAmount.plus(100),
        });
        const nativeOrders: SignedOrder[] = [orderbookOrder1, rfqtOrder1, rfqtOrder2, orderbookOrder2];
        const orderFillableAmounts: BigNumber[] = [
            orderbookOrder1FillableAmount,
            rfqtOrder1FillableAmount,
            rfqtOrder2FillableAmount,
            orderbookOrder2FillableAmount,
        ];

        // generate path
        const uniswap2Fill: CollapsedFill = { ...uniswapSample2, subFills: [], sourcePathId: hexUtils.random() };
        const kyber2Fill: CollapsedFill = { ...kyberSample2, subFills: [], sourcePathId: hexUtils.random() };
        const orderbookOrder2Fill: CollapsedFill = collapsedFillFromNativeOrder(orderbookOrder2);
        const rfqtOrder2Fill: CollapsedFill = collapsedFillFromNativeOrder(rfqtOrder2);
        const pathGenerated: CollapsedFill[] = [rfqtOrder2Fill, orderbookOrder2Fill, uniswap2Fill, kyber2Fill];

        // quote generator mock
        const quoteRequestor = TypeMoq.Mock.ofType<QuoteRequestor>();
        quoteRequestor
            .setup(qr => qr.getMakerUriForOrderHash(orderHashUtils.getOrderHash(orderbookOrder2)))
            .returns(() => {
                return undefined;
            })
            .verifiable(TypeMoq.Times.atLeastOnce());
        quoteRequestor
            .setup(qr => qr.getMakerUriForOrderHash(orderHashUtils.getOrderHash(rfqtOrder1)))
            .returns(() => {
                return 'https://rfqt1.provider.club';
            })
            .verifiable(TypeMoq.Times.atLeastOnce());
        quoteRequestor
            .setup(qr => qr.getMakerUriForOrderHash(orderHashUtils.getOrderHash(rfqtOrder2)))
            .returns(() => {
                return 'https://rfqt2.provider.club';
            })
            .verifiable(TypeMoq.Times.atLeastOnce());

        const orderReport = generateQuoteReport(
            marketOperation,
            dexQuotes,
            [],
            nativeOrders,
            orderFillableAmounts,
            pathGenerated,
            quoteRequestor.object,
        );

        const rfqtOrder1Source: NativeRFQTReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: rfqtOrder1.makerAssetAmount,
            takerAmount: rfqtOrder1.takerAssetAmount,
            orderHash: orderHashUtils.getOrderHash(rfqtOrder1),
            nativeOrder: rfqtOrder1,
            fillableTakerAmount: rfqtOrder1FillableAmount,
            isRfqt: true,
            makerUri: 'https://rfqt1.provider.club',
        };
        const rfqtOrder2Source: NativeRFQTReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: rfqtOrder2.makerAssetAmount,
            takerAmount: rfqtOrder2.takerAssetAmount,
            orderHash: orderHashUtils.getOrderHash(rfqtOrder2),
            nativeOrder: rfqtOrder2,
            fillableTakerAmount: rfqtOrder2FillableAmount,
            isRfqt: true,
            makerUri: 'https://rfqt2.provider.club',
        };
        const orderbookOrder1Source: NativeOrderbookReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: orderbookOrder1.makerAssetAmount,
            takerAmount: orderbookOrder1.takerAssetAmount,
            orderHash: orderHashUtils.getOrderHash(orderbookOrder1),
            nativeOrder: orderbookOrder1,
            fillableTakerAmount: orderbookOrder1FillableAmount,
            isRfqt: false,
        };
        const orderbookOrder2Source: NativeOrderbookReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: orderbookOrder2.makerAssetAmount,
            takerAmount: orderbookOrder2.takerAssetAmount,
            orderHash: orderHashUtils.getOrderHash(orderbookOrder2),
            nativeOrder: orderbookOrder2,
            fillableTakerAmount: orderbookOrder2FillableAmount,
            isRfqt: false,
        };
        const uniswap1Source: BridgeReportSource = {
            liquiditySource: ERC20BridgeSource.UniswapV2,
            makerAmount: uniswapSample1.output,
            takerAmount: uniswapSample1.input,
        };
        const uniswap2Source: BridgeReportSource = {
            liquiditySource: ERC20BridgeSource.UniswapV2,
            makerAmount: uniswapSample2.output,
            takerAmount: uniswapSample2.input,
        };
        const kyber1Source: BridgeReportSource = {
            liquiditySource: ERC20BridgeSource.Kyber,
            makerAmount: kyberSample1.output,
            takerAmount: kyberSample1.input,
        };
        const kyber2Source: BridgeReportSource = {
            liquiditySource: ERC20BridgeSource.Kyber,
            makerAmount: kyberSample2.output,
            takerAmount: kyberSample2.input,
        };

        const expectedSourcesConsidered: QuoteReportSource[] = [
            kyber1Source,
            kyber2Source,
            uniswap1Source,
            uniswap2Source,
            orderbookOrder1Source,
            rfqtOrder1Source,
            rfqtOrder2Source,
            orderbookOrder2Source,
        ];

        expect(orderReport.sourcesConsidered.length).to.eql(expectedSourcesConsidered.length);

        orderReport.sourcesConsidered.forEach((actualSourcesConsidered, idx) => {
            const expectedSourceConsidered = expectedSourcesConsidered[idx];
            expect(actualSourcesConsidered).to.eql(
                expectedSourceConsidered,
                `sourceConsidered incorrect at index ${idx}`,
            );
        });

        const expectedSourcesDelivered: QuoteReportSource[] = [
            rfqtOrder2Source,
            orderbookOrder2Source,
            uniswap2Source,
            kyber2Source,
        ];
        expect(orderReport.sourcesDelivered.length).to.eql(expectedSourcesDelivered.length);
        orderReport.sourcesDelivered.forEach((actualSourceDelivered, idx) => {
            const expectedSourceDelivered = expectedSourcesDelivered[idx];

            // remove fillable values
            if (actualSourceDelivered.liquiditySource === ERC20BridgeSource.Native) {
                actualSourceDelivered.nativeOrder = _.omit(actualSourceDelivered.nativeOrder, [
                    'fillableMakerAssetAmount',
                    'fillableTakerAssetAmount',
                    'fillableTakerFeeAmount',
                ]) as SignedOrder;
            }

            expect(actualSourceDelivered).to.eql(expectedSourceDelivered, `sourceDelivered incorrect at index ${idx}`);
        });

        quoteRequestor.verifyAll();
    });
    it('should handle properly for buy without quoteRequestor', () => {
        const marketOperation: MarketOperation = MarketOperation.Buy;
        const kyberSample1: DexSample = {
            source: ERC20BridgeSource.Kyber,
            input: new BigNumber(10000),
            output: new BigNumber(10001),
        };
        const uniswapSample1: DexSample = {
            source: ERC20BridgeSource.UniswapV2,
            input: new BigNumber(10003),
            output: new BigNumber(10004),
        };
        const dexQuotes: DexSample[] = [kyberSample1, uniswapSample1];

        const orderbookOrder1FillableAmount = new BigNumber(1000);
        const orderbookOrder1 = testOrderFactory.generateTestSignedOrder({
            signature: 'orderbookOrder1',
            takerAssetAmount: orderbookOrder1FillableAmount.plus(101),
        });
        const orderbookOrder2FillableAmount = new BigNumber(5000);
        const orderbookOrder2 = testOrderFactory.generateTestSignedOrder({
            signature: 'orderbookOrder2',
            takerAssetAmount: orderbookOrder2FillableAmount.plus(101),
        });
        const nativeOrders: SignedOrder[] = [orderbookOrder1, orderbookOrder2];
        const orderFillableAmounts: BigNumber[] = [orderbookOrder1FillableAmount, orderbookOrder2FillableAmount];

        // generate path
        const orderbookOrder1Fill: CollapsedFill = collapsedFillFromNativeOrder(orderbookOrder1);
        const uniswap1Fill: CollapsedFill = { ...uniswapSample1, subFills: [], sourcePathId: hexUtils.random() };
        const kyber1Fill: CollapsedFill = { ...kyberSample1, subFills: [], sourcePathId: hexUtils.random() };
        const pathGenerated: CollapsedFill[] = [orderbookOrder1Fill, uniswap1Fill, kyber1Fill];

        const orderReport = generateQuoteReport(
            marketOperation,
            dexQuotes,
            [],
            nativeOrders,
            orderFillableAmounts,
            pathGenerated,
        );

        const orderbookOrder1Source: NativeOrderbookReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: orderbookOrder1.makerAssetAmount,
            takerAmount: orderbookOrder1.takerAssetAmount,
            orderHash: orderHashUtils.getOrderHash(orderbookOrder1),
            nativeOrder: orderbookOrder1,
            fillableTakerAmount: orderbookOrder1FillableAmount,
            isRfqt: false,
        };
        const orderbookOrder2Source: NativeOrderbookReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: orderbookOrder2.makerAssetAmount,
            takerAmount: orderbookOrder2.takerAssetAmount,
            orderHash: orderHashUtils.getOrderHash(orderbookOrder2),
            nativeOrder: orderbookOrder2,
            fillableTakerAmount: orderbookOrder2FillableAmount,
            isRfqt: false,
        };
        const uniswap1Source: BridgeReportSource = {
            liquiditySource: ERC20BridgeSource.UniswapV2,
            makerAmount: uniswapSample1.input,
            takerAmount: uniswapSample1.output,
        };
        const kyber1Source: BridgeReportSource = {
            liquiditySource: ERC20BridgeSource.Kyber,
            makerAmount: kyberSample1.input,
            takerAmount: kyberSample1.output,
        };

        const expectedSourcesConsidered: QuoteReportSource[] = [
            kyber1Source,
            uniswap1Source,
            orderbookOrder1Source,
            orderbookOrder2Source,
        ];
        expect(orderReport.sourcesConsidered.length).to.eql(expectedSourcesConsidered.length);
        orderReport.sourcesConsidered.forEach((actualSourcesConsidered, idx) => {
            const expectedSourceConsidered = expectedSourcesConsidered[idx];
            expect(actualSourcesConsidered).to.eql(
                expectedSourceConsidered,
                `sourceConsidered incorrect at index ${idx}`,
            );
        });

        const expectedSourcesDelivered: QuoteReportSource[] = [orderbookOrder1Source, uniswap1Source, kyber1Source];
        expect(orderReport.sourcesDelivered.length).to.eql(expectedSourcesDelivered.length);
        orderReport.sourcesDelivered.forEach((actualSourceDelivered, idx) => {
            const expectedSourceDelivered = expectedSourcesDelivered[idx];

            // remove fillable values
            if (actualSourceDelivered.liquiditySource === ERC20BridgeSource.Native) {
                actualSourceDelivered.nativeOrder = _.omit(actualSourceDelivered.nativeOrder, [
                    'fillableMakerAssetAmount',
                    'fillableTakerAssetAmount',
                    'fillableTakerFeeAmount',
                ]) as SignedOrder;
            }

            expect(actualSourceDelivered).to.eql(expectedSourceDelivered, `sourceDelivered incorrect at index ${idx}`);
        });
    });
    it('should correctly generate report for a two-hop quote', () => {
        const marketOperation: MarketOperation = MarketOperation.Sell;
        const kyberSample1: DexSample = {
            source: ERC20BridgeSource.Kyber,
            input: new BigNumber(10000),
            output: new BigNumber(10001),
        };

        const orderbookOrder1FillableAmount = new BigNumber(1000);
        const orderbookOrder1 = testOrderFactory.generateTestSignedOrder({
            signature: 'orderbookOrder1',
            takerAssetAmount: orderbookOrder1FillableAmount.plus(101),
        });

        const twoHopSample: DexSample<MultiHopFillData> = {
            source: ERC20BridgeSource.MultiHop,
            input: new BigNumber(3005),
            output: new BigNumber(3006),
            fillData: {
                intermediateToken: hexUtils.random(20),
                firstHopSource: {
                    source: ERC20BridgeSource.Balancer,
                    encodeCall: () => '',
                    handleCallResults: _callResults => [new BigNumber(1337)],
                },
                secondHopSource: {
                    source: ERC20BridgeSource.Curve,
                    encodeCall: () => '',
                    handleCallResults: _callResults => [new BigNumber(1337)],
                },
            },
        };

        const orderReport = generateQuoteReport(
            marketOperation,
            [kyberSample1],
            [twoHopSample],
            [orderbookOrder1],
            [orderbookOrder1FillableAmount],
            twoHopSample,
        );
        const orderbookOrder1Source: NativeOrderbookReportSource = {
            liquiditySource: ERC20BridgeSource.Native,
            makerAmount: orderbookOrder1.makerAssetAmount,
            takerAmount: orderbookOrder1.takerAssetAmount,
            orderHash: orderHashUtils.getOrderHash(orderbookOrder1),
            nativeOrder: orderbookOrder1,
            fillableTakerAmount: orderbookOrder1FillableAmount,
            isRfqt: false,
        };
        const kyber1Source: BridgeReportSource = {
            liquiditySource: ERC20BridgeSource.Kyber,
            makerAmount: kyberSample1.output,
            takerAmount: kyberSample1.input,
        };
        const twoHopSource: MultiHopReportSource = {
            liquiditySource: ERC20BridgeSource.MultiHop,
            makerAmount: twoHopSample.output,
            takerAmount: twoHopSample.input,
            hopSources: [ERC20BridgeSource.Balancer, ERC20BridgeSource.Curve],
        };

        const expectedSourcesConsidered: QuoteReportSource[] = [kyber1Source, orderbookOrder1Source, twoHopSource];
        expect(orderReport.sourcesConsidered.length).to.eql(expectedSourcesConsidered.length);
        orderReport.sourcesConsidered.forEach((actualSourcesConsidered, idx) => {
            const expectedSourceConsidered = expectedSourcesConsidered[idx];
            expect(actualSourcesConsidered).to.eql(
                expectedSourceConsidered,
                `sourceConsidered incorrect at index ${idx}`,
            );
        });

        expect(orderReport.sourcesDelivered.length).to.eql(1);
        expect(orderReport.sourcesDelivered[0]).to.deep.equal(twoHopSource);
    });
});
