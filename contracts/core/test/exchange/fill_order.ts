import { BlockchainLifecycle } from '@0x/dev-utils';
import * as _ from 'lodash';

import { chaiSetup } from '../utils/chai_setup';
import {
    FillOrderCombinatorialUtils,
    fillOrderCombinatorialUtilsFactoryAsync,
} from '../utils/fill_order_combinatorial_utils';
import {
    AllowanceAmountScenario,
    AssetDataScenario,
    BalanceAmountScenario,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    FillScenario,
    OrderAssetAmountScenario,
    TakerAssetFillAmountScenario,
    TakerScenario,
} from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const defaultFillScenario = {
    orderScenario: {
        takerScenario: TakerScenario.Unspecified,
        feeRecipientScenario: FeeRecipientAddressScenario.EthUserAddress,
        makerAssetAmountScenario: OrderAssetAmountScenario.Large,
        takerAssetAmountScenario: OrderAssetAmountScenario.Large,
        makerFeeScenario: OrderAssetAmountScenario.Large,
        takerFeeScenario: OrderAssetAmountScenario.Large,
        expirationTimeSecondsScenario: ExpirationTimeSecondsScenario.InFuture,
        makerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
        takerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
    },
    takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanRemainingFillableTakerAssetAmount,
    makerStateScenario: {
        traderAssetBalance: BalanceAmountScenario.Higher,
        traderAssetAllowance: AllowanceAmountScenario.Higher,
        zrxFeeBalance: BalanceAmountScenario.Higher,
        zrxFeeAllowance: AllowanceAmountScenario.Higher,
    },
    takerStateScenario: {
        traderAssetBalance: BalanceAmountScenario.Higher,
        traderAssetAllowance: AllowanceAmountScenario.Higher,
        zrxFeeBalance: BalanceAmountScenario.Higher,
        zrxFeeAllowance: AllowanceAmountScenario.Higher,
    },
};

describe('FillOrder Tests', () => {
    let fillOrderCombinatorialUtils: FillOrderCombinatorialUtils;

    before(async () => {
        await blockchainLifecycle.startAsync();
        fillOrderCombinatorialUtils = await fillOrderCombinatorialUtilsFactoryAsync(web3Wrapper, txDefaults);
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
        const test = (fillScenarios: FillScenario[]) => {
            _.forEach(fillScenarios, fillScenario => {
                const description = `Combinatorial OrderFill: ${JSON.stringify(fillScenario)}`;
                it(description, async () => {
                    await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
                });
            });
        };

        const allFillScenarios = FillOrderCombinatorialUtils.generateFillOrderCombinations();
        describe('Combinatorially generated fills orders', () => test(allFillScenarios));

        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetAmountScenario: OrderAssetAmountScenario.Small,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetAmountScenario: OrderAssetAmountScenario.Small,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount with zero decimals', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetAmountScenario: OrderAssetAmountScenario.Small,
                    makerAssetDataScenario: AssetDataScenario.ERC20ZeroDecimals,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerScenario: TakerScenario.CorrectlySpecified,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should fill remaining value if takerAssetFillAmount > remaining takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.GreaterThanRemainingFillableTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
        it('should throw when taker is specified and order is claimed by other', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerScenario: TakerScenario.IncorrectlySpecified,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if makerAssetAmount is 0', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetAmountScenario: OrderAssetAmountScenario.Zero,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.GreaterThanRemainingFillableTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if takerAssetAmount is 0', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetAmountScenario: OrderAssetAmountScenario.Zero,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.GreaterThanRemainingFillableTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if takerAssetFillAmount is 0', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.Zero,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if an order is expired', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    expirationTimeSecondsScenario: ExpirationTimeSecondsScenario.InPast,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if maker erc20Balances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if taker erc20Balances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if maker allowances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should throw if taker allowances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
    });

    describe('Testing exchange of ERC721 Tokens', () => {
        it('should successfully exchange a single token between the maker and taker (via fillOrder)', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should successfully fill order when makerAsset is ERC721 and takerAsset is ERC20', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario, true);
        });

        it('should successfully fill order when makerAsset is ERC20 and takerAsset is ERC721', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should successfully fill order when makerAsset is ERC721 and approveAll is set for it', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC20NonZRXEighteenDecimals,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.Unlimited,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });

        it('should successfully fill order when makerAsset and takerAsset are ERC721 and approveAll is set for them', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyRemainingFillableTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.Unlimited,
                },
                takerStateScenario: {
                    ...defaultFillScenario.takerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.Unlimited,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(provider, fillScenario);
        });
    });
});
