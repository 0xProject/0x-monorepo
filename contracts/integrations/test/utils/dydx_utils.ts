import { constants, toHex } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

export interface PriceRatio {
    makerAmount: BigNumber;
    takerAmount: BigNumber;
}

export function dydxOrderData(order: SignedOrder): string {
    return '0x'.concat(
        Buffer.concat(
            [
                order.makerAddress,
                order.takerAddress,
                order.feeRecipientAddress,
                order.senderAddress,
                order.makerAssetAmount,
                order.takerAssetAmount,
                order.makerFee,
                order.takerFee,
                order.expirationTimeSeconds,
                order.salt,
                assetDataUtils.decodeERC20AssetData(order.makerFeeAssetData).tokenAddress,
                assetDataUtils.decodeERC20AssetData(order.takerFeeAssetData).tokenAddress,
            ].map(field => ethUtil.setLengthLeft(toHex(field), constants.WORD_LENGTH)),
        ).toString('hex'),
        order.signature.substr(2),
    );
}

export function dydxMultiOrderData(orders: SignedOrder[], maxPrice: PriceRatio): string {
    return '0x'.concat(
        Buffer.concat(
            [
                maxPrice.takerAmount,
                maxPrice.makerAmount,
                ..._.flatten(
                    orders.map(order => [
                        order.makerAddress,
                        order.takerAddress,
                        order.feeRecipientAddress,
                        order.senderAddress,
                        order.makerAssetAmount,
                        order.takerAssetAmount,
                        order.expirationTimeSeconds,
                        order.salt,
                        order.signature,
                    ]),
                ),
            ].map(field => {
                // special case for signature, which would otherwise get truncated
                if (toHex(field).length > 66) {
                    return Buffer.from((field as string).substr(2), 'hex');
                } else {
                    return ethUtil.setLengthLeft(toHex(field), constants.WORD_LENGTH);
                }
            }),
        ).toString('hex'),
    );
}
