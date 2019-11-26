import { ERC20TokenEvents, ERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { ExchangeEvents, ExchangeFillEventArgs } from '@0x/contracts-exchange';
import { constants, expect, orderHashUtils, verifyEvents } from '@0x/contracts-test-utils';
import { FillResults, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from '../deployment_manager';

import { FunctionAssertion, FunctionResult } from './function_assertion';

function verifyFillEvents(
    takerAddress: string,
    order: Order,
    receipt: TransactionReceiptWithDecodedLogs,
    deployment: DeploymentManager,
): void {
    // Ensure that the fill event was correct.
    verifyEvents<ExchangeFillEventArgs>(
        receipt,
        [
            {
                makerAddress: order.makerAddress,
                feeRecipientAddress: order.feeRecipientAddress,
                makerAssetData: order.makerAssetData,
                takerAssetData: order.takerAssetData,
                makerFeeAssetData: order.makerFeeAssetData,
                takerFeeAssetData: order.takerFeeAssetData,
                orderHash: orderHashUtils.getOrderHashHex(order),
                takerAddress,
                senderAddress: takerAddress,
                makerAssetFilledAmount: order.makerAssetAmount,
                takerAssetFilledAmount: order.takerAssetAmount,
                makerFeePaid: constants.ZERO_AMOUNT,
                takerFeePaid: constants.ZERO_AMOUNT,
                protocolFeePaid: DeploymentManager.protocolFee,
            },
        ],
        ExchangeEvents.Fill,
    );

    // Ensure that the transfer events were correctly emitted.
    verifyEvents<ERC20TokenTransferEventArgs>(
        receipt,
        [
            {
                _from: takerAddress,
                _to: order.makerAddress,
                _value: order.takerAssetAmount,
            },
            {
                _from: order.makerAddress,
                _to: takerAddress,
                _value: order.makerAssetAmount,
            },
            {
                _from: takerAddress,
                _to: deployment.staking.stakingProxy.address,
                _value: DeploymentManager.protocolFee,
            },
        ],
        ERC20TokenEvents.Transfer,
    );
}

/**
 * A function assertion that verifies that a complete and valid fill succeeded and emitted the correct logs.
 */
/* tslint:disable:no-unnecessary-type-assertion */
/* tslint:disable:no-non-null-assertion */
export function validFillOrderCompleteFillAssertion(
    deployment: DeploymentManager,
): FunctionAssertion<[Order, BigNumber, string], {}, FillResults> {
    const exchange = deployment.exchange;

    return new FunctionAssertion<[Order, BigNumber, string], {}, FillResults>(exchange, 'fillOrder', {
        after: async (
            _beforeInfo,
            result: FunctionResult,
            args: [Order, BigNumber, string],
            txData: Partial<TxData>,
        ) => {
            const [order] = args;

            // Ensure that the tx succeeded.
            expect(result.success).to.be.true();

            // Ensure that the correct events were emitted.
            verifyFillEvents(txData.from!, order, result.receipt!, deployment);

            // TODO: Add validation for on-chain state (like balances)
        },
    });
}
/* tslint:enable:no-non-null-assertion */
/* tslint:enable:no-unnecessary-type-assertion */
