import { BlockchainLifecycle } from '@0xproject/dev-utils';
import * as _ from 'lodash';

import { chaiSetup } from '../../src/utils/chai_setup';
import { CoreCombinatorialUtils, coreCombinatorialUtilsFactoryAsync } from '../../src/utils/core_combinatorial_utils';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

import {
    AssetDataScenario,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    OrderAmountScenario,
    OrderScenario,
    TakerAssetFillAmountScenario,
    TakerScenario,
} from '../../src/utils/types';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const defaultOrderScenario = {
    takerScenario: TakerScenario.Unspecified,
    feeRecipientScenario: FeeRecipientAddressScenario.EthUserAddress,
    makerAssetAmountScenario: OrderAmountScenario.Large,
    takerAssetAmountScenario: OrderAmountScenario.Large,
    makerFeeScenario: OrderAmountScenario.Large,
    takerFeeScenario: OrderAmountScenario.Large,
    expirationTimeSecondsScenario: ExpirationTimeSecondsScenario.InFuture,
    makerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
    takerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
};

describe.only('FillOrder Tests', () => {
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
    describe('fillOrder', () => {
        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            const fillScenario = {
                orderScenario: defaultOrderScenario,
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    takerAssetAmountScenario: OrderAmountScenario.Small,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    makerAssetAmountScenario: OrderAmountScenario.Small,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    takerScenario: TakerScenario.CorrectlySpecified,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should fill remaining value if takerAssetFillAmount > remaining takerAssetAmount', async () => {
            const fillScenario = {
                orderScenario: defaultOrderScenario,
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.GreaterThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should throw when taker is specified and order is claimed by other', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    takerScenario: TakerScenario.IncorrectlySpecified,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if makerAssetAmount is 0', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    makerAssetAmountScenario: OrderAmountScenario.Zero,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if takerAssetAmount is 0', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    takerAssetAmountScenario: OrderAmountScenario.Zero,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if takerAssetFillAmount is 0', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.Zero,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if an order is expired', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    expirationTimeSecondsScenario: ExpirationTimeSecondsScenario.InPast,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
    });

    describe('Testing Exchange of ERC721 Tokens', () => {
        it('should successfully exchange a single token between the maker and taker (via fillOrder)', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should successfully fill order when makerAsset is ERC721 and takerAsset is ERC20', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should successfully fill order when makerAsset is ERC20 and takerAsset is ERC721', async () => {
            const fillScenario = {
                orderScenario: {
                    ...defaultOrderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
            };
            await coreCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
    });
});
