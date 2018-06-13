import { BlockchainLifecycle } from '@0xproject/dev-utils';
import * as _ from 'lodash';

import { chaiSetup } from '../../src/utils/chai_setup';
import { CoreCombinatorialUtils, coreCombinatorialUtilsFactoryAsync } from '../../src/utils/core_combinatorial_utils';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

import { OrderScenario } from '../../src/utils/types';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Combinatorial tests', () => {
    let coreCombinatorialUtils: CoreCombinatorialUtils;

    before(async () => {
        await blockchainLifecycle.startAsync();
        coreCombinatorialUtils = await coreCombinatorialUtilsFactoryAsync(web3Wrapper, txDefaults);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    const test = (orderScenarios: OrderScenario[]) => {
        _.forEach(orderScenarios, orderScenario => {
            const description = `Combinatorial OrderFill: ${orderScenario.feeRecipientScenario} ${
                orderScenario.makerAssetAmountScenario
            } ${orderScenario.takerAssetAmountScenario} ${orderScenario.makerFeeScenario} ${
                orderScenario.takerFeeScenario
            } ${orderScenario.expirationTimeSecondsScenario} ${orderScenario.makerAssetDataScenario} ${
                orderScenario.takerAssetDataScenario
            }`;
            it(description, async () => {
                const order = coreCombinatorialUtils.orderFactory.generateOrder(orderScenario);
                await coreCombinatorialUtils.testFillOrderScenarioAsync(order, provider);
            });
        });
    };

    const allOrderScenarios = CoreCombinatorialUtils.generateOrderCombinations();

    describe.only('Fills orders', () => test(allOrderScenarios));
});
