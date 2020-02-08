import { encodeERC20AssetData } from '@0x/contracts-asset-proxy';
import { ERC20TokenEvents, ERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { ExchangeEvents, ExchangeFillEventArgs } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    constants as stakingConstants,
    IStakingEventsEpochEndedEventArgs,
    IStakingEventsEpochFinalizedEventArgs,
    IStakingEventsEvents,
    IStakingEventsRewardsPaidEventArgs,
    IStakingEventsStakingPoolEarnedRewardsInEpochEventArgs,
} from '@0x/contracts-staking';
import {
    blockchainTests,
    constants,
    expect,
    orderHashUtils,
    toBaseUnitAmount,
    verifyEvents,
} from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor } from '../framework/actors/base';
import { FeeRecipient } from '../framework/actors/fee_recipient';
import { OperatorStakerMaker, StakerKeeper } from '../framework/actors/hybrids';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { actorAddressesByName } from '../framework/actors/utils';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

blockchainTests.resets('fillOrder integration tests', env => {
    let deployment: DeploymentManager;
    let balanceStore: BlockchainBalanceStore;

    let feeRecipient: FeeRecipient;
    let operator: OperatorStakerMaker;
    let maker: Maker;
    let taker: Taker;
    let delegator: StakerKeeper;

    let poolId: string;
    let operatorShare: number;

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const [makerToken, takerToken] = deployment.tokens.erc20;

        feeRecipient = new FeeRecipient({
            name: 'Fee recipient',
            deployment,
        });
        const orderConfig = {
            feeRecipientAddress: feeRecipient.address,
            makerAssetData: encodeERC20AssetData(makerToken.address),
            takerAssetData: encodeERC20AssetData(takerToken.address),
            makerFeeAssetData: encodeERC20AssetData(makerToken.address),
            takerFeeAssetData: encodeERC20AssetData(takerToken.address),
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
        };
        operator = new OperatorStakerMaker({
            name: 'Pool operator',
            deployment,
            orderConfig,
        });
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig,
        });
        taker = new Taker({ name: 'Taker', deployment });
        delegator = new StakerKeeper({ name: 'Delegator', deployment });

        await operator.configureERC20TokenAsync(makerToken);
        await maker.configureERC20TokenAsync(makerToken);
        await taker.configureERC20TokenAsync(takerToken);
        await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);

        await operator.configureERC20TokenAsync(deployment.tokens.zrx);
        await delegator.configureERC20TokenAsync(deployment.tokens.zrx);

        // Create a staking pool with the operator as a maker.
        operatorShare = stakingConstants.PPM * 0.95;
        poolId = await operator.createStakingPoolAsync(operatorShare, true);
        // A vanilla maker joins the pool as well.
        await maker.joinStakingPoolAsync(poolId);

        const tokenOwners = {
            ...actorAddressesByName([feeRecipient, operator, maker, taker, delegator]),
            StakingProxy: deployment.staking.stakingProxy.address,
            ZrxVault: deployment.staking.zrxVault.address,
        };
        const tokenContracts = {
            erc20: { makerToken, takerToken, ZRX: deployment.tokens.zrx, WETH: deployment.tokens.weth },
        };
        balanceStore = new BlockchainBalanceStore(tokenOwners, tokenContracts);
        await balanceStore.updateBalancesAsync();
    });

    after(async () => {
        Actor.reset();
    });

    function verifyFillEvents(order: SignedOrder, receipt: TransactionReceiptWithDecodedLogs): void {
        // Ensure that the fill event was correct.
        verifyEvents<ExchangeFillEventArgs>(
            receipt,
            [
                {
                    makerAddress: maker.address,
                    feeRecipientAddress: feeRecipient.address,
                    makerAssetData: order.makerAssetData,
                    takerAssetData: order.takerAssetData,
                    makerFeeAssetData: order.makerFeeAssetData,
                    takerFeeAssetData: order.takerFeeAssetData,
                    orderHash: orderHashUtils.getOrderHashHex(order),
                    takerAddress: taker.address,
                    senderAddress: taker.address,
                    makerAssetFilledAmount: order.makerAssetAmount,
                    takerAssetFilledAmount: order.takerAssetAmount,
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                    protocolFeePaid: DeploymentManager.protocolFee,
                },
            ],
            ExchangeEvents.Fill,
        );

        // Ensure that the transfer events were correctly emitted.
        verifyEvents<ERC20TokenTransferEventArgs>(
            receipt,
            [
                {
                    _from: taker.address,
                    _to: maker.address,
                    _value: order.takerAssetAmount,
                },
                {
                    _from: maker.address,
                    _to: taker.address,
                    _value: order.makerAssetAmount,
                },
            ],
            ERC20TokenEvents.Transfer,
        );
    }

    it('should fill an order', async () => {
        // Create and fill the order
        const order = await maker.signOrderAsync();
        const receipt = await taker.fillOrderAsync(order, order.takerAssetAmount);

        // Check balances
        const expectedBalances = LocalBalanceStore.create(balanceStore);
        expectedBalances.simulateFills([order], taker.address, receipt, deployment, DeploymentManager.protocolFee);
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);

        // There should have been a fill event and two transfer events. A
        // 'StakingPoolEarnedRewardsInEpoch' event should not be expected because the only staking
        // pool that was created does not have enough stake.
        verifyFillEvents(order, receipt);
    });
    it('should activate a staking pool if it has sufficient stake', async () => {
        // Stake just enough to qualify the pool for rewards.
        await delegator.stakeAsync(toBaseUnitAmount(100), poolId);

        // The delegator, functioning as a keeper, ends the epoch so that delegated stake (theirs
        // and the operator's) becomes active. This puts the staking pool above the minimumPoolStake
        // threshold, so it should be able to earn rewards in the new epoch.
        // Finalizing the pool shouldn't settle rewards because it didn't earn rewards last epoch.
        await delegator.endEpochAsync();
        await delegator.finalizePoolsAsync([poolId]);
        await balanceStore.updateBalancesAsync();

        // Create and fill the order
        const order = await maker.signOrderAsync();
        const receipt = await taker.fillOrderAsync(order, order.takerAssetAmount);

        // Check balances
        const expectedBalances = LocalBalanceStore.create(balanceStore);
        expectedBalances.simulateFills([order], taker.address, receipt, deployment, DeploymentManager.protocolFee);
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);

        // In addition to the fill event and two transfer events emitted in the previous test, we
        // now expect a `StakingPoolEarnedRewardsInEpoch` event to be emitted because the staking
        // pool now has enough stake in the current epoch to earn rewards.
        verifyFillEvents(order, receipt);
        const currentEpoch = await deployment.staking.stakingWrapper.currentEpoch().callAsync();
        verifyEvents<IStakingEventsStakingPoolEarnedRewardsInEpochEventArgs>(
            receipt,
            [
                {
                    epoch: currentEpoch,
                    poolId,
                },
            ],
            IStakingEventsEvents.StakingPoolEarnedRewardsInEpoch,
        );
    });
    it('should pay out rewards to operator and delegator', async () => {
        // Operator and delegator each stake some ZRX; wait an epoch so that the stake is active.
        await operator.stakeAsync(toBaseUnitAmount(100), poolId);
        await delegator.stakeAsync(toBaseUnitAmount(50), poolId);
        await delegator.endEpochAsync();

        // Create and fill the order. One order's worth of protocol fees are now available as rewards.
        const order = await maker.signOrderAsync();
        await taker.fillOrderAsync(order, order.takerAssetAmount);
        const rewardsAvailable = DeploymentManager.protocolFee;

        // Fetch the current balances
        await balanceStore.updateBalancesAsync();
        const expectedBalances = LocalBalanceStore.create(balanceStore);

        // End the epoch. This should wrap the staking proxy's ETH balance.
        const endEpochReceipt = await delegator.endEpochAsync();
        const newEpoch = await deployment.staking.stakingWrapper.currentEpoch().callAsync();

        // Check balances
        expectedBalances.wrapEth(
            deployment.staking.stakingProxy.address,
            deployment.tokens.weth.address,
            DeploymentManager.protocolFee,
        );
        expectedBalances.burnGas(delegator.address, DeploymentManager.gasPrice.times(endEpochReceipt.gasUsed));
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);

        // Check the EpochEnded event
        const weightedDelegatorStake = toBaseUnitAmount(50).times(0.9);
        verifyEvents<IStakingEventsEpochEndedEventArgs>(
            endEpochReceipt,
            [
                {
                    epoch: newEpoch.minus(1),
                    numPoolsToFinalize: new BigNumber(1),
                    rewardsAvailable,
                    totalFeesCollected: DeploymentManager.protocolFee,
                    totalWeightedStake: toBaseUnitAmount(100).plus(weightedDelegatorStake),
                },
            ],
            IStakingEventsEvents.EpochEnded,
        );

        // The rewards are split between the operator and delegator based on the pool's operatorShare
        const operatorReward = ReferenceFunctions.getPartialAmountFloor(
            new BigNumber(operatorShare),
            new BigNumber(constants.PPM_DENOMINATOR),
            rewardsAvailable,
        );
        const delegatorReward = rewardsAvailable.minus(operatorReward);

        // Finalize the pool. This should automatically pay the operator in WETH.
        const [finalizePoolReceipt] = await delegator.finalizePoolsAsync([poolId]);

        // Check balances
        expectedBalances.transferAsset(
            deployment.staking.stakingProxy.address,
            operator.address,
            operatorReward,
            encodeERC20AssetData(deployment.tokens.weth.address),
        );
        expectedBalances.burnGas(delegator.address, DeploymentManager.gasPrice.times(finalizePoolReceipt.gasUsed));
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);

        // Check finalization events
        verifyEvents<IStakingEventsRewardsPaidEventArgs>(
            finalizePoolReceipt,
            [
                {
                    epoch: newEpoch,
                    poolId,
                    operatorReward,
                    membersReward: delegatorReward,
                },
            ],
            IStakingEventsEvents.RewardsPaid,
        );
        verifyEvents<IStakingEventsEpochFinalizedEventArgs>(
            finalizePoolReceipt,
            [
                {
                    epoch: newEpoch.minus(1),
                    rewardsPaid: rewardsAvailable,
                    rewardsRemaining: constants.ZERO_AMOUNT,
                },
            ],
            IStakingEventsEvents.EpochFinalized,
        );
    });
    it('should credit rewards from orders made by the operator to their pool', async () => {
        // Stake just enough to qualify the pool for rewards.
        await delegator.stakeAsync(toBaseUnitAmount(100), poolId);
        await delegator.endEpochAsync();

        // Create and fill the order
        const order = await operator.signOrderAsync();
        await taker.fillOrderAsync(order, order.takerAssetAmount);

        // Check that the pool has collected fees from the above fill.
        const poolStats = await deployment.staking.stakingWrapper.getStakingPoolStatsThisEpoch(poolId).callAsync();
        expect(poolStats.feesCollected).to.bignumber.equal(DeploymentManager.protocolFee);
    });
    it('should collect WETH fees and pay out rewards', async () => {
        // Operator and delegator each stake some ZRX; wait an epoch so that the stake is active.
        await operator.stakeAsync(toBaseUnitAmount(100), poolId);
        await delegator.stakeAsync(toBaseUnitAmount(50), poolId);
        await delegator.endEpochAsync();

        // Fetch the current balances
        await balanceStore.updateBalancesAsync();

        // Create and fill the order. One order's worth of protocol fees are now available as rewards.
        const order = await maker.signOrderAsync();
        const receipt = await taker.fillOrderAsync(order, order.takerAssetAmount, { value: constants.ZERO_AMOUNT });
        const rewardsAvailable = DeploymentManager.protocolFee;
        const expectedBalances = LocalBalanceStore.create(balanceStore);
        expectedBalances.simulateFills([order], taker.address, receipt, deployment);

        // End the epoch. This should wrap the staking proxy's ETH balance.
        const endEpochReceipt = await delegator.endEpochAsync();

        // Check balances
        expectedBalances.burnGas(delegator.address, DeploymentManager.gasPrice.times(endEpochReceipt.gasUsed));
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);

        // The rewards are split between the operator and delegator based on the pool's operatorShare
        const operatorReward = ReferenceFunctions.getPartialAmountFloor(
            new BigNumber(operatorShare),
            new BigNumber(constants.PPM_DENOMINATOR),
            rewardsAvailable,
        );

        // Finalize the pool. This should automatically pay the operator in WETH.
        const [finalizePoolReceipt] = await delegator.finalizePoolsAsync([poolId]);

        // Check balances
        expectedBalances.transferAsset(
            deployment.staking.stakingProxy.address,
            operator.address,
            operatorReward,
            encodeERC20AssetData(deployment.tokens.weth.address),
        );
        expectedBalances.burnGas(delegator.address, DeploymentManager.gasPrice.times(finalizePoolReceipt.gasUsed));
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);
    });
});
