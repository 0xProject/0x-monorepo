import { ContractAddresses } from '@0x/contract-addresses';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';

import { constants } from '../../constants';
import { sortingUtils } from '../../utils/sorting_utils';

import { constants as marketOperationUtilConstants } from './constants';
import {
    AggregationError,
    CollapsedFill,
    ERC20BridgeSource,
    NativeCollapsedFill,
    OptimizedMarketOrder,
    OrderDomain,
} from './types';

const { NULL_BYTES, NULL_ADDRESS, ZERO_AMOUNT } = constants;
const { INFINITE_TIMESTAMP_SEC, WALLET_SIGNATURE } = marketOperationUtilConstants;

export class CreateOrderUtils {
    private readonly _contractAddress: ContractAddresses;

    constructor(contractAddress: ContractAddresses) {
        this._contractAddress = contractAddress;
    }

    // Convert sell fills into orders.
    public createSellOrdersFromPath(
        orderDomain: OrderDomain,
        inputToken: string,
        outputToken: string,
        path: CollapsedFill[],
        bridgeSlippage: number,
    ): OptimizedMarketOrder[] {
        const orders: OptimizedMarketOrder[] = [];
        for (const fill of path) {
            if (fill.source === ERC20BridgeSource.Native) {
                orders.push(createNativeOrder(fill));
            } else {
                orders.push(
                    createBridgeOrder(
                        orderDomain,
                        fill,
                        this._getBridgeAddressFromSource(fill.source),
                        outputToken,
                        inputToken,
                        bridgeSlippage,
                    ),
                );
            }
        }
        return sortingUtils.sortOrders(orders);
    }

    // Convert buy fills into orders.
    public createBuyOrdersFromPath(
        orderDomain: OrderDomain,
        inputToken: string,
        outputToken: string,
        path: CollapsedFill[],
        bridgeSlippage: number,
    ): OptimizedMarketOrder[] {
        const orders: OptimizedMarketOrder[] = [];
        for (const fill of path) {
            if (fill.source === ERC20BridgeSource.Native) {
                orders.push(createNativeOrder(fill));
            } else {
                orders.push(
                    createBridgeOrder(
                        orderDomain,
                        fill,
                        this._getBridgeAddressFromSource(fill.source),
                        inputToken,
                        outputToken,
                        bridgeSlippage,
                        true,
                    ),
                );
            }
        }
        return sortingUtils.sortOrders(orders);
    }

    private _getBridgeAddressFromSource(source: ERC20BridgeSource): string {
        switch (source) {
            case ERC20BridgeSource.Eth2Dai:
                return this._contractAddress.eth2DaiBridge;
            case ERC20BridgeSource.Kyber:
                return this._contractAddress.kyberBridge;
            case ERC20BridgeSource.Uniswap:
                return this._contractAddress.uniswapBridge;
            default:
                break;
        }
        throw new Error(AggregationError.NoBridgeForSource);
    }
}

function createBridgeOrder(
    orderDomain: OrderDomain,
    fill: CollapsedFill,
    bridgeAddress: string,
    makerToken: string,
    takerToken: string,
    slippage: number,
    isBuy: boolean = false,
): OptimizedMarketOrder {
    return {
        makerAddress: bridgeAddress,
        makerAssetData: assetDataUtils.encodeERC20BridgeAssetData(
            makerToken,
            bridgeAddress,
            createBridgeData(takerToken),
        ),
        takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken),
        ...createCommonOrderFields(orderDomain, fill, slippage, isBuy),
    };
}

function createBridgeData(tokenAddress: string): string {
    const encoder = AbiEncoder.create([{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress });
}

type CommonOrderFields = Pick<
    OptimizedMarketOrder,
    Exclude<keyof OptimizedMarketOrder, 'makerAddress' | 'makerAssetData' | 'takerAssetData'>
>;

function createCommonOrderFields(
    orderDomain: OrderDomain,
    fill: CollapsedFill,
    slippage: number,
    isBuy: boolean = false,
): CommonOrderFields {
    const makerAssetAmountAdjustedWithSlippage = isBuy
        ? fill.totalMakerAssetAmount
        : fill.totalMakerAssetAmount.times(1 - slippage).integerValue(BigNumber.ROUND_DOWN);
    const takerAssetAmountAdjustedWithSlippage = isBuy
        ? fill.totalTakerAssetAmount.times(slippage + 1).integerValue(BigNumber.ROUND_UP)
        : fill.totalTakerAssetAmount;
    return {
        fill,
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        salt: generatePseudoRandomSalt(),
        expirationTimeSeconds: INFINITE_TIMESTAMP_SEC,
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
        ...orderDomain,
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
