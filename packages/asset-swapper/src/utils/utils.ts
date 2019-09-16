import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { AbiDefinition, ContractAbi, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import { OrdersAndFillableAmounts } from '../types';
import { SignedOrder } from '@0x/types';

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
    isFeeOrdersRequiredToFillOrders(ordersAndFillableAmounts: OrdersAndFillableAmounts): boolean {
        const { orders, remainingFillableMakerAssetAmounts } = ordersAndFillableAmounts;
        return _.some(orders, (order: SignedOrder, index: number): boolean => {
            const remainingFillableMakerAssetAmount = remainingFillableMakerAssetAmounts[index];
            // If makerFee is a non zero value and order is still fillable, fee orders are required
            return !order.makerFee.isZero() && !remainingFillableMakerAssetAmount.isZero();
        });
    },
};
