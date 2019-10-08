import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { DeploymentManager } from '../../src';

blockchainTests('Exchange & Staking', env => {
    let accounts: string[];
    let deploymentManager: DeploymentManager;

    before(async () => {
        accounts = await env.getAccountAddressesAsync();
        deploymentManager = await DeploymentManager.deployAsync(env);

        // Create a staking pool with the operator as a maker address.
        await deploymentManager.staking.stakingWrapper.createStakingPool.awaitTransactionSuccessAsync(
            constants.ZERO_AMOUNT,
            true,
        );

        // TODO(jalextowle): I will eventually want these utilities to be in the deployment manager.
        // Create default order parameters
        //        const defaultOrderParams = {
        //            ...constants.STATIC_ORDER_PARAMS,
        //            makerAddress: accounts[1],
        //            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
        //            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
        //            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeTokenAddress),
        //            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeTokenAddress),
        //            feeRecipientAddress: feeRecipientAddressLeft,
        //            exchangeAddress: exchange.address,
        //            chainId,
        //        };
    });

    // Function assertions for all of the functions involved in
    // (1) Creating a staking pool
    //     - At first, this can be isolated.
    // (2) Joining a staking pool as a maker
    //     - This can be isolated too, and we can assume a limited number
    //       of market makers to make things easy.
    // (3) Paying a protocol fee
    //     - I'm personally of the opinion that we should write integration
    //       tests for the exchange and the staking contracts to interoperate.
    // (4) Going to the next epoch
    //     - This might be something that just get's called every certain number of itterations
    //       for simple tests.
    // (5) Finalizing a pool in the epoch
    //     - Ditto
});
