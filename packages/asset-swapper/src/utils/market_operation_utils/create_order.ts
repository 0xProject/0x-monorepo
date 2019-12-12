import { ContractAddresses } from '@0x/contract-addresses';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';

import { constants } from '../../constants';
import { SignedOrderWithFillableAmounts } from '../../types';

import { constants as marketOperationUtilConstants } from './constants';
import { ERC20BridgeSource, Fill, FillData, NativeFillData, OrderDomain } from './types';

const { NULL_BYTES, NULL_ADDRESS, ZERO_AMOUNT } = constants;
const { INFINITE_TIMESTAMP_SEC } = marketOperationUtilConstants;

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
        path: Fill[],
        bridgeSlippage: number,
    ): SignedOrderWithFillableAmounts[] {
        const orders: SignedOrderWithFillableAmounts[] = [];
        for (const fill of path) {
            const source = (fill.fillData as FillData).source;
            if (source === ERC20BridgeSource.Native) {
                orders.push((fill.fillData as NativeFillData).order);
            } else if (source === ERC20BridgeSource.Kyber) {
                orders.push(this._createKyberOrder(orderDomain, outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
            } else if (source === ERC20BridgeSource.Eth2Dai) {
                orders.push(this._createEth2DaiOrder(orderDomain, outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
            } else if (source === ERC20BridgeSource.Uniswap) {
                orders.push(this._createUniswapOrder(orderDomain, outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
            } else {
                throw new Error(`invalid sell fill source: ${source}`);
            }
        }
        return orders;
    }

    // Convert buy fills into orders.
    public createBuyOrdersFromPath(
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
                orders.push(this._createEth2DaiOrder(orderDomain, inputToken, outputToken, fill.input, fill.output, bridgeSlippage, true));
            } else if (source === ERC20BridgeSource.Uniswap) {
                orders.push(this._createUniswapOrder(orderDomain, inputToken, outputToken, fill.input, fill.output, bridgeSlippage, true));
            } else {
                throw new Error(`invalid buy fill source: ${source}`);
            }
        }
        return orders;
    }

    private _createKyberOrder(
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
            this._contractAddress.kyberBridge,
            makerToken,
            takerToken,
            makerAssetAmount,
            takerAssetAmount,
            slippage,
            isBuy,
        );
    }

    private _createEth2DaiOrder(
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
            this._contractAddress.eth2DaiBridge,
            makerToken,
            takerToken,
            makerAssetAmount,
            takerAssetAmount,
            slippage,
            isBuy,
        );
    }

    private _createUniswapOrder(
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
            this._contractAddress.uniswapBridge,
            makerToken,
            takerToken,
            makerAssetAmount,
            takerAssetAmount,
            slippage,
            isBuy,
        );
    }
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
        takerAssetAmount: takerAssetAmountAdjustedWithSlippage,
        fillableTakerAssetAmount: takerAssetAmountAdjustedWithSlippage,
        fillableTakerFeeAmount: ZERO_AMOUNT,
        signature: '0x04',
        ...orderDomain,
    };
}
