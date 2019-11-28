import { ERC20TokenEvents, ERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { ExchangeEvents, ExchangeFillEventArgs } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import { expect, orderHashUtils, verifyEvents } from '@0x/contracts-test-utils';
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
    takerAssetFillAmount: BigNumber,
): void {
    const fillResults = ReferenceFunctions.calculateFillResults(
        order,
        takerAssetFillAmount,
        DeploymentManager.protocolFeeMultiplier,
        DeploymentManager.gasPrice,
    );
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
                ...fillResults,
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
                _value: fillResults.takerAssetFilledAmount,
            },
            {
                _from: order.makerAddress,
                _to: takerAddress,
                _value: fillResults.makerAssetFilledAmount,
            },
            {
                _from: takerAddress,
                _to: order.feeRecipientAddress,
                _value: fillResults.takerFeePaid,
            },
            {
                _from: order.makerAddress,
                _to: order.feeRecipientAddress,
                _value: fillResults.makerFeePaid,
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
export function validFillOrderAssertion(
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
            const [order, fillAmount] = args;

            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            // Ensure that the correct events were emitted.
            verifyFillEvents(txData.from!, order, result.receipt!, deployment, fillAmount);

            // TODO: Add validation for on-chain state (like balances)
        },
    });
}
/* tslint:enable:no-non-null-assertion */
/* tslint:enable:no-unnecessary-type-assertion */
