import { generatePseudoRandomSalt } from '@0x/order-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';

import { constants } from '../../constants';
import { SignedOrderWithFillableAmounts } from '../../types';

import { constants as improveSwapQuoteConstants } from './constants';
import { ERC20BridgeSource, Fill, FillData, NativeFillData, OrderDomain } from './types';

const { NULL_BYTES, NULL_ADDRESS, ZERO_AMOUNT } = constants;
const { BRIDGE_ADDRESSES, INFINITE_TIMESTAMP_SEC } = improveSwapQuoteConstants;

export const createOrdersUtils = {
    // Convert sell fills into orders.
    createSellOrdersFromPath(
        orderDomain: OrderDomain,
        inputToken: string,
        outputToken: string,
        path: Fill[],
        bridgeSlippage: number,
    ): SignedOrderWithFillableAmounts[] {
        const orders: SignedOrderWithFillableAmounts[] = [];
        for (const fill of path) {
            const source = (fill.fillData as FillData).source;
            if (source === ERC20BridgeSource.Native) {
                orders.push((fill.fillData as NativeFillData).order);
            } else if (source === ERC20BridgeSource.Kyber) {
                orders.push(createKyberOrder(orderDomain, outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
            } else if (source === ERC20BridgeSource.Eth2Dai) {
                orders.push(createEth2DaiOrder(orderDomain, outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
            } else if (source === ERC20BridgeSource.Uniswap) {
                orders.push(createUniswapOrder(orderDomain, outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
            } else {
                throw new Error(`invalid sell fill source: ${source}`);
            }
        }
        return orders;
    },

    // Convert buy fills into orders.
    createBuyOrdersFromPath(
        orderDomain: OrderDomain,
        inputToken: string,
        outputToken: string,
        path: Fill[],
        bridgeSlippage: number,
    ): SignedOrderWithFillableAmounts[] {
        const orders: SignedOrderWithFillableAmounts[] = [];
        for (const fill of path) {
            const source = (fill.fillData as FillData).source;
            if (source === ERC20BridgeSource.Native) {
                orders.push((fill.fillData as NativeFillData).order);
            } else if (source === ERC20BridgeSource.Eth2Dai) {
                orders.push(createEth2DaiOrder(orderDomain, inputToken, outputToken, fill.input, fill.output, bridgeSlippage, true));
            } else if (source === ERC20BridgeSource.Uniswap) {
                orders.push(createUniswapOrder(orderDomain, inputToken, outputToken, fill.input, fill.output, bridgeSlippage, true));
            } else {
                throw new Error(`invalid buy fill source: ${source}`);
            }
        }
        return orders;
    },
};

function createKyberOrder(
    orderDomain: OrderDomain,
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): SignedOrderWithFillableAmounts {
    return createBridgeOrder(
        orderDomain,
        BRIDGE_ADDRESSES[ERC20BridgeSource.Kyber],
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        isBuy,
    );
}

function createEth2DaiOrder(
    orderDomain: OrderDomain,
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): SignedOrderWithFillableAmounts {
    return createBridgeOrder(
        orderDomain,
        BRIDGE_ADDRESSES[ERC20BridgeSource.Eth2Dai],
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        isBuy,
    );
}

function createUniswapOrder(
    orderDomain: OrderDomain,
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): SignedOrderWithFillableAmounts {
    return createBridgeOrder(
        orderDomain,
        BRIDGE_ADDRESSES[ERC20BridgeSource.Uniswap],
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        isBuy,
    );
}

function createBridgeOrder(
    orderDomain: OrderDomain,
    bridgeAddress: string,
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): SignedOrderWithFillableAmounts {
    return {
        makerAddress: bridgeAddress,
        makerAssetData: createBridgeAssetData(makerToken, bridgeAddress, createBridgeData(takerToken)),
        takerAssetData: createERC20AssetData(takerToken),
        ...createCommonOrderFields(orderDomain, makerAssetAmount, takerAssetAmount, slippage, isBuy),
    };
}

/**
 * Create ERC20Bridge asset data.
 */
export function createBridgeAssetData(tokenAddress: string, bridgeAddress: string, bridgeData: string): string {
    const encoder = AbiEncoder.createMethod('ERC20Bridge', [
        { name: 'tokenAddress', type: 'address' },
        { name: 'bridgeAddress', type: 'address' },
        { name: 'bridgeData', type: 'bytes' },
    ]);
    return encoder.encode({ tokenAddress, bridgeAddress, bridgeData });
}

/**
 * Create ERC20Proxy asset data.
 */
export function createERC20AssetData(tokenAddress: string): string {
    const encoder = AbiEncoder.createMethod('ERC20Token', [{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress });
}

function createBridgeData(tokenAddress: string): string {
    const encoder = AbiEncoder.create([{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress });
}

type CommonOrderFields = Pick<
SignedOrderWithFillableAmounts,
    Exclude<keyof SignedOrderWithFillableAmounts, 'makerAddress' | 'makerAssetData' | 'takerAssetData'>
>;

function createCommonOrderFields(
    orderDomain: OrderDomain,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): CommonOrderFields {
    const makerAssetAmountAdjustedWithSlippage = isBuy
    ? makerAssetAmount
    : makerAssetAmount.times(1 - slippage).integerValue(BigNumber.ROUND_UP);
    const takerAssetAmountAdjustedWithSlippage = isBuy
    ? takerAssetAmount.times(slippage + 1).integerValue(BigNumber.ROUND_UP)
    : takerAssetAmount;
    return {
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
        takerAssetAmount: makerAssetAmountAdjustedWithSlippage,
        fillableTakerAssetAmount: takerAssetAmountAdjustedWithSlippage,
        fillableTakerFeeAmount: ZERO_AMOUNT,
        signature: '0x04',
        ...orderDomain,
    };
}
