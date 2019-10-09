import { blockchainTests, constants, expect, filterLogsToArguments, OrderFactory } from '@0x/contracts-test-utils';
import { DummyERC20TokenContract, IERC20TokenEvents, IERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { IExchangeEvents, IExchangeFillEventArgs } from '@0x/contracts-exchange';
import { IStakingEventsEvents, IStakingEventsStakingPoolActivatedEventArgs } from '@0x/contracts-staking';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { DeploymentManager, AddressManager } from '../../src';

blockchainTests('Exchange & Staking', env => {
    let accounts: string[];
    let makerAddress: string;
    let takers: string[];
    let delegators: string[];
    let feeRecipientAddress: string;
    let addressManager: AddressManager;
    let deploymentManager: DeploymentManager;
    let orderFactory: OrderFactory;
    let makerAsset: DummyERC20TokenContract;
    let takerAsset: DummyERC20TokenContract;
    let feeAsset: DummyERC20TokenContract;

    const gasPrice = 1e9;

    before(async () => {
        const chainId = await env.getChainIdAsync();
        accounts = await env.getAccountAddressesAsync();
        makerAddress = accounts[1];
        feeRecipientAddress = accounts[2];
        takers = [accounts[3], accounts[4]];
        delegators = [accounts[5], accounts[6], accounts[7]];
        deploymentManager = await DeploymentManager.deployAsync(env);

        // Create a staking pool with the operator as a maker address.
        await deploymentManager.staking.stakingWrapper.createStakingPool.awaitTransactionSuccessAsync(
            constants.ZERO_AMOUNT,
            true,
            { from: makerAddress },
        );

        // Set up an address for market making.
        addressManager = new AddressManager();
        await addressManager.addMakerAsync(
            deploymentManager,
            {
                address: makerAddress,
                mainToken: deploymentManager.tokens.erc20[0],
                feeToken: deploymentManager.tokens.erc20[2],
            },
            env,
            deploymentManager.tokens.erc20[1],
            feeRecipientAddress,
            chainId,
        );

        // Set up two addresses for taking orders.
        await addressManager.addTakersAsync(
            deploymentManager,
            takers.map(takerAddress => {
                return {
                    address: takerAddress,
                    mainToken: deploymentManager.tokens.erc20[1],
                    feeToken: deploymentManager.tokens.erc20[2],
                };
            }),
        );
    });

    describe('fillOrder', () => {
        it('should be able to fill an order', async () => {
            const order = await addressManager.makerAddresses[0].orderFactory.newSignedOrderAsync({
                makerAddress,
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
                feeRecipientAddress,
            });

            const receipt = await deploymentManager.exchange.fillOrder.awaitTransactionSuccessAsync(
                order,
                new BigNumber(1),
                order.signature,
                {
                    from: takers[0],
                    gasPrice,
                    value: DeploymentManager.protocolFeeMultiplier.times(gasPrice),
                },
            );

            // Ensure that the number of emitted logs is equal to 3. There should have been a fill event
            // and two transfer events. A 'StakingPoolActivated' event should not be expected because
            // the only staking pool that was created does not have enough stake.
            expect(receipt.logs.length).to.be.eq(3);

            // Ensure that the fill event was correct.
            const fillArgs = filterLogsToArguments<IExchangeFillEventArgs>(receipt.logs, IExchangeEvents.Fill);
            expect(fillArgs.length).to.be.eq(1);
            expect(fillArgs).to.be.deep.eq([
                {
                    makerAddress,
                    feeRecipientAddress,
                    makerAssetData: order.makerAssetData,
                    takerAssetData: order.takerAssetData,
                    makerFeeAssetData: order.makerFeeAssetData,
                    takerFeeAssetData: order.takerFeeAssetData,
                    orderHash: orderHashUtils.getOrderHashHex(order),
                    takerAddress: takers[0],
                    senderAddress: takers[0],
                    makerAssetFilledAmount: order.makerAssetAmount,
                    takerAssetFilledAmount: order.takerAssetAmount,
                    makerFeePaid: constants.ZERO_AMOUNT,
                    takerFeePaid: constants.ZERO_AMOUNT,
                    protocolFeePaid: DeploymentManager.protocolFeeMultiplier.times(gasPrice),
                },
            ]);

            // Ensure that the transfer events were correctly emitted.
            const transferArgs = filterLogsToArguments<IERC20TokenTransferEventArgs>(
                receipt.logs,
                IERC20TokenEvents.Transfer,
            );
            expect(transferArgs.length).to.be.eq(2);
            expect(transferArgs).to.be.deep.eq([
                {
                    _from: takers[0],
                    _to: makerAddress,
                    _value: order.takerAssetAmount,
                },
                {
                    _from: makerAddress,
                    _to: takers[0],
                    _value: order.makerAssetAmount,
                },
            ]);
        });
    });
});
