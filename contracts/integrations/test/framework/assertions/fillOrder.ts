import { ERC20TokenEvents, ERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { ExchangeEvents, ExchangeFillEventArgs } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import { AggregatedStats, PoolStats } from '@0x/contracts-staking';
import { expect, orderHashUtils, verifyEvents } from '@0x/contracts-test-utils';
import { FillResults, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { Maker } from '../actors/maker';
import { filterActorsByRole } from '../actors/utils';
import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';
import { assertProtocolFeePaidAsync, getPoolInfoAsync } from '../utils/assert_protocol_fee';

import { FunctionAssertion, FunctionResult } from './function_assertion';

function verifyFillEvents(
    txData: Partial<TxData>,
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
    const takerAddress = txData.from as string;
    const value = new BigNumber(txData.value || 0);
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

    const expectedTransferEvents = [
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
    ].filter(event => event._value.isGreaterThan(0));

    // If not enough wei is sent to cover the protocol fee, there will be an additional WETH transfer event
    if (value.isLessThan(DeploymentManager.protocolFee)) {
        expectedTransferEvents.push({
            _from: takerAddress,
            _to: deployment.staking.stakingProxy.address,
            _value: DeploymentManager.protocolFee,
        });
    }

    // Ensure that the transfer events were correctly emitted.
    verifyEvents<ERC20TokenTransferEventArgs>(receipt, expectedTransferEvents, ERC20TokenEvents.Transfer);
}

interface FillOrderBeforeInfo {
    poolStats: PoolStats;
    aggregatedStats: AggregatedStats;
    poolStake: BigNumber;
    operatorStake: BigNumber;
    poolId: string;
}

/**
 * A function assertion that verifies that a complete and valid fill succeeded and emitted the correct logs.
 */
/* tslint:disable:no-unnecessary-type-assertion */
/* tslint:disable:no-non-null-assertion */
export function validFillOrderAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[Order, BigNumber, string], FillOrderBeforeInfo | void, FillResults> {
    const { actors } = simulationEnvironment;
    const expectedProtocolFee = DeploymentManager.protocolFee;

    return new FunctionAssertion<[Order, BigNumber, string], FillOrderBeforeInfo | void, FillResults>(
        deployment.exchange,
        'fillOrder',
        {
            before: async (args: [Order, BigNumber, string]) => {
                const [order] = args;
                const maker = filterActorsByRole(actors, Maker).find(actor => actor.address === order.makerAddress);
                const poolInfo = getPoolInfoAsync(maker!, simulationEnvironment, deployment);
                return poolInfo;
            },
            after: async (
                beforeInfo: FillOrderBeforeInfo | void,
                result: FunctionResult,
                args: [Order, BigNumber, string],
                txData: Partial<TxData>,
            ) => {
                // Ensure that the tx succeeded.
                expect(result.success, `Error: ${result.data}`).to.be.true();

                const [order, fillAmount] = args;

                // Ensure that the correct events were emitted.
                verifyFillEvents(txData, order, result.receipt!, deployment, fillAmount);

                // If the maker is in a staking pool then validate the protocol fee.
                if (beforeInfo !== undefined) {
                    await assertProtocolFeePaidAsync(
                        beforeInfo,
                        result,
                        simulationEnvironment,
                        deployment,
                        expectedProtocolFee,
                    );
                }
            },
        },
    );
}
/* tslint:enable:no-non-null-assertion */
/* tslint:enable:no-unnecessary-type-assertion */
