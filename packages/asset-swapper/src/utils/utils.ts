import { assetDataUtils } from '@0x/order-utils';
import { AssetData, ERC20AssetData, ERC20BridgeAssetData, Order } from '@0x/types';
import { BigNumber, NULL_BYTES } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { AbiDefinition, ContractAbi, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';

// tslint:disable:no-unnecessary-type-assertion
export const utils = {
    numberPercentageToEtherTokenAmountPercentage(percentage: number): BigNumber {
        return Web3Wrapper.toBaseUnitAmount(constants.ONE_AMOUNT, constants.ETHER_TOKEN_DECIMALS).multipliedBy(
            percentage,
        );
    },
    getMethodAbiFromContractAbi(abi: ContractAbi, name: string): MethodAbi | undefined {
        return _.find(
            abi,
            (def: AbiDefinition): boolean => {
                if (def.type === 'function') {
                    const methodDef = def as MethodAbi;
                    return methodDef.name === name;
                } else {
                    return false;
                }
            },
        ) as MethodAbi | undefined;
    },
    isOrderTakerFeePayableWithMakerAsset<T extends Order>(order: T): boolean {
        return order.takerFee.isZero() || utils.isAssetDataEquivalent(order.takerFeeAssetData, order.makerAssetData);
    },
    isOrderTakerFeePayableWithTakerAsset<T extends Order>(order: T): boolean {
        return order.takerFee.isZero() || utils.isAssetDataEquivalent(order.takerFeeAssetData, order.takerAssetData);
    },
    getAdjustedMakerAndTakerAmountsFromTakerFees<T extends Order>(order: T): [BigNumber, BigNumber] {
        const adjustedMakerAssetAmount = utils.isOrderTakerFeePayableWithMakerAsset(order)
            ? order.makerAssetAmount.minus(order.takerFee)
            : order.makerAssetAmount;
        const adjustedTakerAssetAmount = utils.isOrderTakerFeePayableWithTakerAsset(order)
            ? order.takerAssetAmount.plus(order.takerFee)
            : order.takerAssetAmount;
        return [adjustedMakerAssetAmount, adjustedTakerAssetAmount];
    },
    isExactAssetData(expectedAssetData: string, actualAssetData: string): boolean {
        return expectedAssetData === actualAssetData;
    },
    /**
     * Compare the Asset Data for equivalency. Expected is the asset data the user provided (wanted),
     * actual is the asset data found or created.
     */
    isAssetDataEquivalent(expectedAssetData: string, actualAssetData: string): boolean {
        if (utils.isExactAssetData(expectedAssetData, actualAssetData)) {
            return true;
        }
        const decodedExpectedAssetData = assetDataUtils.decodeAssetDataOrThrow(expectedAssetData);
        const decodedActualAssetData = assetDataUtils.decodeAssetDataOrThrow(actualAssetData);
        // ERC20 === ERC20, ERC20 === ERC20Bridge
        if (
            utils.isERC20EquivalentAssetData(decodedExpectedAssetData) &&
            utils.isERC20EquivalentAssetData(decodedActualAssetData)
        ) {
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
            return utils.isExactAssetData(expectedAssetData, actualAssetData);
        }

        // TODO(dekz): Unsupported cases
        // ERCXX(token) === MAP(token, staticCall)
        // MAP(a, b) === MAP(b, a) === MAP(b, a, staticCall)
        return false;
    },
    isERC20EquivalentAssetData(assetData: AssetData): assetData is ERC20AssetData | ERC20BridgeAssetData {
        return assetDataUtils.isERC20TokenAssetData(assetData) || assetDataUtils.isERC20BridgeAssetData(assetData);
    },
};
