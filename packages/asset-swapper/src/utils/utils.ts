import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { AbiDefinition, ContractAbi, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import { PrunedSignedOrder, SwapQuoteRequestOpts, SwapQuoterError } from '../types';

import { assert } from './assert';

const ETH_GAS_STATION_API_BASE_URL = 'https://ethgasstation.info';

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
        return order.takerFee.isZero() || order.takerFeeAssetData === order.makerAssetData;
    },
    isOrderTakerFeePayableWithTakerAsset<T extends Order>(order: T): boolean {
        return order.takerFee.isZero() || order.takerFeeAssetData === order.takerAssetData;
    },
    getAdjustedMakerAndTakerAmountsFromTakerFees<T extends Order>(order: T): [BigNumber, BigNumber] {
        const adjustedMakerAssetAmount = utils.isOrderTakerFeePayableWithMakerAsset(order) ? order.makerAssetAmount.minus(order.takerFee) : order.makerAssetAmount;
        const adjustedTakerAssetAmount = utils.isOrderTakerFeePayableWithTakerAsset(order) ? order.takerAssetAmount.plus(order.takerFee) : order.takerAssetAmount;
        return [
            adjustedMakerAssetAmount,
            adjustedTakerAssetAmount,
        ];
    },
    getAdjustedFillableMakerAndTakerAmountsFromTakerFees<T extends PrunedSignedOrder>(order: T): [BigNumber, BigNumber] {
        const adjustedFillableMakerAssetAmount = utils.isOrderTakerFeePayableWithMakerAsset(order) ? order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount) : order.fillableMakerAssetAmount;
        const adjustedFillableTakerAssetAmount = utils.isOrderTakerFeePayableWithTakerAsset(order) ? order.fillableTakerAssetAmount.plus(order.fillableTakerFeeAmount) : order.fillableTakerAssetAmount;
        return [
            adjustedFillableMakerAssetAmount,
            adjustedFillableTakerAssetAmount,
        ];
    },
    async getGasPriceOrEstimationOrThrowAsync(opts: Partial<SwapQuoteRequestOpts>): Promise<BigNumber> {
        if (!!opts.gasPrice) {
            assert.isBigNumber('ethAmount', opts.gasPrice);
            return opts.gasPrice;
        } else {
            try {
                const res = await fetch(`${ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`);
                const gasInfo = (await res.json());
                // Eth Gas Station result is gwei * 10
                // tslint:disable-next-line:custom-no-magic-numbers
                return new BigNumber(gasInfo.fast / 10);
            } catch (e) {
                throw new Error(SwapQuoterError.NoGasPriceProvidedOrEstimated);
            }
        }
    },
    calculateWorstCaseProtocolFee<T extends Order>(orders: T[], gasPrice: BigNumber): BigNumber {
        const protocolFee = new BigNumber(orders.length * constants.PROTOCOL_FEE_MULTIPLIER).times(gasPrice);
        return protocolFee;
    },
};
