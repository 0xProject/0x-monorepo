import { MatchedFillResults, Order } from '@0x/types';
import * as _ from 'lodash';

import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';
import { PoolInfo } from '../utils/assert_protocol_fee';

import { FunctionAssertion } from './function_assertion';
import { matchOrdersRuntimeAssertion } from './matchOrders';

/**
 * A function assertion that verifies that a complete and valid `matchOrdersWithMaximalFill` succeeded and emitted the correct logs.
 */
/* tslint:disable:no-unnecessary-type-assertion */
/* tslint:disable:no-non-null-assertion */
export function validMatchOrdersWithMaximalFillAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[Order, Order, string, string], PoolInfo | void, MatchedFillResults> {
    return new FunctionAssertion<[Order, Order, string, string], PoolInfo | void, MatchedFillResults>(
        deployment.exchange,
        'matchOrdersWithMaximalFill',
        matchOrdersRuntimeAssertion(deployment, simulationEnvironment, true),
    );
}
/* tslint:enable:no-non-null-assertion */
/* tslint:enable:no-unnecessary-type-assertion */
