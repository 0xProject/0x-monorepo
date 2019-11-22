import { constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { FillResults, Order } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import * as _ from 'lodash';

import { Maker } from '../actors/maker';
import { DeploymentManager } from '../deployment_manager';

import { FunctionArguments, FunctionAssertion, FunctionResult } from './function_assertion';

export function validFillOrderCompleteFillAssertion(
    deployment: DeploymentManager,
): FunctionAssertion<[Order, BigNumber, string], {}, FillResults> {
    const exchange = deployment.exchange;

    return new FunctionAssertion<[Order, BigNumber, string], {}, FillResults>(exchange.fillOrder.bind(exchange), {
        after: async (_beforeInfo, result: FunctionResult, args: FunctionArguments<[Order, BigNumber, string]>) => {
            expect(result.success).to.be.true();
            logUtils.log(`Order filled by ${args.txData.from}`);
        },
    });
}
