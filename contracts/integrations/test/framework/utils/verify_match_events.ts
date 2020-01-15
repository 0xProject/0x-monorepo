import { ERC20TokenEvents, ERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { ExchangeEvents, ExchangeFillEventArgs } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import { constants, orderHashUtils, verifyEvents } from '@0x/contracts-test-utils';
import { MatchedFillResults, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from '../deployment_manager';

/**
 * Verifies `Fill` and `Transfer` events emitted by `matchOrders` or `matchOrdersWithMaximalFill`.
 */
export function verifyMatchEvents(
    txData: Partial<TxData>,
    leftOrder: Order,
    rightOrder: Order,
    receipt: TransactionReceiptWithDecodedLogs,
    deployment: DeploymentManager,
    withMaximalFill: boolean,
): void {
    const matchResults = ReferenceFunctions.calculateMatchResults(
        leftOrder,
        rightOrder,
        DeploymentManager.protocolFeeMultiplier,
        DeploymentManager.gasPrice,
        withMaximalFill,
    );
    const takerAddress = txData.from as string;
    const value = new BigNumber(txData.value || 0);

    verifyMatchFilledEvents(leftOrder, rightOrder, receipt, matchResults, takerAddress);
    verifyMatchTransferEvents(leftOrder, rightOrder, receipt, matchResults, takerAddress, value, deployment);
}

/**
 * Verifies `Fill` events emitted by `matchOrders` or `matchOrdersWithMaximalFill`.
 */
const verifyMatchFilledEvents = (
    leftOrder: Order,
    rightOrder: Order,
    receipt: TransactionReceiptWithDecodedLogs,
    matchResults: MatchedFillResults,
    takerAddress: string,
) => {
    const expectedFillEvents = [
        {
            makerAddress: leftOrder.makerAddress,
            feeRecipientAddress: leftOrder.feeRecipientAddress,
            makerAssetData: leftOrder.makerAssetData,
            takerAssetData: leftOrder.takerAssetData,
            makerFeeAssetData: leftOrder.makerFeeAssetData,
            takerFeeAssetData: leftOrder.takerFeeAssetData,
            orderHash: orderHashUtils.getOrderHashHex(leftOrder),
            takerAddress,
            senderAddress: takerAddress,
            ...matchResults.left,
        },
        {
            makerAddress: rightOrder.makerAddress,
            feeRecipientAddress: rightOrder.feeRecipientAddress,
            makerAssetData: rightOrder.makerAssetData,
            takerAssetData: rightOrder.takerAssetData,
            makerFeeAssetData: rightOrder.makerFeeAssetData,
            takerFeeAssetData: rightOrder.takerFeeAssetData,
            orderHash: orderHashUtils.getOrderHashHex(rightOrder),
            takerAddress,
            senderAddress: takerAddress,
            ...matchResults.right,
        },
    ];

    verifyEvents<ExchangeFillEventArgs>(receipt, expectedFillEvents, ExchangeEvents.Fill);
};

/**
 * Verifies `Transfer` events emitted by `matchOrders` or `matchOrdersWithMaximalFill`.
 */
const verifyMatchTransferEvents = (
    leftOrder: Order,
    rightOrder: Order,
    receipt: TransactionReceiptWithDecodedLogs,
    matchResults: MatchedFillResults,
    takerAddress: string,
    value: BigNumber,
    deployment: DeploymentManager,
) => {
    const expectedTransferEvents = [
        {
            _from: rightOrder.makerAddress,
            _to: leftOrder.makerAddress,
            _value: matchResults.left.takerAssetFilledAmount,
        },
        {
            _from: leftOrder.makerAddress,
            _to: rightOrder.makerAddress,
            _value: matchResults.right.takerAssetFilledAmount,
        },
        {
            _from: rightOrder.makerAddress,
            _to: rightOrder.feeRecipientAddress,
            _value: matchResults.right.makerFeePaid,
        },
        {
            _from: leftOrder.makerAddress,
            _to: leftOrder.feeRecipientAddress,
            _value: matchResults.left.makerFeePaid,
        },
        {
            _from: leftOrder.makerAddress,
            _to: takerAddress,
            _value: matchResults.left.makerAssetFilledAmount.minus(matchResults.right.takerAssetFilledAmount),
        },
        {
            _from: rightOrder.makerAddress,
            _to: takerAddress,
            _value: matchResults.right.makerAssetFilledAmount.minus(matchResults.left.takerAssetFilledAmount),
        },
        {
            _from: takerAddress,
            _to: deployment.staking.stakingProxy.address,
            _value: value.isLessThan(DeploymentManager.protocolFee.times(2))
                ? DeploymentManager.protocolFee
                : constants.ZERO_AMOUNT,
        },
        {
            _from: takerAddress,
            _to: deployment.staking.stakingProxy.address,
            _value: value.isLessThan(DeploymentManager.protocolFee) ? DeploymentManager.protocolFee : new BigNumber(0),
        },
        {
            _from: takerAddress,
            _to: rightOrder.feeRecipientAddress,
            _value:
                leftOrder.feeRecipientAddress === rightOrder.feeRecipientAddress
                    ? constants.ZERO_AMOUNT
                    : matchResults.right.takerFeePaid,
        },
        {
            _from: takerAddress,
            _to: leftOrder.feeRecipientAddress,
            _value:
                leftOrder.feeRecipientAddress === rightOrder.feeRecipientAddress
                    ? matchResults.left.takerFeePaid.plus(matchResults.right.takerFeePaid)
                    : matchResults.left.takerFeePaid,
        },
    ].filter(event => event._value.isGreaterThan(0));

    verifyEvents<ERC20TokenTransferEventArgs>(receipt, expectedTransferEvents, ERC20TokenEvents.Transfer);
};
