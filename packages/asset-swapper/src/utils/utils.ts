import { assetDataUtils } from '@0x/order-utils';
import { AssetData, AssetProxyId, ERC20AssetData, ERC20BridgeAssetData, Order, SignedOrder } from '@0x/types';
import { BigNumber, NULL_BYTES } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { constants } from '../constants';

// tslint:disable: no-unnecessary-type-assertion completed-docs

export function isSupportedAssetDataInOrders(orders: SignedOrder[]): boolean {
    const firstOrderMakerAssetData = !!orders[0]
        ? assetDataUtils.decodeAssetDataOrThrow(orders[0].makerAssetData)
        : { assetProxyId: '' };
    return orders.every(o => {
        const takerAssetData = assetDataUtils.decodeAssetDataOrThrow(o.takerAssetData);
        const makerAssetData = assetDataUtils.decodeAssetDataOrThrow(o.makerAssetData);
        return (
            (makerAssetData.assetProxyId === AssetProxyId.ERC20 ||
                makerAssetData.assetProxyId === AssetProxyId.ERC721) &&
            takerAssetData.assetProxyId === AssetProxyId.ERC20 &&
            firstOrderMakerAssetData.assetProxyId === makerAssetData.assetProxyId
        ); // checks that all native order maker assets are of the same type
    });
}

export function numberPercentageToEtherTokenAmountPercentage(percentage: number): BigNumber {
    return Web3Wrapper.toBaseUnitAmount(constants.ONE_AMOUNT, constants.ETHER_TOKEN_DECIMALS).multipliedBy(percentage);
}

export function isOrderTakerFeePayableWithMakerAsset<T extends Order>(order: T): boolean {
    return !order.takerFee.isZero() && isAssetDataEquivalent(order.takerFeeAssetData, order.makerAssetData);
}

export function isOrderTakerFeePayableWithTakerAsset<T extends Order>(order: T): boolean {
    return !order.takerFee.isZero() && isAssetDataEquivalent(order.takerFeeAssetData, order.takerAssetData);
}

export function getAdjustedMakerAndTakerAmountsFromTakerFees<T extends Order>(order: T): [BigNumber, BigNumber] {
    const adjustedMakerAssetAmount = isOrderTakerFeePayableWithMakerAsset(order)
        ? order.makerAssetAmount.minus(order.takerFee)
        : order.makerAssetAmount;
    const adjustedTakerAssetAmount = isOrderTakerFeePayableWithTakerAsset(order)
        ? order.takerAssetAmount.plus(order.takerFee)
        : order.takerAssetAmount;
    return [adjustedMakerAssetAmount, adjustedTakerAssetAmount];
}

export function isExactAssetData(expectedAssetData: string, actualAssetData: string): boolean {
    return expectedAssetData === actualAssetData;
}

/**
 * Compare the Asset Data for equivalency. Expected is the asset data the user provided (wanted),
 * actual is the asset data found or created.
 */
export function isAssetDataEquivalent(expectedAssetData: string, actualAssetData: string): boolean {
    if (isExactAssetData(expectedAssetData, actualAssetData)) {
        return true;
    }
    const decodedExpectedAssetData = assetDataUtils.decodeAssetDataOrThrow(expectedAssetData);
    const decodedActualAssetData = assetDataUtils.decodeAssetDataOrThrow(actualAssetData);
    // ERC20 === ERC20, ERC20 === ERC20Bridge
    if (isERC20EquivalentAssetData(decodedExpectedAssetData) && isERC20EquivalentAssetData(decodedActualAssetData)) {
        const doesTokenAddressMatch = decodedExpectedAssetData.tokenAddress === decodedActualAssetData.tokenAddress;
        return doesTokenAddressMatch;
    }
    // ERC1155 === ERC1155
    if (
        assetDataUtils.isERC1155TokenAssetData(decodedExpectedAssetData) &&
        assetDataUtils.isERC1155TokenAssetData(decodedActualAssetData)
    ) {
        const doesTokenAddressMatch = decodedExpectedAssetData.tokenAddress === decodedActualAssetData.tokenAddress;
        // IDs may be out of order yet still equivalent
        // i.e (["a", "b"], [1,2]) === (["b", "a"], [2, 1])
        //     (["a", "b"], [2,1]) !== (["b", "a"], [2, 1])
        const hasAllIds = decodedExpectedAssetData.tokenIds.every(
            id => decodedActualAssetData.tokenIds.findIndex(v => id.eq(v)) !== -1,
        );
        const hasAllValues = decodedExpectedAssetData.tokenIds.every((id, i) =>
            decodedExpectedAssetData.tokenValues[i].eq(
                decodedActualAssetData.tokenValues[decodedActualAssetData.tokenIds.findIndex(v => id.eq(v))],
            ),
        );
        // If expected contains callback data, ensure it is present
        // if actual has callbackdata and expected provided none then ignore it
        const hasEquivalentCallback =
            decodedExpectedAssetData.callbackData === NULL_BYTES ||
            decodedExpectedAssetData.callbackData === decodedActualAssetData.callbackData;
        return doesTokenAddressMatch && hasAllIds && hasAllValues && hasEquivalentCallback;
    }
    // ERC721 === ERC721
    if (
        assetDataUtils.isERC721TokenAssetData(decodedExpectedAssetData) ||
        assetDataUtils.isERC721TokenAssetData(decodedActualAssetData)
    ) {
        // Asset Data should exactly match for ERC721
        return isExactAssetData(expectedAssetData, actualAssetData);
    }

    // TODO(dekz): Unsupported cases
    // ERCXX(token) === MAP(token, staticCall)
    // MAP(a, b) === MAP(b, a) === MAP(b, a, staticCall)
    return false;
}

export function isERC20EquivalentAssetData(assetData: AssetData): assetData is ERC20AssetData | ERC20BridgeAssetData {
    return assetDataUtils.isERC20TokenAssetData(assetData) || assetDataUtils.isERC20BridgeAssetData(assetData);
}

/**
 * Gets the difference between two sets.
 */
export function difference<T>(a: T[], b: T[]): T[] {
    return a.filter(x => b.indexOf(x) === -1);
}
