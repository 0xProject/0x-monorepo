import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
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
        return order.takerFeeAssetData === order.makerAssetData;
    },
    isOrderTakerFeePayableWithTakerAsset<T extends Order>(order: T): boolean {
        return order.takerFeeAssetData === order.takerAssetData;
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
};
