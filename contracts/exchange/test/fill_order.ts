import { chaiSetup, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import * as _ from 'lodash';

import {
    AllowanceAmountScenario,
    AssetDataScenario,
    BalanceAmountScenario,
    ExpirationTimeSecondsScenario,
    FeeAssetDataScenario,
    FeeRecipientAddressScenario,
    FillScenario,
    OrderAssetAmountScenario,
    TakerAssetFillAmountScenario,
    TakerScenario,
} from './utils/fill_order_scenarios';

import {
    FillOrderCombinatorialUtils,
    fillOrderCombinatorialUtilsFactoryAsync,
} from './utils/fill_order_combinatorial_utils';

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
        makerAssetDataScenario: AssetDataScenario.ERC20EighteenDecimals,
        takerAssetDataScenario: AssetDataScenario.ERC20EighteenDecimals,
        makerFeeAssetDataScenario: FeeAssetDataScenario.ERC20EighteenDecimals,
        takerFeeAssetDataScenario: FeeAssetDataScenario.ERC20EighteenDecimals,
    },
    takerAssetFillAmountScenario: TakerAssetFillAmountScenario.LessThanTakerAssetAmount,
    makerStateScenario: {
        traderAssetBalance: BalanceAmountScenario.Higher,
        traderAssetAllowance: AllowanceAmountScenario.Unlimited,
        feeBalance: BalanceAmountScenario.Higher,
        feeAllowance: AllowanceAmountScenario.Unlimited,
    },
    takerStateScenario: {
        traderAssetBalance: BalanceAmountScenario.Higher,
        traderAssetAllowance: AllowanceAmountScenario.Unlimited,
        feeBalance: BalanceAmountScenario.Higher,
        feeAllowance: AllowanceAmountScenario.Unlimited,
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
                    await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(fillScenario);
                });
            });
        };

        const allFillScenarios = FillOrderCombinatorialUtils.generateFillOrderCombinations();
        describe('Combinatorially generated fills orders', () => test(allFillScenarios));

        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetAmountScenario: OrderAssetAmountScenario.Small,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetAmountScenario: OrderAssetAmountScenario.Small,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
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
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerScenario: TakerScenario.CorrectlySpecified,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should fill remaining value if takerAssetFillAmount > remaining takerAssetAmount', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.GreaterThanTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should be able to pay maker fee with taker asset', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerFeeAssetDataScenario: FeeAssetDataScenario.TakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should be able to pay taker fee with maker asset', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerFeeAssetDataScenario: FeeAssetDataScenario.MakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                takerStateScenario: {
                    ...defaultFillScenario.takerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should throw when taker is specified and order is claimed by other', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerScenario: TakerScenario.IncorrectlySpecified,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if makerAssetAmount is 0', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetAmountScenario: OrderAssetAmountScenario.Zero,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.GreaterThanTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if takerAssetAmount is 0', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetAmountScenario: OrderAssetAmountScenario.Zero,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.GreaterThanTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if takerAssetFillAmount is 0', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.Zero,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if an order is expired', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    expirationTimeSecondsScenario: ExpirationTimeSecondsScenario.InPast,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if maker erc20Balances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if taker erc20Balances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if maker allowances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if taker allowances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if maker fee erc20Balances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if taker fee erc20Balances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if maker fee allowances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeAllowance: AllowanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if taker fee allowances are too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                takerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeAllowance: AllowanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
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
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should successfully fill order when makerAsset is ERC721 and takerAsset is ERC20', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC20EighteenDecimals,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should successfully fill order when makerAsset is ERC20 and takerAsset is ERC721', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC20EighteenDecimals,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should successfully fill order when makerAsset is ERC721 and approveAll is set for it', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC20EighteenDecimals,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.Unlimited,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should successfully fill order when makerAsset and takerAsset are ERC721 and approveAll is set for them', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.Unlimited,
                },
                takerStateScenario: {
                    ...defaultFillScenario.takerStateScenario,
                    traderAssetAllowance: AllowanceAmountScenario.Unlimited,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should be able to pay maker fee with taker asset', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                    makerFeeAssetDataScenario: FeeAssetDataScenario.TakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                    feeAllowance: AllowanceAmountScenario.Unlimited,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should be able to pay taker fee with maker asset', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    takerFeeAssetDataScenario: FeeAssetDataScenario.MakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                takerStateScenario: {
                    ...defaultFillScenario.takerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                    feeAllowance: AllowanceAmountScenario.Unlimited,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });
    });
});
