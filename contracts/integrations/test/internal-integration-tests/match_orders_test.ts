import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { BlockchainBalanceStore, TokenIds } from '@0x/contracts-exchange';
import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import { toBaseUnitAmount } from '@0x/contracts-staking';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { assetDataUtils, ExchangeRevertErrors, orderHashUtils } from '@0x/order-utils';
import { Order, OrderStatus, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { Actor } from '../actors/base';
import { Maker } from '../actors/maker';
import { DeploymentManager } from '../utils/deployment_manager';
import { MatchOrderTester, MatchTransferAmounts } from '../utils/match_order_tester';

const { isRoundingErrorCeil, isRoundingErrorFloor } = LibReferenceFunctions;

blockchainTests.resets('matchOrders', env => {
    // The fee recipient addresses.
    let feeRecipientLeft: Actor;
    let feeRecipientRight: Actor;

    // The address that should be responsible for matching orders.
    let matcher: Actor;

    // Market makers who have opposite maker and taker assets.
    let makerLeft: Maker;
    let makerRight: Maker;

    // The addresses of important assets for testing.
    let makerAssetAddressLeft: string;
    let makerAssetAddressRight: string;
    let feeAssetAddress: string;

    let makerAssetDataLeft: string;
    let makerAssetDataRight: string;
    let feeAssetData: string;

    let deployment: DeploymentManager;
    let matchOrderTester: MatchOrderTester;

    const devUtils = new DevUtilsContract(constants.NULL_ADDRESS, env.provider, env.txDefaults);
    let leftId: BigNumber;
    let rightId: BigNumber;

    const PROTOCOL_FEE = DeploymentManager.protocolFeeMultiplier.times(constants.DEFAULT_GAS_PRICE);

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 3,
            numErc721TokensToDeploy: 1,
            numErc1155TokensToDeploy: 1,
        });
        makerAssetAddressLeft = deployment.tokens.erc20[0].address;
        makerAssetAddressRight = deployment.tokens.erc20[1].address;
        feeAssetAddress = deployment.tokens.erc20[2].address;

        // Create the fee recipient actors.
        feeRecipientLeft = new Actor({
            name: 'left fee recipient',
            deployment,
        });
        feeRecipientRight = new Actor({
            name: 'left fee recipient',
            deployment,
        });

        // Encode the asset data.
        makerAssetDataLeft = assetDataUtils.encodeERC20AssetData(makerAssetAddressLeft);
        makerAssetDataRight = assetDataUtils.encodeERC20AssetData(makerAssetAddressRight);
        feeAssetData = assetDataUtils.encodeERC20AssetData(feeAssetAddress);

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
            matcher.configureERC20TokenAsync(deployment.tokens.erc20[2]),
            matcher.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            feeRecipientLeft.configureERC20TokenAsync(deployment.tokens.erc20[2]),
            feeRecipientLeft.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            feeRecipientRight.configureERC20TokenAsync(deployment.tokens.erc20[2]),
            feeRecipientRight.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
        ]);

        leftId = await makerLeft.configureERC1155TokenAsync(deployment.tokens.erc1155[0]);
        [rightId] = await makerRight.configureERC721TokenAsync(deployment.tokens.erc721[0]);

        const tokenIds: TokenIds = { erc721: {}, erc1155: {} };
        tokenIds.erc1155[deployment.tokens.erc1155[0].address] = { fungible: [leftId], nonFungible: [] };
        tokenIds.erc721[deployment.tokens.erc721[0].address] = [rightId];

        const blockchainBalanceStore = new BlockchainBalanceStore(
            {
                feeRecipientLeft: feeRecipientLeft.address,
                feeRecipientRight: feeRecipientRight.address,
                makerLeft: makerLeft.address,
                makerRight: makerRight.address,
                matcher: matcher.address,
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
                    token: deployment.tokens.erc721[0],
                },
                erc1155: {
                    token: deployment.tokens.erc1155[0],
                },
            },
            tokenIds,
        );

        matchOrderTester = new MatchOrderTester(deployment, blockchainBalanceStore);
    });

    async function testMatchOrdersAsync(
        leftOrder: Partial<Order>,
        rightOrder: Partial<Order>,
        expectedTransferAmounts: Partial<MatchTransferAmounts>,
        withMaximalFill: boolean,
        matcherAddress?: string,
    ): Promise<void> {
        // Create orders to match.
        const signedOrderLeft = await makerLeft.signOrderAsync(leftOrder);
        const signedOrderRight = await makerRight.signOrderAsync(rightOrder);

        await matchOrderTester.matchOrdersAndAssertEffectsAsync(
            {
                leftOrder: signedOrderLeft,
                rightOrder: signedOrderRight,
            },
            {
                ...expectedTransferAmounts,
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                leftProtocolFeePaidByTakerInWethAmount: constants.ZERO_AMOUNT,
                rightProtocolFeePaidByTakerInWethAmount: constants.ZERO_AMOUNT,
            },
            matcherAddress || matcher.address,
            PROTOCOL_FEE.times(2),
            withMaximalFill,
        );

        await env.blockchainLifecycle.revertAsync();
        await env.blockchainLifecycle.startAsync();

        await matchOrderTester.matchOrdersAndAssertEffectsAsync(
            {
                leftOrder: signedOrderLeft,
                rightOrder: signedOrderRight,
            },
            {
                ...expectedTransferAmounts,
                leftProtocolFeePaidByTakerInEthAmount: constants.ZERO_AMOUNT,
                rightProtocolFeePaidByTakerInEthAmount: constants.ZERO_AMOUNT,
                leftProtocolFeePaidByTakerInWethAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInWethAmount: PROTOCOL_FEE,
            },
            matcherAddress || matcher.address,
            constants.ZERO_AMOUNT,
            withMaximalFill,
        );
    }

    describe('matchOrders', () => {
        it('Should transfer correct amounts when right order is fully filled and values pass isRoundingErrorFloor but fail isRoundingErrorCeil', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(17, 0),
                takerAssetAmount: toBaseUnitAmount(98, 0),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(75, 0),
                takerAssetAmount: toBaseUnitAmount(13, 0),
            });

            // Assert is rounding error ceil & not rounding error floor
            // These assertions are taken from MixinMatchOrders::calculateMatchedFillResults
            // The rounding error is derived computating how much the left maker will sell.
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
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(13, 0),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16), // 76.47%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(75, 0),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16), // 76.53%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };

            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
                false,
            );
        });

        it('Should transfer correct amounts when left order is fully filled and values pass isRoundingErrorCeil but fail isRoundingErrorFloor', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(15, 0),
                takerAssetAmount: toBaseUnitAmount(90, 0),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(97, 0),
                takerAssetAmount: toBaseUnitAmount(14, 0),
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
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(15, 0),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Right Maker
                leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(13, 0),
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(90, 0),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(new BigNumber('92.7835051546391752'), 16), // 92.78%
                // Taker
                leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(2, 0),
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('92.8571428571428571'), 16), // 92.85%
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };

            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
                false,
            );
        });

        it('should give right maker a better buy price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(16, 0),
                    takerAssetAmount: toBaseUnitAmount(22, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(83, 0),
                    takerAssetAmount: toBaseUnitAmount(49, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(16, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(22, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(13, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(
                        new BigNumber('26.5060240963855421'),
                        16,
                    ), // 26.506%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('26.5306122448979591'), 16), // 26.531%
                },
                false,
            );
        });

        it('should give left maker a better sell price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(12, 0),
                    takerAssetAmount: toBaseUnitAmount(97, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(89, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(11, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(89, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(10, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                false,
            );
        });

        it('should give right maker and right taker a favorable fee price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(16, 0),
                    takerAssetAmount: toBaseUnitAmount(22, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(83, 0),
                    takerAssetAmount: toBaseUnitAmount(49, 0),
                    makerFee: toBaseUnitAmount(10000, 0),
                    takerFee: toBaseUnitAmount(10000, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(16, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(22, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(13, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(2650, 0), // 2650.6 rounded down tro 2650
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(2653, 0), // 2653.1 rounded down to 2653
                },
                false,
            );
        });

        it('should give left maker and left taker a favorable fee price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(12, 0),
                    takerAssetAmount: toBaseUnitAmount(97, 0),
                    makerFee: toBaseUnitAmount(10000, 0),
                    takerFee: toBaseUnitAmount(10000, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(89, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(11, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(9166, 0), // 9166.6 rounded down to 9166
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(89, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(10, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(9175, 0), // 9175.2 rounded down to 9175
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                false,
            );
        });

        it(`should transfer correct amounts when right order fill amount deviates
            from amount derived by \`Exchange.fillOrder\``, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(1000, 0),
                    takerAssetAmount: toBaseUnitAmount(1005, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(2126, 0),
                    takerAssetAmount: toBaseUnitAmount(1063, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(1000, 0),
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
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1005, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(503, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(
                        new BigNumber('47.2718720602069614'),
                        16,
                    ), // 47.27%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(497, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('47.3189087488240827'), 16), // 47.31%
                },
                false,
            );
        });

        it('should transfer the correct amounts when orders completely fill each other', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                false,
            );
        });

        it(`should transfer the correct amounts when orders completely fill each
            other and taker doesn't take a profit`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(5, 18),
                },
                {
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
                false,
            );
        });

        it(`should transfer the correct amounts when left order is completely filled
            and right order is partially filled`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(20, 18),
                    takerAssetAmount: toBaseUnitAmount(4, 18),
                },
                {
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
                false,
            );
        });

        it(`should transfer the correct amounts when right order is completely filled
            and left order is partially filled`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(50, 18),
                    takerAssetAmount: toBaseUnitAmount(100, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                false,
            );
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
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            // prettier-ignore
            const matchResults = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
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
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };

            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight2,
                    leftOrderTakerAssetFilledAmount: matchResults.orders.leftOrderTakerAssetFilledAmount,
                },
                expectedTransferAmounts2,
                matcher.address,
                PROTOCOL_FEE.times(2),
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
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            const matchResults = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
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
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft2,
                    rightOrder: signedOrderRight,
                    rightOrderTakerAssetFilledAmount: matchResults.orders.rightOrderTakerAssetFilledAmount,
                },
                expectedTransferAmounts2,
                matcher.address,
                PROTOCOL_FEE.times(2),
                false,
            );
        });

        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    feeRecipientAddress: feeRecipientLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    feeRecipientAddress: feeRecipientLeft.address,
                },
                {
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
                false,
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                false,
                makerLeft.address,
            );
        });

        it('should transfer the correct amounts if taker == rightMaker', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                false,
                makerRight.address,
            );
        });

        it('should transfer the correct amounts if taker == leftFeeRecipient', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                false,
                feeRecipientLeft.address,
            );
        });

        it('should transfer the correct amounts if taker == rightFeeRecipient', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                false,
                feeRecipientRight.address,
            );
        });

        it(`should transfer the correct amounts if leftMaker == leftFeeRecipient
            && rightMaker == rightFeeRecipient`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    feeRecipientAddress: makerLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    feeRecipientAddress: makerRight.address,
                },
                {
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
                false,
            );
        });

        it(`should transfer the correct amounts if leftMaker == leftFeeRecipient
            && leftMakerFeeAsset == leftTakerAsset`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                false,
            );
        });

        it(`should transfer the correct amounts if rightMaker == rightFeeRecipient
            && rightMakerFeeAsset == rightTakerAsset`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    makerFeeAssetData: makerAssetDataLeft,
                    feeRecipientAddress: makerRight.address,
                },
                {
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
                false,
            );
        });

        it(`should transfer the correct amounts if rightMaker == rightFeeRecipient && rightTakerAsset == rightMakerFeeAsset
                && leftMaker == leftFeeRecipient && leftTakerAsset == leftMakerFeeAsset`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerRight.address,
                },
                {
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
                false,
            );
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
            await deployment.exchange.cancelOrder.awaitTransactionSuccessAsync(signedOrderLeft, {
                from: makerLeft.address,
            });

            // Match orders
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHexLeft, OrderStatus.Cancelled);
            const tx = deployment.exchange.matchOrders.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
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
            await deployment.exchange.cancelOrder.awaitTransactionSuccessAsync(signedOrderRight, {
                from: makerRight.address,
            });

            // Match orders
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHexRight, OrderStatus.Cancelled);
            const tx = deployment.exchange.matchOrders.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
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
            const tx = deployment.exchange.matchOrders.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the left maker asset is not equal to the right taker asset ', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(5, 18),
                takerAssetAmount: toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
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
            const tx = deployment.exchange.matchOrders.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the right maker asset is not equal to the left taker asset', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                takerAssetData: await devUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress).callAsync(),
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
            const tx = deployment.exchange.matchOrders.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('matchOrdersWithMaximalFill', () => {
        it('should transfer correct amounts when right order is fully filled and values pass isRoundingErrorCeil but fail isRoundingErrorFloor', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(17, 0),
                takerAssetAmount: toBaseUnitAmount(98, 0),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(75, 0),
                takerAssetAmount: toBaseUnitAmount(13, 0),
            });
            // Assert is rounding error ceil & not rounding error floor
            // These assertions are taken from MixinMatchOrders::calculateMatchedFillResults
            // The rounding error is derived computating how much the left maker will sell.
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
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(13, 0),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16), // 76.47%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(75, 0),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16), // 76.53%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
                true,
            );
        });

        it('Should transfer correct amounts when left order is fully filled and values pass isRoundingErrorCeil and isRoundingErrorFloor', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(15, 0),
                takerAssetAmount: toBaseUnitAmount(90, 0),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(196, 0),
                takerAssetAmount: toBaseUnitAmount(28, 0),
            });

            // Assert is rounding error floor
            // These assertions are taken from MixinMatchOrders::calculateMatchedFillResults
            // The rounding error is derived computating how much the right maker will buy.
            const numerator = signedOrderRight.makerAssetAmount;
            const denominator = signedOrderRight.takerAssetAmount;
            const target = signedOrderLeft.makerAssetAmount;
            const _isRoundingErrorCeil = isRoundingErrorCeil(numerator, denominator, target);
            expect(_isRoundingErrorCeil).to.be.false();
            const _isRoundingErrorFloor = isRoundingErrorFloor(numerator, denominator, target);
            expect(_isRoundingErrorFloor).to.be.false();

            // Match signedOrderLeft with signedOrderRight
            // Note that the right maker received a slightly better purchase price.
            // This is intentional; see note in MixinMatchOrders.calculateMatchedFillResults.
            // Because the right maker received a slightly more favorable buy price, the fee
            // paid by the right taker is slightly higher than that paid by the right maker.
            // Fees can be thought of as a tax paid by the seller, derived from the sale price.
            const expectedTransferAmounts = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(15, 0),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightMakerAssetBoughtByLeftMakerAmount: toBaseUnitAmount(90, 0),
                // Right Maker
                leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(15, 0),
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(105, 0),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(new BigNumber('53.5714285714285714'), 16), // 53.57%
                // Taker
                rightMakerAssetReceivedByTakerAmount: toBaseUnitAmount(15, 0),
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('53.5714285714285714'), 16), // 53.57%
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
                true,
            );
        });

        it('Should transfer correct amounts when left order is fully filled', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(16, 0),
                    takerAssetAmount: toBaseUnitAmount(22, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(87, 0),
                    takerAssetAmount: toBaseUnitAmount(48, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(16, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightMakerAssetBoughtByLeftMakerAmount: toBaseUnitAmount(22, 0),
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(29, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(16, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(
                        new BigNumber('33.3333333333333333'),
                        16,
                    ), // 33.33%
                    // Taker
                    rightMakerAssetReceivedByTakerAmount: toBaseUnitAmount(7, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('33.3333333333333333'), 16), // 33.33%
                },
                true,
            );
        });

        it('should fully fill both orders and pay out profit in both maker assets', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(7, 0),
                    takerAssetAmount: toBaseUnitAmount(4, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(8, 0),
                    takerAssetAmount: toBaseUnitAmount(6, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(7, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightMakerAssetBoughtByLeftMakerAmount: toBaseUnitAmount(4, 0), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(8, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(6, 0), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerAssetReceivedByTakerAmount: toBaseUnitAmount(4, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                true,
            );
        });

        it('Should give left maker a better sell price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(12, 0),
                    takerAssetAmount: toBaseUnitAmount(97, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(89, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(11, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(89, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(10, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                true,
            );
        });

        it('Should give right maker and right taker a favorable fee price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(16, 0),
                    takerAssetAmount: toBaseUnitAmount(22, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(87, 0),
                    takerAssetAmount: toBaseUnitAmount(48, 0),
                    makerFee: toBaseUnitAmount(10000, 0),
                    takerFee: toBaseUnitAmount(10000, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(16, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightMakerAssetBoughtByLeftMakerAmount: toBaseUnitAmount(22, 0),
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(29, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(16, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(3333, 0), // 3333.3 repeating rounded down to 3333
                    // Taker
                    rightMakerAssetReceivedByTakerAmount: toBaseUnitAmount(7, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(3333, 0), // 3333.3 repeating rounded down to 3333
                },
                true,
            );
        });

        it('Should give left maker and left taker a favorable fee price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(12, 0),
                    takerAssetAmount: toBaseUnitAmount(97, 0),
                    makerFee: toBaseUnitAmount(10000, 0),
                    takerFee: toBaseUnitAmount(10000, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(89, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(11, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(9166, 0), // 9166.6 rounded down to 9166
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(89, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(10, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(9175, 0), // 9175.2 rounded down to 9175
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                true,
            );
        });

        it('Should give left maker a better sell price when rounding', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(12, 0),
                    takerAssetAmount: toBaseUnitAmount(97, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(89, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(11, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(89, 0),
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftMakerAssetReceivedByTakerAmount: toBaseUnitAmount(10, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                },
                true,
            );
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
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            // prettier-ignore
            const matchResults = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
                true,
            );

            // Construct second right order
            // Note: This order needs makerAssetAmount=90/takerAssetAmount=[anything <= 45] to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "left fill"
            //       branch in the contract twice for this test.
            const signedOrderRight2 = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(100, 18),
                takerAssetAmount: toBaseUnitAmount(50, 18),
            });

            // Match the orders.
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
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight2,
                    leftOrderTakerAssetFilledAmount: matchResults.orders.leftOrderTakerAssetFilledAmount,
                },
                expectedTransferAmounts2,
                matcher.address,
                PROTOCOL_FEE.times(2),
                true,
            );
        });

        it('should transfer correct amounts when right order fill amount deviates from amount derived by `Exchange.fillOrder`', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(1000, 0),
                    takerAssetAmount: toBaseUnitAmount(1005, 0),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(2126, 0),
                    takerAssetAmount: toBaseUnitAmount(1063, 0),
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(1000, 0),
                    rightMakerAssetBoughtByLeftMakerAmount: toBaseUnitAmount(1005, 0),
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
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(2000, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(
                        new BigNumber('94.0733772342427093'),
                        16,
                    ), // 94.07%
                    // Taker
                    rightMakerAssetReceivedByTakerAmount: toBaseUnitAmount(995, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('94.0733772342427093'), 16), // 94.07%
                },
                true,
            );
        });

        it("should transfer the correct amounts when orders completely fill each other and taker doesn't take a profit", async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(5, 18),
                },
                {
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
                true,
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
                rightMakerAssetBoughtByLeftMakerAmount: toBaseUnitAmount(2, 18),
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(5, 18),
                leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(10, 18),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(10, 16), // 10%
                // Taker
                rightMakerAssetReceivedByTakerAmount: toBaseUnitAmount(3, 18),
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(10, 16), // 10%
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };
            const matchResults = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
                true,
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
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(90, 18),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(90, 16), // 90%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(45, 18),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(90, 16), // 90%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(90, 16), // 96%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(90, 16), // 90%
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };

            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft2,
                    rightOrder: signedOrderRight,
                    rightOrderTakerAssetFilledAmount: matchResults.orders.rightOrderTakerAssetFilledAmount,
                },
                expectedTransferAmounts2,
                matcher.address,
                PROTOCOL_FEE.times(2),
                true,
            );
        });

        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    feeRecipientAddress: feeRecipientLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    feeRecipientAddress: feeRecipientLeft.address,
                },
                {
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
                true,
            );
        });

        it('should transfer the correct amounts if taker == leftMaker', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                true,
                makerLeft.address,
            );
        });

        it('should transfer the correct amounts if taker == rightMaker', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                true,
                makerRight.address,
            );
        });

        it('should transfer the correct amounts if taker == leftFeeRecipient', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                true,
                feeRecipientLeft.address,
            );
        });

        it('should transfer the correct amounts if taker == rightFeeRecipient', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                true,
                feeRecipientRight.address,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && rightMaker == rightFeeRecipient', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    feeRecipientAddress: makerLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    feeRecipientAddress: makerRight.address,
                },
                {
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
                true,
            );
        });

        it('should transfer the correct amounts if leftMaker == leftFeeRecipient && leftMakerFeeAsset == leftTakerAsset', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                },
                {
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
                true,
            );
        });

        it('should transfer the correct amounts if rightMaker == rightFeeRecipient && rightMakerFeeAsset == rightTakerAsset', async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    makerFeeAssetData: makerAssetDataLeft,
                    feeRecipientAddress: makerRight.address,
                },
                {
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
                true,
            );
        });

        it(`should transfer the correct amounts if rightMaker == rightFeeRecipient && rightTakerAsset == rightMakerFeeAsset
            && leftMaker == leftFeeRecipient && leftTakerAsset == leftMakerFeeAsset`, async () => {
            await testMatchOrdersAsync(
                {
                    makerAssetAmount: toBaseUnitAmount(5, 18),
                    takerAssetAmount: toBaseUnitAmount(10, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerLeft.address,
                },
                {
                    makerAssetAmount: toBaseUnitAmount(10, 18),
                    takerAssetAmount: toBaseUnitAmount(2, 18),
                    makerFeeAssetData: makerAssetDataRight,
                    feeRecipientAddress: makerRight.address,
                },
                {
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
                true,
            );
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
            await deployment.exchange.cancelOrder.awaitTransactionSuccessAsync(signedOrderLeft, {
                from: makerLeft.address,
            });
            // Match orders
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHexLeft, OrderStatus.Cancelled);
            const tx = deployment.exchange.matchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
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
            await deployment.exchange.cancelOrder.awaitTransactionSuccessAsync(signedOrderRight, {
                from: makerRight.address,
            });
            // Match orders
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHexRight, OrderStatus.Cancelled);
            const tx = deployment.exchange.matchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
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
            const tx = deployment.exchange.matchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the left maker asset is not equal to the right taker asset ', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(5, 18),
                takerAssetAmount: toBaseUnitAmount(10, 18),
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                takerAssetData: await devUtils.encodeERC20AssetData.callAsync(defaultERC20TakerAssetAddress),
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
            const tx = deployment.exchange.matchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the right maker asset is not equal to the left taker asset', async () => {
            // Create orders to match
            const signedOrderLeft = await makerLeft.signOrderAsync({
                takerAssetData: await devUtils.encodeERC20AssetData.callAsync(defaultERC20MakerAssetAddress),
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
            const tx = deployment.exchange.matchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batchMatchOrders and batchMatchOrdersWithMaximalFill rich errors', async () => {
        it('should fail if there are zero leftOrders with the ZeroLeftOrders rich error reason', async () => {
            const leftOrders: SignedOrder[] = [];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.ZeroLeftOrders,
            );
            let tx = deployment.exchange.batchMatchOrders.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                leftOrders.map(order => order.signature),
                rightOrders.map(order => order.signature),
                { from: matcher.address },
            );
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange.batchMatchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                leftOrders.map(order => order.signature),
                rightOrders.map(order => order.signature),
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail if there are zero rightOrders', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const rightOrders: SignedOrder[] = [];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.ZeroRightOrders,
            );
            let tx = deployment.exchange.batchMatchOrders.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                leftOrders.map(order => order.signature),
                rightOrders.map(order => order.signature),
                { from: matcher.address },
            );
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange.batchMatchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                leftOrders.map(order => order.signature),
                rightOrders.map(order => order.signature),
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail if there are a different number of left orders and signatures', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.InvalidLengthLeftSignatures,
            );
            let tx = deployment.exchange.batchMatchOrders.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                [leftOrders[0].signature],
                rightOrders.map(order => order.signature),
                { from: matcher.address },
            );
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange.batchMatchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                [leftOrders[0].signature],
                rightOrders.map(order => order.signature),
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail if there are a different number of right orders and signatures', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedError = new ExchangeRevertErrors.BatchMatchOrdersError(
                ExchangeRevertErrors.BatchMatchOrdersErrorCodes.InvalidLengthRightSignatures,
            );
            let tx = deployment.exchange.batchMatchOrders.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                leftOrders.map(order => order.signature),
                [rightOrders[0].signature],
                { from: matcher.address },
            );
            await expect(tx).to.revertWith(expectedError);
            tx = deployment.exchange.batchMatchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                leftOrders,
                rightOrders,
                leftOrders.map(order => order.signature),
                [rightOrders[0].signature],
                { from: matcher.address },
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batchMatchOrders', () => {
        it('should correctly match two opposite orders', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(2),
                [[0, 0]],
                expectedTransferAmounts,
                false,
            );
        });
        it('Should correctly match a partial fill', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(4, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(2),
                [[0, 0]],
                expectedTransferAmounts,
                false,
            );
        });
        it('should correctly match two left orders to one complementary right order', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(4, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 0),
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 50%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 50%
                    // Right Maker
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(2, 0),
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 50%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(4),
                [[0, 0], [1, 0]],
                expectedTransferAmounts,
                false,
            );
        });
        it('should correctly match one left order to two complementary right orders', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(4, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(4),
                [[0, 0], [0, 1]],
                expectedTransferAmounts,
                false,
            );
        });
        it('should correctly match one left order to two right orders, where the last should not be touched', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(2),
                [[0, 0]],
                expectedTransferAmounts,
                false,
            );
        });
        it('should have three order matchings with only two left orders and two right orders', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(4, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(4, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(50, 16), // 50%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(50, 16), // 50%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(6),
                [[0, 0], [0, 1], [1, 1]],
                expectedTransferAmounts,
                false,
            );
        });
    });

    describe('batchMatchOrdersWithMaximalFill', () => {
        it('should fully fill the the right order and pay the profit denominated in the left maker asset', async () => {
            // Create orders to match
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(17, 0),
                    takerAssetAmount: toBaseUnitAmount(98, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(75, 0),
                    takerAssetAmount: toBaseUnitAmount(13, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(13, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16), // 76.47%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(75, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16), // 76.53%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(2),
                [[0, 0]],
                expectedTransferAmounts,
                true,
            );
        });
        it('Should transfer correct amounts when left order is fully filled', async () => {
            // Create orders to match
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(15, 0),
                    takerAssetAmount: toBaseUnitAmount(90, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(196, 0),
                    takerAssetAmount: toBaseUnitAmount(28, 0),
                }),
            ];
            // Match signedOrderLeft with signedOrderRight
            // Note that the right maker received a slightly better purchase price.
            // This is intentional; see note in MixinMatchOrders.calculateMatchedFillResults.
            // Because the right maker received a slightly more favorable buy price, the fee
            // paid by the right taker is slightly higher than that paid by the right maker.
            // Fees can be thought of as a tax paid by the seller, derived from the sale price.
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(15, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightMakerAssetBoughtByLeftMakerAmount: toBaseUnitAmount(90, 0),
                    // Right Maker
                    leftMakerAssetBoughtByRightMakerAmount: toBaseUnitAmount(15, 0),
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(105, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(
                        new BigNumber('53.5714285714285714'),
                        16,
                    ), // 53.57%
                    // Taker
                    rightMakerAssetReceivedByTakerAmount: toBaseUnitAmount(15, 0),
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('53.5714285714285714'), 16), // 53.57%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(2),
                [[0, 0]],
                expectedTransferAmounts,
                true,
            );
        });
        it('should correctly match one left order to two right orders, where the last should not be touched', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(1, 0),
                    takerAssetAmount: toBaseUnitAmount(2, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(2),
                [[0, 0]],
                expectedTransferAmounts,
                true,
            );
        });
        it('should correctly fill all four orders in three matches', async () => {
            const leftOrders = [
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(2, 0),
                    takerAssetAmount: toBaseUnitAmount(1, 0),
                }),
                await makerLeft.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(72, 0),
                    takerAssetAmount: toBaseUnitAmount(36, 0),
                }),
            ];
            const rightOrders = [
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(15, 0),
                    takerAssetAmount: toBaseUnitAmount(30, 0),
                }),
                await makerRight.signOrderAsync({
                    makerAssetAmount: toBaseUnitAmount(22, 0),
                    takerAssetAmount: toBaseUnitAmount(44, 0),
                }),
            ];
            const expectedTransferAmounts = [
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(2, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(new BigNumber('6.6666666666666666'), 16), // 6.66%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('6.6666666666666666'), 16), // 6.66%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(28, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('38.8888888888888888'), 16), // 38.88%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(14, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(
                        new BigNumber('93.3333333333333333'),
                        16,
                    ), // 93.33%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('38.8888888888888888'), 16), // 38.88%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('93.3333333333333333'), 16), // 93.33%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
                {
                    // Left Maker
                    leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(44, 0),
                    leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(new BigNumber('61.1111111111111111'), 16), // 61.11%
                    // Right Maker
                    rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(22, 0),
                    rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                    // Taker
                    leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(new BigNumber('61.1111111111111111'), 16), // 61.11%
                    rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                    leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                    rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                },
            ];
            await matchOrderTester.batchMatchOrdersAndAssertEffectsAsync(
                {
                    leftOrders,
                    rightOrders,
                    leftOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                    rightOrdersTakerAssetFilledAmounts: [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT],
                },
                matcher.address,
                PROTOCOL_FEE.times(6),
                [[0, 0], [1, 0], [1, 1]],
                expectedTransferAmounts,
                true,
            );
        });
    });

    describe('token sanity checks', () => {
        it('should be able to match ERC721 tokens with ERC1155 tokens', async () => {
            const leftMakerAssetData = assetDataUtils.encodeERC1155AssetData(
                deployment.tokens.erc1155[0].address,
                [leftId],
                [new BigNumber(1)],
                '0x',
            );
            const rightMakerAssetData = assetDataUtils.encodeERC721AssetData(
                deployment.tokens.erc721[0].address,
                rightId,
            );

            const signedOrderLeft = await makerLeft.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(100, 0),
                takerAssetAmount: toBaseUnitAmount(1, 0),
                makerAssetData: leftMakerAssetData,
                takerAssetData: rightMakerAssetData,
            });
            const signedOrderRight = await makerRight.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(1, 0),
                takerAssetAmount: toBaseUnitAmount(100, 0),
                makerAssetData: rightMakerAssetData,
                takerAssetData: leftMakerAssetData,
            });

            const expectedTransferAmounts = {
                // Left Maker
                leftMakerAssetSoldByLeftMakerAmount: toBaseUnitAmount(100, 0),
                leftMakerFeeAssetPaidByLeftMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Right Maker
                rightMakerAssetSoldByRightMakerAmount: toBaseUnitAmount(1, 0),
                rightMakerFeeAssetPaidByRightMakerAmount: toBaseUnitAmount(100, 16), // 100%
                // Taker
                leftTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                rightTakerFeeAssetPaidByTakerAmount: toBaseUnitAmount(100, 16), // 100%
                leftProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
                rightProtocolFeePaidByTakerInEthAmount: PROTOCOL_FEE,
            };

            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                {
                    leftOrder: signedOrderLeft,
                    rightOrder: signedOrderRight,
                },
                expectedTransferAmounts,
                matcher.address,
                PROTOCOL_FEE.times(2),
                false,
            );
        });
    });
});
// tslint:disable-line:max-file-line-count
