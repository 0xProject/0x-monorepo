import { MatchedFillResults, Order } from '@0x/types';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { Maker } from '../actors/maker';
import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';
import { assertProtocolFeePaidAsync, getPoolInfoAsync, PoolInfo } from '../utils/assert_protocol_fee';
import { verifyMatchEvents } from '../utils/verify_match_events';

import { FunctionAssertion, FunctionResult } from './function_assertion';

export const matchOrdersRuntimeAssertion = (
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
    withMaximalFill: boolean,
) => {
    const { actors } = simulationEnvironment;
    const expectedProtocolFee = DeploymentManager.protocolFee.times(2);

    return {
        before: async (args: [Order, Order, string, string]) => {
            const [order] = args;
            // tslint:disable-next-line no-unnecessary-type-assertion
            const maker = actors.find(actor => actor.address === order.makerAddress) as Maker;
            const poolInfo = getPoolInfoAsync(maker, simulationEnvironment, deployment);
            return poolInfo;
        },
        after: async (
            beforeInfo: PoolInfo | void,
            result: FunctionResult,
            args: [Order, Order, string, string],
            txData: Partial<TxData>,
        ) => {
            // Ensure that the correct events were emitted.
            const [leftOrder, rightOrder] = args;

            verifyMatchEvents(
                txData,
                leftOrder,
                rightOrder,
                // tslint:disable-next-line no-non-null-assertion no-unnecessary-type-assertion
                result.receipt!,
                deployment,
                withMaximalFill,
            );

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
    };
};

/**
 * A function assertion that verifies that a complete and valid `matchOrders` succeeded and emitted the correct logs.
 */
/* tslint:disable:no-unnecessary-type-assertion */
/* tslint:disable:no-non-null-assertion */
export function validMatchOrdersAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[Order, Order, string, string], PoolInfo | void, MatchedFillResults> {
    return new FunctionAssertion<[Order, Order, string, string], PoolInfo | void, MatchedFillResults>(
        deployment.exchange,
        'matchOrders',
        matchOrdersRuntimeAssertion(deployment, simulationEnvironment, false),
    );
}
/* tslint:enable:no-non-null-assertion */
/* tslint:enable:no-unnecessary-type-assertion */
