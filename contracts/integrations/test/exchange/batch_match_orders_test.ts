import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { ExchangeRevertErrors } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { Actor } from '../framework/actors/base';
import { Maker } from '../framework/actors/maker';
import { actorAddressesByName } from '../framework/actors/utils';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { TokenIds } from '../framework/balances/types';
import { DeploymentManager } from '../framework/deployment_manager';

import { MatchOrderTester, MatchTransferAmounts } from './match_order_tester';

blockchainTests.resets('matchOrders integration tests', env => {
    // The fee recipient addresses.
    let feeRecipientLeft: Actor;
    let feeRecipientRight: Actor;

    // The address that should be responsible for matching orders.
    let matcher: Actor;

    // Market makers who have opposite maker and taker assets.
    let makerLeft: Maker;
    let makerRight: Maker;

    // The addresses of important assets for testing.
    let makerAssetLeft: DummyERC20TokenContract;
    let makerAssetRight: DummyERC20TokenContract;
    let feeAsset: DummyERC20TokenContract;

    let makerAssetDataLeft: string;
    let makerAssetDataRight: string;
    let feeAssetData: string;

    let deployment: DeploymentManager;
    let matchOrderTester: MatchOrderTester;
    let leftId: BigNumber;
    let rightId: BigNumber;

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 3,
            numErc721TokensToDeploy: 1,
            numErc1155TokensToDeploy: 1,
        });

        makerAssetLeft = deployment.tokens.erc20[0];
        makerAssetRight = deployment.tokens.erc20[1];
        feeAsset = deployment.tokens.erc20[2];

        // Create the fee recipient actors.
        feeRecipientLeft = new Actor({
            name: 'left fee recipient',
            deployment,
        });
        feeRecipientRight = new Actor({
            name: 'right fee recipient',
            deployment,
        });

        // Encode the asset data.
        makerAssetDataLeft = deployment.assetDataEncoder
            .ERC20Token(makerAssetLeft.address)
            .getABIEncodedTransactionData();
        makerAssetDataRight = deployment.assetDataEncoder
            .ERC20Token(makerAssetRight.address)
            .getABIEncodedTransactionData();
        feeAssetData = deployment.assetDataEncoder.ERC20Token(feeAsset.address).getABIEncodedTransactionData();

        // Create two market makers with compatible orders for matching.
        makerLeft = new Maker({
            name: 'left maker',
            deployment,
            orderConfig: {
                makerAssetData: makerAssetDataLeft,
                takerAssetData: makerAssetDataRight,
                makerFeeAssetData: feeAssetData,
                takerFeeAssetData: feeAssetData,
                feeRecipientAddress: feeRecipientLeft.address,
            },
        });
        makerRight = new Maker({
            name: 'right maker',
            deployment,
            orderConfig: {
                makerAssetData: makerAssetDataRight,
                takerAssetData: makerAssetDataLeft,
                makerFeeAssetData: feeAssetData,
                takerFeeAssetData: feeAssetData,
                feeRecipientAddress: feeRecipientRight.address,
            },
        });

        // Create a matcher.
        matcher = new Actor({
            name: 'matcher',
            deployment,
        });

        // Configure the appropriate actors with initial balances.
        await Promise.all([
            ...deployment.tokens.erc20.map(async token => makerLeft.configureERC20TokenAsync(token)),
            ...deployment.tokens.erc20.map(async token => makerRight.configureERC20TokenAsync(token)),
            makerLeft.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            makerRight.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            matcher.configureERC20TokenAsync(feeAsset),
            matcher.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            feeRecipientLeft.configureERC20TokenAsync(feeAsset),
            feeRecipientLeft.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            feeRecipientRight.configureERC20TokenAsync(feeAsset),
            feeRecipientRight.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
        ]);

        leftId = await makerLeft.configureERC1155TokenAsync(deployment.tokens.erc1155[0]);
        [rightId] = await makerRight.configureERC721TokenAsync(deployment.tokens.erc721[0]);

        const tokenIds: TokenIds = { erc721: {}, erc1155: {} };
        tokenIds.erc1155[deployment.tokens.erc1155[0].address] = { fungible: [leftId], nonFungible: [] };
        tokenIds.erc721[deployment.tokens.erc721[0].address] = [rightId];

        const blockchainBalanceStore = new BlockchainBalanceStore(
            {
                ...actorAddressesByName([feeRecipientLeft, feeRecipientRight, makerLeft, makerRight, matcher]),
                stakingProxy: deployment.staking.stakingProxy.address,
            },
            {
                erc20: {
                    makerTokenLeft: deployment.tokens.erc20[0],
                    makerTokenRight: deployment.tokens.erc20[1],
                    feeToken: deployment.tokens.erc20[2],
                    weth: deployment.tokens.weth,
                },
                erc721: {
                    nft: deployment.tokens.erc721[0],
                },
                erc1155: {
                    fungible: deployment.tokens.erc1155[0],
                },
            },
            tokenIds,
        );

        matchOrderTester = new MatchOrderTester(deployment, blockchainBalanceStore);
    });

    after(async () => {
        Actor.count = 0;
    });

    describe('batchMatchOrders and batchMatchOrdersWithMaximalFill rich errors', async () => {
        it('should fail if there are zero leftOrders with the ZeroLeftOrders rich error reason', async () => {
            const leftOrders: SignedOrder[] = [];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(2),
                }),
            ];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.ZeroLeftOrders,
            );
            let tx = deployment.exchange
                .batchMatchOrders(
                    leftOrders,
                    rightOrders,
                    leftOrders.map(order => order.signature),
                    rightOrders.map(order => order.signature),
                )
                .awaitTransactionSuccessAsync({ from: matcher.address });
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange
                .batchMatchOrdersWithMaximalFill(
                    leftOrders,
                    rightOrders,
                    leftOrders.map(order => order.signature),
                    rightOrders.map(order => order.signature),
                )
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail if there are zero rightOrders', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(2),
                }),
            ];
            const rightOrders: SignedOrder[] = [];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.ZeroRightOrders,
            );
            let tx = deployment.exchange
                .batchMatchOrders(
                    leftOrders,
                    rightOrders,
                    leftOrders.map(order => order.signature),
                    rightOrders.map(order => order.signature),
                )
                .awaitTransactionSuccessAsync({ from: matcher.address });
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange
                .batchMatchOrdersWithMaximalFill(
                    leftOrders,
                    rightOrders,
                    leftOrders.map(order => order.signature),
                    rightOrders.map(order => order.signature),
                )
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail if there are a different number of left orders and signatures', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: new BigNumber(2),
                    takerAssetAmount: new BigNumber(1),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(2),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(2),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(2),
                }),
            ];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.InvalidLengthLeftSignatures,
            );
            let tx = deployment.exchange
                .batchMatchOrders(
                    leftOrders,
                    rightOrders,
                    [leftOrders[0].signature],
                    rightOrders.map(order => order.signature),
                )
                .awaitTransactionSuccessAsync({ from: matcher.address });
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange
                .batchMatchOrdersWithMaximalFill(
                    leftOrders,
                    rightOrders,
                    [leftOrders[0].signature],
                    rightOrders.map(order => order.signature),
                )
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail if there are a different number of right orders and signatures', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: new BigNumber(2),
                    takerAssetAmount: new BigNumber(1),
                }),
                await makerLeft.signOrderAsync({
                    makerAssetAmount: new BigNumber(2),
                    takerAssetAmount: new BigNumber(1),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(2),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    takerAssetAmount: new BigNumber(2),
                }),
            ];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.InvalidLengthRightSignatures,
            );
            let tx = deployment.exchange
                .batchMatchOrders(leftOrders, rightOrders, leftOrders.map(order => order.signature), [
                    rightOrders[0].signature,
                ])
                .awaitTransactionSuccessAsync({ from: matcher.address });
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange
                .batchMatchOrdersWithMaximalFill(leftOrders, rightOrders, leftOrders.map(order => order.signature), [
                    rightOrders[0].signature,
                ])
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    interface TestBatchMatchOrdersArgs {
        leftOrders: Array<Partial<Order>>;
        rightOrders: Array<Partial<Order>>;
        expectedTransferAmounts: Array<Partial<MatchTransferAmounts>>;
        leftOrdersTakerAssetFilledAmounts: BigNumber[];
        rightOrdersTakerAssetFilledAmounts: BigNumber[];
        matchIndices: Array<[number, number]>;
        shouldMaximallyFill: boolean;
        matcherAddress?: string;
    }

    /**
     * Tests a batch order matching scenario with both eth and weth protocol fees.
     */
    async function testBatchMatchOrdersAsync(args: TestBatchMatchOrdersArgs): Promise<void> {
        const signedLeftOrders = await Promise.all(args.leftOrders.map(async order => makerLeft.signOrderAsync(order)));
        const signedRightOrders = await Promise.all(
            args.rightOrders.map(async order => makerRight.signOrderAsync(order)),
        );

        await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
            {
                leftOrders: signedLeftOrders,
                rightOrders: signedRightOrders,
                leftOrdersTakerAssetFilledAmounts: args.leftOrdersTakerAssetFilledAmounts,
                rightOrdersTakerAssetFilledAmounts: args.rightOrdersTakerAssetFilledAmounts,
            },
            args.matcherAddress || matcher.address,
            DeploymentManager.protocolFee.times(args.matchIndices.length).times(2),
            args.matchIndices,
            args.expectedTransferAmounts.map(transferAmounts => {
                return {
                    ...transferAmounts,
                    leftProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
                    rightProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
                    leftProtocolFeePaidByTakerInWethAmount: constants.ZERO_AMOUNT,
                    rightProtocolFeePaidByTakerInWethAmount: constants.ZERO_AMOUNT,
                };
            }),
            args.shouldMaximallyFill,
        );

        await env.blockchainLifecycle.revertAsync();
        await env.blockchainLifecycle.startAsync();

        await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
            {
                leftOrders: signedLeftOrders,
                rightOrders: signedRightOrders,
                leftOrdersTakerAssetFilledAmounts: args.leftOrdersTakerAssetFilledAmounts,
                rightOrdersTakerAssetFilledAmounts: args.rightOrdersTakerAssetFilledAmounts,
            },
            args.matcherAddress || matcher.address,
            constants.ZERO_AMOUNT,
            args.matchIndices,
            args.expectedTransferAmounts.map(transferAmounts => {
                return {
                    ...transferAmounts,
                    leftProtocolFeePaidByTakerInEthAmount: constants.ZERO_AMOUNT,
                    rightProtocolFeePaidByTakerInEthAmount: constants.ZERO_AMOUNT,
                    leftProtocolFeePaidByTakerInWethAmount: DeploymentManager.protocolFee,
                    rightProtocolFeePaidByTakerInWethAmount: DeploymentManager.protocolFee,
                };
            }),
            args.shouldMaximallyFill,
        );
    }

    describe('batchMatchOrders', () => {
        it('should correctly match two opposite orders', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(1),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                matchIndices: [[0, 0]],
                shouldMaximallyFill: false,
            });
        });

        it('should correctly match a partial fill', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(4),
                        takerAssetAmount: new BigNumber(2),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                matchIndices: [[0, 0]],
                shouldMaximallyFill: false,
            });
        });

        it('should correctly match two left orders to one complementary right order', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(1),
                    },
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(1),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(4),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Right Maker
                        leftMakerAssetBoughtByRightMakerAmount: new BigNumber(2),
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 50%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    },
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 50%
                        // Right Maker
                        leftMakerAssetBoughtByRightMakerAmount: new BigNumber(2),
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 50%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                matchIndices: [[0, 0], [1, 0]],
                shouldMaximallyFill: false,
            });
        });

        it('should correctly match one left order to two complementary right orders', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(4),
                        takerAssetAmount: new BigNumber(2),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                matchIndices: [[0, 0], [0, 1]],
                shouldMaximallyFill: false,
            });
        });

        it('should correctly match one left order to two right orders, where the last should not be touched', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(1),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                matchIndices: [[0, 0]],
                shouldMaximallyFill: false,
            });
        });

        it('should have three order matchings with only two left orders and two right orders', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(4),
                        takerAssetAmount: new BigNumber(2),
                    },
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(1),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(4),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    },
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                matchIndices: [[0, 0], [0, 1], [1, 1]],
                shouldMaximallyFill: false,
            });
        });
    });

    describe('batchMatchOrdersWithMaximalFill', () => {
        it('should fully fill the the right order and pay the profit denominated in the left maker asset', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(17),
                        takerAssetAmount: new BigNumber(98),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(75),
                        takerAssetAmount: new BigNumber(13),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(13),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount('76.4705882352941176', 16), // 76.47%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(75),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('76.5306122448979591', 16), // 76.53%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                matchIndices: [[0, 0]],
                shouldMaximallyFill: true,
            });
        });

        it('should transfer correct amounts when left order is fully filled', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(15),
                        takerAssetAmount: new BigNumber(90),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(196),
                        takerAssetAmount: new BigNumber(28),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(15),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        rightMakerAssetBoughtByLeftMakerAmount: new BigNumber(90),
                        // Right Maker
                        leftMakerAssetBoughtByRightMakerAmount: new BigNumber(15),
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(105),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount('53.5714285714285714', 16), // 53.57%
                        // Taker
                        rightMakerAssetReceivedByTakerAmount: new BigNumber(15),
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('53.5714285714285714', 16), // 53.57%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                matchIndices: [[0, 0]],
                shouldMaximallyFill: true,
            });
        });

        it('should correctly match one left order to two right orders, where the last should not be touched', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(1),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                    {
                        makerAssetAmount: new BigNumber(1),
                        takerAssetAmount: new BigNumber(2),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                matchIndices: [[0, 0]],
                shouldMaximallyFill: true,
            });
        });

        it('should correctly fill all four orders in three matches', async () => {
            await testBatchMatchOrdersAsync({
                leftOrders: [
                    {
                        makerAssetAmount: new BigNumber(2),
                        takerAssetAmount: new BigNumber(1),
                    },
                    {
                        makerAssetAmount: new BigNumber(72),
                        takerAssetAmount: new BigNumber(36),
                    },
                ],
                rightOrders: [
                    {
                        makerAssetAmount: new BigNumber(15),
                        takerAssetAmount: new BigNumber(30),
                    },
                    {
                        makerAssetAmount: new BigNumber(22),
                        takerAssetAmount: new BigNumber(44),
                    },
                ],
                expectedTransferAmounts: [
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(2),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount('6.6666666666666666', 16), // 6.66%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('6.6666666666666666', 16), // 6.66%
                    },
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(28),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount('38.8888888888888888', 16), // 38.88%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(14),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount('93.3333333333333333', 16), // 93.33%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('38.8888888888888888', 16), // 38.88%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('93.3333333333333333', 16), // 93.33%
                    },
                    {
                        // Left Maker
                        leftMakerAssetSoldByLeftMakerAmount: new BigNumber(44),
                        leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount('61.1111111111111111', 16), // 61.11%
                        // Right Maker
                        rightMakerAssetSoldByRightMakerAmount: new BigNumber(22),
                        rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                        // Taker
                        leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('61.1111111111111111', 16), // 61.11%
                        rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    },
                ],
                leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                matchIndices: [[0, 0], [1, 0], [1, 1]],
                shouldMaximallyFill: true,
            });
        });
    });

    describe('token sanity checks', () => {
        it('should be able to match ERC721 tokens with ERC1155 tokens', async () => {
            const leftMakerAssetData = deployment.assetDataEncoder
                .ERC1155Assets(deployment.tokens.erc1155[0].address, [leftId], [new BigNumber(1)], '0x')
                .getABIEncodedTransactionData();
            const rightMakerAssetData = deployment.assetDataEncoder
                .ERC721Token(deployment.tokens.erc721[0].address, rightId)
                .getABIEncodedTransactionData();

            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: new BigNumber(4),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: leftMakerAssetData,
                takerAssetData: rightMakerAssetData,
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(4),
                makerAssetData: rightMakerAssetData,
                takerAssetData: leftMakerAssetData,
            });

            const expectedTransferAmounts = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: new BigNumber(4),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: new BigNumber(1),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                leftProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
                rightProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
            };

            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                DeploymentManager.protocolFee.times(2),
                false,
            );
        });
    });
});
// tslint:disable-line:max-file-line-count
