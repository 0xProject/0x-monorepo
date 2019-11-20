import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { ExchangeRevertErrors } from '@0x/contracts-exchange';
import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import { blockchainTests, constants, expect, orderHashUtils, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { OrderStatus } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { Actor } from '../framework/actors/base';
import { Maker } from '../framework/actors/maker';
import { actorAddressesByName } from '../framework/actors/utils';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { TokenIds } from '../framework/balances/types';
import { DeploymentManager } from '../framework/deployment_manager';

import { MatchOrderTester, TestMatchOrdersArgs, testMatchOrdersAsync } from './match_order_tester';

const { isRoundingErrorCeil, isRoundingErrorFloor } = LibReferenceFunctions;

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

    let defaultMatchOrdersArgs: TestMatchOrdersArgs;

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

        defaultMatchOrdersArgs = {
            env,
            matchOrderTester,
            makerLeft,
            makerRight,
            leftOrder: constants.STATIC_ORDER_PARAMS,
            rightOrder: constants.STATIC_ORDER_PARAMS,
            matcherAddress: matcher.address,
            expectedTransferAmounts: {},
            withMaximalFill: false,
        };
    });

    after(async () => {
        Actor.count = 0;
    });

    describe('matchOrders', () => {
        // TODO: Should be refactored to use `testMatchOrdersAsync` or moved to unit tests
        it('should transfer correct amounts when right order is fully filled and values pass isRoundingErrorFloor but fail isRoundingErrorCeil', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: new BigNumber(17),
                takerAssetAmount: new BigNumber(98),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: new BigNumber(75),
                takerAssetAmount: new BigNumber(13),
            });

            // Assert is rounding error ceil & not rounding error floor
            // These assertions are taken from MixinMatchOrders::calculateMatchedFillResults
            // The rounding error is derived by computing how much the left maker will sell.
            const numerator = signedOrderLeft.makerAssetAmount;
            const denominator = signedOrderLeft.takerAssetAmount;
            const target = signedOrderRight.makerAssetAmount;
            const _isRoundingErrorCeil = isRoundingErrorCeil(numerator, denominator, target);
            expect(_isRoundingErrorCeil).to.be.true();
            const _isRoundingErrorFloor = isRoundingErrorFloor(numerator, denominator, target);
            expect(_isRoundingErrorFloor).to.be.false();

            // Match signedOrderLeft with signedOrderRight
            // Note that the left maker received a slightly better sell price.
            // This is intentional; see note in MixinMatchOrders.calculateMatchedFillResults.
            // Because the left maker received a slightly more favorable sell price, the fee
            // paid by the left taker is slightly higher than that paid by the left maker.
            // Fees can be thought of as a tax paid by the seller, derived from the sale price.
            const expectedTransferAmounts = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: new BigNumber(13),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount('76.4705882352941176', 16), // 76.47%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: new BigNumber(75),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('76.5306122448979591', 16), // 76.53%
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

        // TODO: Should be refactored to use `testMatchOrdersAsync` or moved to unit tests
        it('should transfer correct amounts when left order is fully filled and values pass isRoundingErrorCeil but fail isRoundingErrorFloor', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: new BigNumber(15),
                takerAssetAmount: new BigNumber(90),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: new BigNumber(97),
                takerAssetAmount: new BigNumber(14),
            });

            // Assert is rounding error floor & not rounding error ceil
            // These assertions are taken from MixinMatchOrders::calculateMatchedFillResults
            // The rounding error is derived computating how much the right maker will buy.
            const numerator = signedOrderRight.takerAssetAmount;
            const denominator = signedOrderRight.makerAssetAmount;
            const target = signedOrderLeft.takerAssetAmount;
            const _isRoundingErrorFloor = isRoundingErrorFloor(numerator, denominator, target);
            expect(_isRoundingErrorFloor).to.be.true();
            const _isRoundingErrorCeil = isRoundingErrorCeil(numerator, denominator, target);
            expect(_isRoundingErrorCeil).to.be.false();

            // Match signedOrderLeft isRoundingErrorFloor right maker received a slightly better purchase price.
            // This is intentional; see note in MixinMatchOrders.calculateMatchedFillResults.
            // Because the right maker received a slightly more favorable buy price, the fee
            // paid by the right taker is slightly higher than that paid by the right maker.
            // Fees can be thought of as a tax paid by the seller, derived from the sale price.
            const expectedTransferAmounts = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: new BigNumber(15),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Right Maker
                leftMakerAssetBoughtByRightMakerAmount: new BigNumber(13),
                rightMakerAssetSoldByRightMakerAmount: new BigNumber(90),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount('92.7835051546391752', 16), // 92.78%
                // Taker
                leftMakerAssetReceivedByTakerAmount: new BigNumber(2),
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('92.8571428571428571', 16), // 92.85%
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

        it('should give right maker a better buy price when rounding', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: new BigNumber(16),
                    takerAssetAmount: new BigNumber(22),
                },
                rightOrder: {
                    makerAssetAmount: new BigNumber(83),
                    takerAssetAmount: new BigNumber(49),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: new BigNumber(16),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: new BigNumber(22),
                    leftMakerAssetBoughtByRightMakerAmount: new BigNumber(13),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount('26.5060240963855421', 16), // 26.506%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: new BigNumber(3),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('26.5306122448979591', 16), // 26.531%
                },
            });
        });

        it('should give left maker a better sell price when rounding', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: new BigNumber(12),
                    takerAssetAmount: new BigNumber(97),
                },
                rightOrder: {
                    makerAssetAmount: new BigNumber(89),
                    takerAssetAmount: new BigNumber(1),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: new BigNumber(11),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount('91.6666666666666666', 16), // 91.6%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: new BigNumber(89),
                    leftMakerAssetBoughtByRightMakerAmount: new BigNumber(1),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: new BigNumber(10),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('91.7525773195876288', 16), // 91.75%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it('should give right maker and right taker a favorable fee price when rounding', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: new BigNumber(16),
                    takerAssetAmount: new BigNumber(22),
                },
                rightOrder: {
                    makerAssetAmount: new BigNumber(83),
                    takerAssetAmount: new BigNumber(49),
                    makerFee: new BigNumber(10000),
                    takerFee: new BigNumber(10000),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: new BigNumber(16),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: new BigNumber(22),
                    leftMakerAssetBoughtByRightMakerAmount: new BigNumber(13),
                    rightMakerFeeAssetPaidByRightMakerAmount: new BigNumber(2650), // 2650.6 rounded down to 2650
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: new BigNumber(3),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: new BigNumber(2653), // 2653.1 rounded down to 2653
                },
            });
        });

        it('should give left maker and left taker a favorable fee price when rounding', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: new BigNumber(12),
                    takerAssetAmount: new BigNumber(97),
                    makerFee: new BigNumber(10000),
                    takerFee: new BigNumber(10000),
                },
                rightOrder: {
                    makerAssetAmount: new BigNumber(89),
                    takerAssetAmount: new BigNumber(1),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: new BigNumber(11),
                    leftMakerFeeAssetPaidByLeftMakerAmount: new BigNumber(9166), // 9166.6 rounded down to 9166
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: new BigNumber(89),
                    leftMakerAssetBoughtByRightMakerAmount: new BigNumber(1),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: new BigNumber(10),
                    leftTakerFeeAssetPaidByTakerAmount: new BigNumber(9175), // 9175.2 rounded down to 9175
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it(`should transfer correct amounts when right order fill amount deviates
            from amount derived by \`Exchange.fillOrder\``, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: new BigNumber(1000),
                    takerAssetAmount: new BigNumber(1005),
                },
                rightOrder: {
                    makerAssetAmount: new BigNumber(2126),
                    takerAssetAmount: new BigNumber(1063),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: new BigNumber(1000),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    // Notes:
                    //  i.
                    //    The left order is fully filled by the right order, so the right maker must sell 1005 units of their asset to the left maker.
                    //    By selling 1005 units, the right maker should theoretically receive 502.5 units of the left maker's asset.
                    //    Since the transfer amount must be an integer, this value must be rounded down to 502 or up to 503.
                    //  ii.
                    //    If the right order were filled via `Exchange.fillOrder` the respective fill amounts would be [1004, 502] or [1006, 503].
                    //    It follows that we cannot trigger a sale of 1005 units of the right maker's asset through `Exchange.fillOrder`.
                    //  iii.
                    //    For an optimal match, the algorithm must choose either [1005, 502] or [1005, 503] as fill amounts for the right order.
                    //    The algorithm favors the right maker when the exchange rate must be rounded, so the final fill for the right order is [1005, 503].
                    //  iv.
                    //    The right maker fee differs from the right taker fee because their exchange rate differs.
                    //    The right maker always receives the better exchange and fee price.
                    rightMakerAssetSoldByRightMakerAmount: new BigNumber(1005),
                    leftMakerAssetBoughtByRightMakerAmount: new BigNumber(503),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount('47.2718720602069614', 16), // 47.27%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: new BigNumber(497),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount('47.3189087488240827', 16), // 47.31%
                },
            });
        });

        it('should transfer the correct amounts when orders completely fill each other', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it(`should transfer the correct amounts when orders completely fill each
            other and taker doesn't take a profit`, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(5, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it(`should transfer the correct amounts when left order is completely filled
            and right order is partially filled`, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(20, 18),
                    takerAssetAmount: toBaseUnitAmount(4, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                },
            });
        });

        it(`should transfer the correct amounts when right order is completely filled
            and left order is partially filled`, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(50, 18),
                    takerAssetAmount: toBaseUnitAmount(100, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(10, 16), // 10%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(10, 16), // 10%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the left order', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(50, 18),
                takerAssetAmount: toBaseUnitAmount(100, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(10, 18),
                takerAssetAmount: toBaseUnitAmount(2, 18),
            });
            // Match orders
            const expectedTransferAmounts = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(10, 16), // 10%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Taker
                leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(10, 16), // 10%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                leftProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
                rightProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
            };
            // prettier-ignore
            const matchResults = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                DeploymentManager.protocolFee.times(2),
                false,
            );
            // Construct second right order
            // Note: This order needs makerAssetAmount=90/takerAssetAmount=[anything <= 45] to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "left fill"
            //       branch in the contract twice for this test.
            const signedOrderRight2 = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(100, 18),
                takerAssetAmount: toBaseUnitAmount(50, 18),
            });
            // Match signedOrderLeft with signedOrderRight2
            const expectedTransferAmounts2 = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(45, 18),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(90, 16), // 90% (10% paid earlier)
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(90, 18),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(90, 16), // 90%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(90, 16), // 90% (10% paid earlier)
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(90, 16), // 90%
                leftProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
                rightProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
            };

            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight2,
                    leftOrderTakerAssetFilledAmount: matchResults.orders.leftOrderTakerAssetFilledAmount,
                },
                expectedTransferAmounts2,
                matcher.address,
                DeploymentManager.protocolFee.times(2),
                false,
            );
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the right order', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(10, 18),
                takerAssetAmount: toBaseUnitAmount(2, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(50, 18),
                takerAssetAmount: toBaseUnitAmount(100, 18),
            });

            // Match orders
            const expectedTransferAmounts = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(10, 18),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(2, 18),
                leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(4, 18),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(4, 16), // 4%
                // Taker
                leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(6, 18),
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(4, 16), // 4%
                leftProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
                rightProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
            };
            const matchResults = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                DeploymentManager.protocolFee.times(2),
                false,
            );

            // Create second left order
            // Note: This order needs makerAssetAmount=96/takerAssetAmount=48 to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "right fill"
            //       branch in the contract twice for this test.
            const signedOrderLeft2 = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(100, 18),
                takerAssetAmount: toBaseUnitAmount(50, 18),
            });

            // Match signedOrderLeft2 with signedOrderRight
            const expectedTransferAmounts2 = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(96, 18),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(96, 16), // 96%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(48, 18),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(96, 16), // 96%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(96, 16), // 96%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(96, 16), // 96%
                leftProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
                rightProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft2,
                    rightOrder: signedOrderRight,
                    rightOrderTakerAssetFilledAmount: matchResults.orders.rightOrderTakerAssetFilledAmount,
                },
                expectedTransferAmounts2,
                matcher.address,
                DeploymentManager.protocolFee.times(2),
                false,
            );
        });

        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    feeRecipientAddress: feeRecipientLeft.address,
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    feeRecipientAddress: feeRecipientLeft.address,
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                matcherAddress: makerLeft.address,
            });
        });

        it('should transfer the correct amounts if taker == rightMaker', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                matcherAddress: makerRight.address,
            });
        });

        it('should transfer the correct amounts if taker == leftFeeRecipient', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                matcherAddress: feeRecipientLeft.address,
            });
        });

        it('should transfer the correct amounts if taker == rightFeeRecipient', async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                matcherAddress: feeRecipientRight.address,
            });
        });

        it(`should transfer the correct amounts if leftMaker == leftFeeRecipient
            && rightMaker == rightFeeRecipient`, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    feeRecipientAddress: makerLeft.address,
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    feeRecipientAddress: makerRight.address,
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it(`should transfer the correct amounts if leftMaker == leftFeeRecipient
            && leftMakerFeeAsset == leftTakerAsset`, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerLeft.address,
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it(`should transfer the correct amounts if rightMaker == rightFeeRecipient
            && rightMakerFeeAsset == rightTakerAsset`, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    makerFeeAssetData: makerAssetDataLeft,
                    feeRecipientAddress: makerRight.address,
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it(`should transfer the correct amounts if rightMaker == rightFeeRecipient && rightTakerAsset == rightMakerFeeAsset
                && leftMaker == leftFeeRecipient && leftTakerAsset == leftMakerFeeAsset`, async () => {
            await testMatchOrdersAsync({
                ...defaultMatchOrdersArgs,
                leftOrder: {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerLeft.address,
                },
                rightOrder: {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerRight.address,
                },
                expectedTransferAmounts: {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(5, 18),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(10, 18),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 18),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
            });
        });

        it('should revert if left order is not fillable', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(5, 18),
                takerAssetAmount: toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(10, 18),
                takerAssetAmount: toBaseUnitAmount(2, 18),
            });
            const orderHashHexLeft = orderHashUtils.getOrderHashHex(signedOrderLeft);

            // Cancel left order
            await makerLeft.cancelOrderAsync(signedOrderLeft);

            // Match orders
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHexLeft, OrderStatus.Cancelled);
            const tx = deployment.exchange
                .matchOrders(signedOrderLeft, signedOrderRight, signedOrderLeft.signature, signedOrderRight.signature)
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if right order is not fillable', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(5, 18),
                takerAssetAmount: toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(10, 18),
                takerAssetAmount: toBaseUnitAmount(2, 18),
            });
            const orderHashHexRight = orderHashUtils.getOrderHashHex(signedOrderRight);

            // Cancel right order
            await makerRight.cancelOrderAsync(signedOrderRight);

            // Match orders
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHexRight, OrderStatus.Cancelled);
            const tx = deployment.exchange
                .matchOrders(signedOrderLeft, signedOrderRight, signedOrderLeft.signature, signedOrderRight.signature)
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if there is not a positive spread', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(5, 18),
                takerAssetAmount: toBaseUnitAmount(100, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(1, 18),
                takerAssetAmount: toBaseUnitAmount(200, 18),
            });
            const orderHashHexLeft = orderHashUtils.getOrderHashHex(signedOrderLeft);
            const orderHashHexRight = orderHashUtils.getOrderHashHex(signedOrderRight);

            // Match orders
            const expectedError = new ExchangeRevertErrors.NegativeSpreadError(orderHashHexLeft, orderHashHexRight);
            const tx = deployment.exchange
                .matchOrders(signedOrderLeft, signedOrderRight, signedOrderLeft.signature, signedOrderRight.signature)
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the left maker asset is not equal to the right taker asset ', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(5, 18),
                takerAssetAmount: toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                takerAssetData: deployment.assetDataEncoder
                    .ERC20Token(makerAssetRight.address)
                    .getABIEncodedTransactionData(),
                makerAssetAmount: toBaseUnitAmount(10, 18),
                takerAssetAmount: toBaseUnitAmount(2, 18),
            });

            // We are assuming assetData fields of the right order are the
            // reverse of the left order, rather than checking equality. This
            // saves a bunch of gas, but as a result if the assetData fields are
            // off then the failure ends up happening at signature validation
            const reconstructedOrderRight = {
                ...signedOrderRight,
                takerAssetData: signedOrderLeft.makerAssetData,
            };
            const orderHashHex = orderHashUtils.getOrderHashHex(reconstructedOrderRight);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadOrderSignature,
                orderHashHex,
                signedOrderRight.makerAddress,
                signedOrderRight.signature,
            );

            // Match orders
            const tx = deployment.exchange
                .matchOrders(signedOrderLeft, signedOrderRight, signedOrderLeft.signature, signedOrderRight.signature)
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the right maker asset is not equal to the left taker asset', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                takerAssetData: deployment.assetDataEncoder
                    .ERC20Token(makerAssetLeft.address)
                    .getABIEncodedTransactionData(),
                makerAssetAmount: toBaseUnitAmount(5, 18),
                takerAssetAmount: toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(10, 18),
                takerAssetAmount: toBaseUnitAmount(2, 18),
            });
            const reconstructedOrderRight = {
                ...signedOrderRight,
                makerAssetData: signedOrderLeft.takerAssetData,
            };
            const orderHashHex = orderHashUtils.getOrderHashHex(reconstructedOrderRight);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadOrderSignature,
                orderHashHex,
                signedOrderRight.makerAddress,
                signedOrderRight.signature,
            );
            // Match orders
            const tx = deployment.exchange
                .matchOrders(signedOrderLeft, signedOrderRight, signedOrderLeft.signature, signedOrderRight.signature)
                .awaitTransactionSuccessAsync({ from: matcher.address });
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
// tslint:disable-line:max-file-line-count
