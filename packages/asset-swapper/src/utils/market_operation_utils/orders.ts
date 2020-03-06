import { ContractAddresses } from '@0x/contract-addresses';
import { assetDataUtils, ERC20AssetData, generatePseudoRandomSalt, orderCalculationUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../../types';

import {
    DEFAULT_CURVE_OPTS,
    ERC20_PROXY_ID,
    NULL_ADDRESS,
    NULL_BYTES,
    ONE_HOUR_IN_SECONDS,
    ONE_SECOND_MS,
    WALLET_SIGNATURE,
    ZERO_AMOUNT,
} from './constants';
import { collapsePath } from './fills';
import {
    AggregationError,
    CollapsedFill,
    ERC20BridgeSource,
    Fill,
    NativeCollapsedFill,
    OptimizedMarketOrder,
    OrderDomain,
} from './types';

// tslint:disable completed-docs

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
        fill: {
            source: ERC20BridgeSource.Native,
            totalMakerAssetAmount: order.makerAssetAmount,
            totalTakerAssetAmount: order.takerAssetAmount,
            subFills: [],
        },
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
    liquidityProviderAddress?: string;
}

// Convert sell fills into orders.
export function createOrdersFromPath(path: Fill[], opts: CreateOrderFromPathOpts): OptimizedMarketOrder[] {
    const collapsedPath = collapsePath(opts.side, path);
    const orders: OptimizedMarketOrder[] = [];
    for (const fill of collapsedPath) {
        if (fill.source === ERC20BridgeSource.Native) {
            orders.push(createNativeOrder(fill));
        } else {
            orders.push(createBridgeOrder(fill, opts));
        }
    }
    return orders;
}

function getBridgeAddressFromSource(source: ERC20BridgeSource, opts: CreateOrderFromPathOpts): string {
    switch (source) {
        case ERC20BridgeSource.Eth2Dai:
            return opts.contractAddresses.eth2DaiBridge;
        case ERC20BridgeSource.Kyber:
            return opts.contractAddresses.kyberBridge;
        case ERC20BridgeSource.Uniswap:
            return opts.contractAddresses.uniswapBridge;
        case ERC20BridgeSource.CurveUsdcDai:
        case ERC20BridgeSource.CurveUsdcDaiUsdt:
        case ERC20BridgeSource.CurveUsdcDaiUsdtTusd:
        case ERC20BridgeSource.CurveUsdcDaiUsdtBusd:
            return opts.contractAddresses.curveBridge;
        case ERC20BridgeSource.LiquidityProvider:
            if (opts.liquidityProviderAddress === undefined) {
                throw new Error('Cannot create a LiquidityProvider order without a LiquidityProvider pool address.');
            }
            return opts.liquidityProviderAddress;
        default:
            break;
    }
    throw new Error(AggregationError.NoBridgeForSource);
}

function createBridgeOrder(fill: CollapsedFill, opts: CreateOrderFromPathOpts): OptimizedMarketOrder {
    const takerToken = opts.side === MarketOperation.Sell ? opts.inputToken : opts.outputToken;
    const makerToken = opts.side === MarketOperation.Sell ? opts.outputToken : opts.inputToken;
    const bridgeAddress = getBridgeAddressFromSource(fill.source, opts);

    let makerAssetData;
    if (Object.keys(DEFAULT_CURVE_OPTS).includes(fill.source)) {
        const { curveAddress, tokens, version } = DEFAULT_CURVE_OPTS[fill.source];
        const fromTokenIdx = tokens.indexOf(takerToken);
        const toTokenIdx = tokens.indexOf(makerToken);
        makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
            makerToken,
            bridgeAddress,
            createCurveBridgeData(curveAddress, fromTokenIdx, toTokenIdx, version),
        );
    } else {
        makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
            makerToken,
            bridgeAddress,
            createBridgeData(takerToken),
        );
    }
    return {
        makerAddress: bridgeAddress,
        makerAssetData,
        takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken),
        ...createCommonBridgeOrderFields(fill, opts),
    };
}

function createBridgeData(tokenAddress: string): string {
    const encoder = AbiEncoder.create([{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress });
}

function createCurveBridgeData(
    curveAddress: string,
    fromTokenIdx: number,
    toTokenIdx: number,
    version: number,
): string {
    const curveBridgeDataEncoder = AbiEncoder.create([
        { name: 'curveAddress', type: 'address' },
        { name: 'fromTokenIdx', type: 'int128' },
        { name: 'toTokenIdx', type: 'int128' },
        { name: 'version', type: 'int128' },
    ]);
    return curveBridgeDataEncoder.encode([curveAddress, fromTokenIdx, toTokenIdx, version]);
}

type CommonBridgeOrderFields = Pick<
    OptimizedMarketOrder,
    Exclude<keyof OptimizedMarketOrder, 'makerAddress' | 'makerAssetData' | 'takerAssetData'>
>;

function createCommonBridgeOrderFields(fill: CollapsedFill, opts: CreateOrderFromPathOpts): CommonBridgeOrderFields {
    const makerAssetAmountAdjustedWithSlippage =
        opts.side === MarketOperation.Sell
            ? fill.totalMakerAssetAmount.times(1 - opts.bridgeSlippage).integerValue(BigNumber.ROUND_DOWN)
            : fill.totalMakerAssetAmount;
    const takerAssetAmountAdjustedWithSlippage =
        opts.side === MarketOperation.Buy
            ? fill.totalTakerAssetAmount
            : fill.totalTakerAssetAmount.times(opts.bridgeSlippage + 1).integerValue(BigNumber.ROUND_UP);
    return {
        fill,
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        salt: generatePseudoRandomSalt(),
        expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / ONE_SECOND_MS) + ONE_HOUR_IN_SECONDS),
        makerFeeAssetData: NULL_BYTES,
        takerFeeAssetData: NULL_BYTES,
        makerFee: ZERO_AMOUNT,
        takerFee: ZERO_AMOUNT,
        makerAssetAmount: makerAssetAmountAdjustedWithSlippage,
        fillableMakerAssetAmount: makerAssetAmountAdjustedWithSlippage,
        takerAssetAmount: takerAssetAmountAdjustedWithSlippage,
        fillableTakerAssetAmount: takerAssetAmountAdjustedWithSlippage,
        fillableTakerFeeAmount: ZERO_AMOUNT,
        signature: WALLET_SIGNATURE,
        ...opts.orderDomain,
    };
}

function createNativeOrder(fill: CollapsedFill): OptimizedMarketOrder {
    return {
        fill: {
            source: fill.source,
            totalMakerAssetAmount: fill.totalMakerAssetAmount,
            totalTakerAssetAmount: fill.totalTakerAssetAmount,
            subFills: fill.subFills,
        },
        ...(fill as NativeCollapsedFill).nativeOrder,
    };
}
