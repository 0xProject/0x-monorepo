import { BlockchainLifecycle } from '@0xproject/dev-utils';
import * as _ from 'lodash';

import { chaiSetup } from '../../src/utils/chai_setup';
import { CoreCombinatorialUtils, coreCombinatorialUtilsFactoryAsync } from '../../src/utils/core_combinatorial_utils';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

import { FillScenario, OrderScenario, TakerAssetFillAmountScenario } from '../../src/utils/types';

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
    const test = (fillScenarios: FillScenario[]) => {
        _.forEach(fillScenarios, fillScenario => {
            const orderScenario = fillScenario.orderScenario;
            const description = `Combinatorial OrderFill: ${orderScenario.feeRecipientScenario} ${
                orderScenario.makerAssetAmountScenario
            } ${orderScenario.takerAssetAmountScenario} ${orderScenario.makerFeeScenario} ${
                orderScenario.takerFeeScenario
            } ${orderScenario.expirationTimeSecondsScenario} ${orderScenario.makerAssetDataScenario} ${
                orderScenario.takerAssetDataScenario
            }`;
            it(description, async () => {
                await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
            });
        });
    };

    const allOrderScenarios = CoreCombinatorialUtils.generateOrderCombinations();
    const allFillScenarios = _.map(allOrderScenarios, orderScenario => {
        return {
            orderScenario,
            takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
        };
    });

    describe('Fills orders', () => test(allFillScenarios));
});
