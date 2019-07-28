import { blockchainTests } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import {
    AllowanceAmountScenario,
    AssetDataScenario,
    BalanceAmountScenario,
    ExpirationTimeSecondsScenario,
    FeeAssetDataScenario,
    FeeRecipientAddressScenario,
    OrderAssetAmountScenario,
    TakerAssetFillAmountScenario,
    TakerScenario,
} from './utils/fill_order_scenarios';

import {
    FillOrderCombinatorialUtils,
    fillOrderCombinatorialUtilsFactoryAsync,
} from './utils/fill_order_combinatorial_utils';

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

blockchainTests.resets('FillOrder Tests', ({ web3Wrapper, txDefaults }) => {
    let fillOrderCombinatorialUtils: FillOrderCombinatorialUtils;

    before(async () => {
        fillOrderCombinatorialUtils = await fillOrderCombinatorialUtilsFactoryAsync(web3Wrapper, txDefaults);
    });

    describe('Fill tests', () => {
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

        it('should transfer the correct amounts maker == feeRecipient', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    feeRecipientScenario: FeeRecipientAddressScenario.MakerAddress,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should transfer the correct amounts maker == feeRecipient and makerFeeAsset == takerAsset', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    feeRecipientScenario: FeeRecipientAddressScenario.MakerAddress,
                    makerFeeAssetDataScenario: FeeAssetDataScenario.TakerToken,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should transfer the correct amounts taker == feeRecipient', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    feeRecipientScenario: FeeRecipientAddressScenario.TakerAddress,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should transfer the correct amounts taker == feeRecipient and takerFeeAsset == makerAsset', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    feeRecipientScenario: FeeRecipientAddressScenario.TakerAddress,
                    takerFeeAssetDataScenario: FeeAssetDataScenario.MakerToken,
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
    });

    describe('ERC20', () => {
        const assetCombinations = getAllPossiblePairs([
            AssetDataScenario.ERC20ZeroDecimals,
            AssetDataScenario.ERC20FiveDecimals,
            AssetDataScenario.ERC20EighteenDecimals,
        ]);
        for (const [makerAsset, takerAsset] of assetCombinations) {
            it(`should transfer correct amounts between ${makerAsset} and ${takerAsset}`, async () => {
                const fillScenario = {
                    ...defaultFillScenario,
                    orderScenario: {
                        ...defaultFillScenario.orderScenario,
                        makerAssetDataScenario: makerAsset,
                        takerAssetDataScenario: takerAsset,
                    },
                };
                await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
            });
        }
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

        it('should not be able to pay maker fee with maker asset if none is left over (double-spend)', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerFeeAssetDataScenario: FeeAssetDataScenario.MakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetBalance: BalanceAmountScenario.Exact,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should not be able to pay taker fee with taker asset if none is left over (double-spend)', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerFeeAssetDataScenario: FeeAssetDataScenario.TakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                takerStateScenario: {
                    ...defaultFillScenario.takerStateScenario,
                    traderAssetBalance: BalanceAmountScenario.Exact,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
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

        it('should throw if maker balance is too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    traderAssetBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if taker balance is too low to fill order', async () => {
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

        it('should throw if maker fee balance is too low to fill order', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeBalance: BalanceAmountScenario.TooLow,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should throw if taker fee balance is too low to fill order', async () => {
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

    describe('ERC721', () => {
        it('should be able to pay maker fee with taker ERC721', async () => {
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
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should be able to pay taker fee with maker ERC721', async () => {
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
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
        });

        it('should not be able to pay maker fee with maker ERC721 (double-spend)', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.ERC721,
                    makerFeeAssetDataScenario: FeeAssetDataScenario.MakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should be able to pay taker fee with taker ERC721 (double-spend)', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetDataScenario: AssetDataScenario.ERC721,
                    takerFeeAssetDataScenario: FeeAssetDataScenario.TakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                takerStateScenario: {
                    ...defaultFillScenario.takerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });
    });

    describe('ERC1155', () => {
        const assetTypes = [AssetDataScenario.ERC1155Fungible, AssetDataScenario.ERC1155NonFungible];
        for (const assetType of assetTypes) {
            describe(_.startCase(_.toLower((/ERC1155(.+)/.exec(assetType) as string[])[1])), () => {
                it('should be able to pay maker fee with taker asset', async () => {
                    const fillScenario = {
                        ...defaultFillScenario,
                        orderScenario: {
                            ...defaultFillScenario.orderScenario,
                            takerAssetDataScenario: assetType,
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
                            makerAssetDataScenario: assetType,
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

                it('should not be able to pay maker fee with maker asset if not enough left (double-spend)', async () => {
                    const fillScenario = {
                        ...defaultFillScenario,
                        orderScenario: {
                            ...defaultFillScenario.orderScenario,
                            makerAssetDataScenario: assetType,
                            makerFeeAssetDataScenario: FeeAssetDataScenario.MakerToken,
                        },
                        takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                        makerStateScenario: {
                            ...defaultFillScenario.makerStateScenario,
                            traderAssetBalance: BalanceAmountScenario.Exact,
                            feeBalance: BalanceAmountScenario.Zero,
                        },
                    };
                    await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
                });

                it('should be able to pay taker fee with taker asset if not enough left (double-spend)', async () => {
                    const fillScenario = {
                        ...defaultFillScenario,
                        orderScenario: {
                            ...defaultFillScenario.orderScenario,
                            takerAssetDataScenario: assetType,
                            takerFeeAssetDataScenario: FeeAssetDataScenario.TakerToken,
                        },
                        takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                        takerStateScenario: {
                            ...defaultFillScenario.takerStateScenario,
                            traderAssetBalance: BalanceAmountScenario.Exact,
                            feeBalance: BalanceAmountScenario.Zero,
                        },
                    };
                    await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
                });
            });
        }
    });

    describe('MultiAssetProxy', () => {
        it('should be able to pay maker fee with taker MAP', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetDataScenario: AssetDataScenario.MultiAssetERC20,
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

        it('should be able to pay taker fee with maker MAP', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.MultiAssetERC20,
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

        it('should not be able to pay maker fee with maker MAP (double-spend)', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    makerAssetDataScenario: AssetDataScenario.MultiAssetERC20,
                    makerFeeAssetDataScenario: FeeAssetDataScenario.MakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                makerStateScenario: {
                    ...defaultFillScenario.makerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });

        it('should be able to pay taker fee with taker MAP (double-spend)', async () => {
            const fillScenario = {
                ...defaultFillScenario,
                orderScenario: {
                    ...defaultFillScenario.orderScenario,
                    takerAssetDataScenario: AssetDataScenario.MultiAssetERC20,
                    takerFeeAssetDataScenario: FeeAssetDataScenario.TakerToken,
                },
                takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                takerStateScenario: {
                    ...defaultFillScenario.takerStateScenario,
                    feeBalance: BalanceAmountScenario.Zero,
                },
            };
            await fillOrderCombinatorialUtils.testFillOrderScenarioFailureAsync(fillScenario);
        });
    });

    describe('Maker/taker asset combinations', () => {
        const assetDataScenarios = [
            AssetDataScenario.ERC20EighteenDecimals,
            AssetDataScenario.ERC721,
            AssetDataScenario.ERC1155Fungible,
            AssetDataScenario.ERC1155NonFungible,
            AssetDataScenario.MultiAssetERC20,
        ];
        for (const [makerAsset, takerAsset] of getAllPossiblePairs(assetDataScenarios)) {
            it(`should successfully exchange ${makerAsset} for ${takerAsset}`, async () => {
                const fillScenario = {
                    ...defaultFillScenario,
                    orderScenario: {
                        ...defaultFillScenario.orderScenario,
                        makerAssetDataScenario: makerAsset,
                        takerAssetDataScenario: takerAsset,
                    },
                    takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                };
                await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
            });
        }
    });

    describe('Maker/taker fee asset combinations', () => {
        const feeAssetPairs = getAllPossiblePairs([
            FeeAssetDataScenario.ERC20EighteenDecimals,
            FeeAssetDataScenario.ERC721,
            FeeAssetDataScenario.ERC1155Fungible,
            FeeAssetDataScenario.ERC1155NonFungible,
            FeeAssetDataScenario.MultiAssetERC20,
        ]);
        for (const [makerFeeAsset, takerFeeAsset] of feeAssetPairs) {
            it(`should successfully pay maker fee ${makerFeeAsset} and taker fee ${takerFeeAsset}`, async () => {
                const fillScenario = {
                    ...defaultFillScenario,
                    orderScenario: {
                        ...defaultFillScenario.orderScenario,
                        makerFeeAssetDataScenario: makerFeeAsset,
                        takerFeeAssetDataScenario: takerFeeAsset,
                    },
                    takerAssetFillAmountScenario: TakerAssetFillAmountScenario.ExactlyTakerAssetAmount,
                };
                await fillOrderCombinatorialUtils.testFillOrderScenarioSuccessAsync(fillScenario);
            });
        }
    });

    blockchainTests.optional('Combinatorially generated fills orders', () => {
        const allFillScenarios = FillOrderCombinatorialUtils.generateFillOrderCombinations();
        for (const fillScenario of allFillScenarios) {
            const description = `Combinatorial OrderFill: ${JSON.stringify(fillScenario)}`;
            it(description, async () => {
                await fillOrderCombinatorialUtils.testFillOrderScenarioAsync(fillScenario);
            });
        }
    });
});

function getAllPossiblePairs<T>(choices: T[]): Array<[T, T]> {
    const pairs: Array<[T, T]> = [];
    for (const i of _.times(choices.length)) {
        for (const j of _.times(choices.length)) {
            pairs.push([choices[i], choices[j]]);
        }
    }
    return pairs;
}
// tslint:disable: max-file-line-count
