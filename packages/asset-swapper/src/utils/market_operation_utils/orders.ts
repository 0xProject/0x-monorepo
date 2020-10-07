import { ContractAddresses } from '@0x/contract-addresses';
import { assetDataUtils, ERC20AssetData, generatePseudoRandomSalt, orderCalculationUtils } from '@0x/order-utils';
import { RFQTIndicativeQuote } from '@0x/quote-server';
import { ERC20BridgeAssetData, SignedOrder } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../../types';

import {
    ERC20_PROXY_ID,
    MAX_UINT256,
    NULL_ADDRESS,
    NULL_BYTES,
    ONE_HOUR_IN_SECONDS,
    ONE_SECOND_MS,
    WALLET_SIGNATURE,
    ZERO_AMOUNT,
} from './constants';
import { getMultiBridgeIntermediateToken } from './multibridge_utils';
import {
    AggregationError,
    BalancerFillData,
    BancorFillData,
    CollapsedFill,
    CurveFillData,
    DexSample,
    ERC20BridgeSource,
    KyberFillData,
    LiquidityProviderFillData,
    MooniswapFillData,
    MultiBridgeFillData,
    MultiHopFillData,
    NativeCollapsedFill,
    OptimizedMarketOrder,
    OrderDomain,
    SushiSwapFillData,
    SwerveFillData,
    UniswapV2FillData,
} from './types';

// tslint:disable completed-docs no-unnecessary-type-assertion

interface DexForwaderBridgeData {
    inputToken: string;
    calls: Array<{
        target: string;
        inputTokenAmount: BigNumber;
        outputTokenAmount: BigNumber;
        bridgeData: string;
    }>;
}

const dexForwarderBridgeDataEncoder = AbiEncoder.create([
    { name: 'inputToken', type: 'address' },
    {
        name: 'calls',
        type: 'tuple[]',
        components: [
            { name: 'target', type: 'address' },
            { name: 'inputTokenAmount', type: 'uint256' },
            { name: 'outputTokenAmount', type: 'uint256' },
            { name: 'bridgeData', type: 'bytes' },
        ],
    },
]);

export function createDummyOrderForSampler(
    makerAssetData: string,
    takerAssetData: string,
    makerAddress: string,
): SignedOrder {
    return {
        makerAddress,
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        salt: ZERO_AMOUNT,
        expirationTimeSeconds: ZERO_AMOUNT,
        makerAssetData,
        takerAssetData,
        makerFeeAssetData: NULL_BYTES,
        takerFeeAssetData: NULL_BYTES,
        makerFee: ZERO_AMOUNT,
        takerFee: ZERO_AMOUNT,
        makerAssetAmount: ZERO_AMOUNT,
        takerAssetAmount: ZERO_AMOUNT,
        signature: NULL_BYTES,
        chainId: 1,
        exchangeAddress: NULL_ADDRESS,
    };
}

export function getNativeOrderTokens(order: SignedOrder): [string, string] {
    const assets = [order.makerAssetData, order.takerAssetData].map(a => assetDataUtils.decodeAssetDataOrThrow(a)) as [
        ERC20AssetData,
        ERC20AssetData
    ];
    if (assets.some(a => a.assetProxyId !== ERC20_PROXY_ID)) {
        throw new Error(AggregationError.NotERC20AssetData);
    }
    return assets.map(a => a.tokenAddress.toLowerCase()) as [string, string];
}

export function convertNativeOrderToFullyFillableOptimizedOrders(order: SignedOrder): OptimizedMarketOrder {
    return {
        ...order,
        fillableMakerAssetAmount: order.makerAssetAmount,
        fillableTakerAssetAmount: order.takerAssetAmount,
        fillableTakerFeeAmount: order.takerFee,
        fills: [],
    };
}

/**
 * Augments native orders with fillable amounts and filters out unfillable orders.
 */
export function createSignedOrdersWithFillableAmounts(
    side: MarketOperation,
    orders: SignedOrder[],
    fillableAmounts: BigNumber[],
): SignedOrderWithFillableAmounts[] {
    return orders
        .map((order: SignedOrder, i: number) => {
            const fillableAmount = fillableAmounts[i];
            const fillableMakerAssetAmount =
                side === MarketOperation.Buy
                    ? fillableAmount
                    : orderCalculationUtils.getMakerFillAmount(order, fillableAmount);
            const fillableTakerAssetAmount =
                side === MarketOperation.Sell
                    ? fillableAmount
                    : orderCalculationUtils.getTakerFillAmount(order, fillableAmount);
            const fillableTakerFeeAmount = orderCalculationUtils.getTakerFeeAmount(order, fillableTakerAssetAmount);
            return {
                ...order,
                fillableMakerAssetAmount,
                fillableTakerAssetAmount,
                fillableTakerFeeAmount,
            };
        })
        .filter(order => {
            return !order.fillableMakerAssetAmount.isZero() && !order.fillableTakerAssetAmount.isZero();
        });
}

export interface CreateOrderFromPathOpts {
    side: MarketOperation;
    inputToken: string;
    outputToken: string;
    orderDomain: OrderDomain;
    contractAddresses: ContractAddresses;
    bridgeSlippage: number;
}

export function createOrdersFromTwoHopSample(
    sample: DexSample<MultiHopFillData>,
    opts: CreateOrderFromPathOpts,
): OptimizedMarketOrder[] {
    const [makerToken, takerToken] = getMakerTakerTokens(opts);
    const { firstHopSource, secondHopSource, intermediateToken } = sample.fillData!;
    const firstHopFill: CollapsedFill = {
        sourcePathId: '',
        source: firstHopSource.source,
        input: opts.side === MarketOperation.Sell ? sample.input : ZERO_AMOUNT,
        output: opts.side === MarketOperation.Sell ? ZERO_AMOUNT : sample.output,
        subFills: [],
        fillData: firstHopSource.fillData,
    };
    const secondHopFill: CollapsedFill = {
        sourcePathId: '',
        source: secondHopSource.source,
        input: opts.side === MarketOperation.Sell ? MAX_UINT256 : sample.input,
        output: opts.side === MarketOperation.Sell ? sample.output : MAX_UINT256,
        subFills: [],
        fillData: secondHopSource.fillData,
    };
    return [
        createBridgeOrder(firstHopFill, intermediateToken, takerToken, opts),
        createBridgeOrder(secondHopFill, makerToken, intermediateToken, opts),
    ];
}

function getBridgeAddressFromFill(fill: CollapsedFill, opts: CreateOrderFromPathOpts): string {
    switch (fill.source) {
        case ERC20BridgeSource.Eth2Dai:
            return opts.contractAddresses.eth2DaiBridge;
        case ERC20BridgeSource.Kyber:
            return opts.contractAddresses.kyberBridge;
        case ERC20BridgeSource.Uniswap:
            return opts.contractAddresses.uniswapBridge;
        case ERC20BridgeSource.UniswapV2:
            return opts.contractAddresses.uniswapV2Bridge;
        case ERC20BridgeSource.SushiSwap:
            return opts.contractAddresses.sushiswapBridge;
        case ERC20BridgeSource.Curve:
            return opts.contractAddresses.curveBridge;
        case ERC20BridgeSource.Swerve:
            return opts.contractAddresses.curveBridge;
        case ERC20BridgeSource.Bancor:
            return opts.contractAddresses.bancorBridge;
        case ERC20BridgeSource.Balancer:
            return opts.contractAddresses.balancerBridge;
        case ERC20BridgeSource.LiquidityProvider:
            return (fill.fillData as LiquidityProviderFillData).poolAddress;
        case ERC20BridgeSource.MultiBridge:
            return (fill.fillData as MultiBridgeFillData).poolAddress;
        case ERC20BridgeSource.MStable:
            return opts.contractAddresses.mStableBridge;
        case ERC20BridgeSource.Mooniswap:
            return opts.contractAddresses.mooniswapBridge;
        case ERC20BridgeSource.Shell:
            return opts.contractAddresses.shellBridge;
        default:
            break;
    }
    throw new Error(AggregationError.NoBridgeForSource);
}

export function createBridgeOrder(
    fill: CollapsedFill,
    makerToken: string,
    takerToken: string,
    opts: CreateOrderFromPathOpts,
): OptimizedMarketOrder {
    const bridgeAddress = getBridgeAddressFromFill(fill, opts);

    let makerAssetData;
    switch (fill.source) {
        case ERC20BridgeSource.Curve:
            const curveFillData = (fill as CollapsedFill<CurveFillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createCurveBridgeData(
                    curveFillData.curve.poolAddress,
                    curveFillData.curve.exchangeFunctionSelector,
                    takerToken,
                    curveFillData.fromTokenIdx,
                    curveFillData.toTokenIdx,
                ),
            );
            break;
        case ERC20BridgeSource.Swerve:
            const swerveFillData = (fill as CollapsedFill<SwerveFillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createCurveBridgeData(
                    swerveFillData.pool.poolAddress,
                    swerveFillData.pool.exchangeFunctionSelector,
                    takerToken,
                    swerveFillData.fromTokenIdx,
                    swerveFillData.toTokenIdx,
                ),
            );
            break;
        case ERC20BridgeSource.Balancer:
            const balancerFillData = (fill as CollapsedFill<BalancerFillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createBalancerBridgeData(takerToken, balancerFillData.poolAddress),
            );
            break;
        case ERC20BridgeSource.Bancor:
            const bancorFillData = (fill as CollapsedFill<BancorFillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createBancorBridgeData(bancorFillData.path, bancorFillData.networkAddress),
            );
            break;
        case ERC20BridgeSource.UniswapV2:
            const uniswapV2FillData = (fill as CollapsedFill<UniswapV2FillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createUniswapV2BridgeData(uniswapV2FillData.tokenAddressPath),
            );
            break;
        case ERC20BridgeSource.SushiSwap:
            const sushiSwapFillData = (fill as CollapsedFill<SushiSwapFillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createSushiSwapBridgeData(sushiSwapFillData.tokenAddressPath, sushiSwapFillData.router),
            );
            break;
        case ERC20BridgeSource.MultiBridge:
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createMultiBridgeData(takerToken, makerToken),
            );
            break;
        case ERC20BridgeSource.Kyber:
            const kyberFillData = (fill as CollapsedFill<KyberFillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createKyberBridgeData(takerToken, kyberFillData.hint),
            );
            break;
        case ERC20BridgeSource.Mooniswap:
            const mooniswapFillData = (fill as CollapsedFill<MooniswapFillData>).fillData!; // tslint:disable-line:no-non-null-assertion
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createMooniswapBridgeData(takerToken, mooniswapFillData.poolAddress),
            );
            break;
        default:
            makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
                makerToken,
                bridgeAddress,
                createBridgeData(takerToken),
            );
    }
    const [slippedMakerAssetAmount, slippedTakerAssetAmount] = getSlippedBridgeAssetAmounts(fill, opts);
    return {
        fills: [fill],
        makerAssetData,
        takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken),
        makerAddress: bridgeAddress,
        makerAssetAmount: slippedMakerAssetAmount,
        takerAssetAmount: slippedTakerAssetAmount,
        fillableMakerAssetAmount: slippedMakerAssetAmount,
        fillableTakerAssetAmount: slippedTakerAssetAmount,
        ...createCommonBridgeOrderFields(opts.orderDomain),
    };
}

export function getMakerTakerTokens(opts: CreateOrderFromPathOpts): [string, string] {
    const makerToken = opts.side === MarketOperation.Sell ? opts.outputToken : opts.inputToken;
    const takerToken = opts.side === MarketOperation.Sell ? opts.inputToken : opts.outputToken;
    return [makerToken, takerToken];
}

function createBridgeData(tokenAddress: string): string {
    const encoder = AbiEncoder.create([{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress });
}

function createMultiBridgeData(takerToken: string, makerToken: string): string {
    const intermediateToken = getMultiBridgeIntermediateToken(takerToken, makerToken);
    const encoder = AbiEncoder.create([
        { name: 'takerToken', type: 'address' },
        { name: 'intermediateToken', type: 'address' },
    ]);
    return encoder.encode({ takerToken, intermediateToken });
}

function createBalancerBridgeData(takerToken: string, poolAddress: string): string {
    const encoder = AbiEncoder.create([
        { name: 'takerToken', type: 'address' },
        { name: 'poolAddress', type: 'address' },
    ]);
    return encoder.encode({ takerToken, poolAddress });
}

function createBancorBridgeData(path: string[], networkAddress: string): string {
    const encoder = AbiEncoder.create([
        { name: 'path', type: 'address[]' },
        { name: 'networkAddress', type: 'address' },
    ]);
    return encoder.encode({ path, networkAddress });
}

function createKyberBridgeData(fromTokenAddress: string, hint: string): string {
    const encoder = AbiEncoder.create([{ name: 'fromTokenAddress', type: 'address' }, { name: 'hint', type: 'bytes' }]);
    return encoder.encode({ fromTokenAddress, hint });
}

function createMooniswapBridgeData(takerToken: string, poolAddress: string): string {
    const encoder = AbiEncoder.create([
        { name: 'takerToken', type: 'address' },
        { name: 'poolAddress', type: 'address' },
    ]);
    return encoder.encode({ takerToken, poolAddress });
}

function createCurveBridgeData(
    curveAddress: string,
    exchangeFunctionSelector: string,
    takerToken: string,
    fromTokenIdx: number,
    toTokenIdx: number,
): string {
    const encoder = AbiEncoder.create([
        { name: 'curveAddress', type: 'address' },
        { name: 'exchangeFunctionSelector', type: 'bytes4' },
        { name: 'fromTokenAddress', type: 'address' },
        { name: 'fromTokenIdx', type: 'int128' },
        { name: 'toTokenIdx', type: 'int128' },
    ]);
    return encoder.encode([curveAddress, exchangeFunctionSelector, takerToken, fromTokenIdx, toTokenIdx]);
}

function createUniswapV2BridgeData(tokenAddressPath: string[]): string {
    const encoder = AbiEncoder.create('(address[])');
    return encoder.encode([tokenAddressPath]);
}

function createSushiSwapBridgeData(tokenAddressPath: string[], router: string): string {
    const encoder = AbiEncoder.create('(address[],address)');
    return encoder.encode([tokenAddressPath, router]);
}

function getSlippedBridgeAssetAmounts(fill: CollapsedFill, opts: CreateOrderFromPathOpts): [BigNumber, BigNumber] {
    return [
        // Maker asset amount.
        opts.side === MarketOperation.Sell
            ? fill.output.times(1 - opts.bridgeSlippage).integerValue(BigNumber.ROUND_DOWN)
            : fill.input,
        // Taker asset amount.
        opts.side === MarketOperation.Sell
            ? fill.input
            : BigNumber.min(fill.output.times(opts.bridgeSlippage + 1).integerValue(BigNumber.ROUND_UP), MAX_UINT256),
    ];
}

type CommonBridgeOrderFields = Pick<
    OptimizedMarketOrder,
    Exclude<
        keyof OptimizedMarketOrder,
        | 'fills'
        | 'makerAddress'
        | 'makerAssetData'
        | 'takerAssetData'
        | 'makerAssetAmount'
        | 'takerAssetAmount'
        | 'fillableMakerAssetAmount'
        | 'fillableTakerAssetAmount'
    >
>;

function createCommonBridgeOrderFields(orderDomain: OrderDomain): CommonBridgeOrderFields {
    return {
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        salt: generatePseudoRandomSalt(),
        // 2 hours from now
        expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / ONE_SECOND_MS) + ONE_HOUR_IN_SECONDS * 2),
        makerFeeAssetData: NULL_BYTES,
        takerFeeAssetData: NULL_BYTES,
        makerFee: ZERO_AMOUNT,
        takerFee: ZERO_AMOUNT,
        fillableTakerFeeAmount: ZERO_AMOUNT,
        signature: WALLET_SIGNATURE,
        ...orderDomain,
    };
}

export function createNativeOrder(fill: NativeCollapsedFill): OptimizedMarketOrder {
    return {
        fills: [fill],
        ...fill.fillData!.order, // tslint:disable-line:no-non-null-assertion
    };
}

export function createSignedOrdersFromRfqtIndicativeQuotes(
    quotes: RFQTIndicativeQuote[],
): SignedOrderWithFillableAmounts[] {
    return quotes.map(quote => {
        return {
            fillableMakerAssetAmount: quote.makerAssetAmount,
            fillableTakerAssetAmount: quote.takerAssetAmount,
            makerAssetAmount: quote.makerAssetAmount,
            takerAssetAmount: quote.takerAssetAmount,
            makerAssetData: quote.makerAssetData,
            takerAssetData: quote.takerAssetData,
            takerAddress: NULL_ADDRESS,
            makerAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            feeRecipientAddress: NULL_ADDRESS,
            salt: ZERO_AMOUNT,
            expirationTimeSeconds: quote.expirationTimeSeconds,
            makerFeeAssetData: NULL_BYTES,
            takerFeeAssetData: NULL_BYTES,
            makerFee: ZERO_AMOUNT,
            takerFee: ZERO_AMOUNT,
            fillableTakerFeeAmount: ZERO_AMOUNT,
            signature: WALLET_SIGNATURE,
            chainId: 0,
            exchangeAddress: NULL_ADDRESS,
        };
    });
}
