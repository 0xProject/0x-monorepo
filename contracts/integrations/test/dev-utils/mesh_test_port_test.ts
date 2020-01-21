import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { artifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { Web3Config, web3Factory } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber } from '@0x/utils';

import { Maker } from '../framework/actors/maker';
import { DeploymentManager } from '../framework/deployment_manager';

blockchainTests.resets.only('Extra DevUtils Tests (Mesh Port)', env => {
    let deployment: DeploymentManager;
    let deploymentSnapshot: DeploymentManager;
    let maker: Maker;
    let makerSnapshot: Maker;
    let makerAddress: string;
    let provider: Web3ProviderEngine;
    let devUtils: DevUtilsContract;

    before(async () => {
        [makerAddress] = await env.getAccountAddressesAsync();

        // Create a new provider so that the ganache instance running on port
        // 8545 will be used instead of the in-process ganache instance.
        const providerConfigs: Web3Config = {
            total_accounts: constants.NUM_TEST_ACCOUNTS,
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            unlocked_accounts: await env.getAccountAddressesAsync(),
        };
        provider = web3Factory.getRpcProvider(providerConfigs);

        devUtils = new DevUtilsContract(getContractAddressesForChainOrThrow(1337).devUtils, provider);

        deployment = await DeploymentManager.deployAsync(env, { excludeDevUtils: false, numErc721TokensToDeploy: 1 });

        deploymentSnapshot = await DeploymentManager.deployAsync(
            {
                getAccountAddressesAsync: env.getAccountAddressesAsync,
                getChainIdAsync: env.getChainIdAsync,
                blockchainLifecycle: env.blockchainLifecycle,
                txDefaults: env.txDefaults,
                web3Wrapper: env.web3Wrapper,
                provider,
            },
            {
                excludeDevUtils: true,
                numErc721TokensToDeploy: 1,
            },
        );

        makerSnapshot = new Maker({
            deployment: deploymentSnapshot,
            name: 'makerSnapshot',
            orderConfig: {
                feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
                makerAssetAmount: new BigNumber(1),
                takerAssetData: '0xf47261b0000000000000000000000000871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
                takerAssetAmount: new BigNumber(100000000000000000000),
                makerFee: constants.ONE_ETHER,
                makerFeeAssetData: assetDataUtils.encodeERC20AssetData(deploymentSnapshot.tokens.weth.address),
                takerFee: constants.ZERO_AMOUNT,
                takerFeeAssetData: constants.NULL_BYTES,
            },
        });

        maker = new Maker({
            deployment,
            name: 'maker',
            orderConfig: {
                feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
                makerAssetAmount: new BigNumber(1),
                takerAssetData: '0xf47261b0000000000000000000000000871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
                takerAssetAmount: new BigNumber(100000000000000000000),
                makerFee: constants.ONE_ETHER,
                makerFeeAssetData: assetDataUtils.encodeERC20AssetData(deployment.tokens.weth.address),
                takerFee: constants.ZERO_AMOUNT,
                takerFeeAssetData: constants.NULL_BYTES,
            },
        });
    });

    // tslint:disable:no-console
    it('in-process ganache test', async () => {
        await deployment.tokens.erc721[0]
            .mint(maker.address, new BigNumber(1))
            .awaitTransactionSuccessAsync({ from: maker.address });

        console.log(logPrefix, 'owner ', await deployment.tokens.erc721[0].ownerOf(new BigNumber(1)).callAsync());

        await deployment.tokens.erc721[0]
            .setApprovalForAll(deployment.assetProxies.erc721Proxy.address, true)
            .awaitTransactionSuccessAsync({ from: maker.address });

        console.log(
            logPrefix,
            'isApprovedForAll ',
            await deployment.tokens.erc721[0]
                .isApprovedForAll(maker.address, deployment.assetProxies.erc721Proxy.address)
                .callAsync(),
        );

        const makerAssetData = assetDataUtils.encodeERC721AssetData(
            deployment.tokens.erc721[0].address,
            new BigNumber(1),
        );

        await deployment.tokens.weth
            .deposit()
            .awaitTransactionSuccessAsync({ from: maker.address, value: constants.ONE_ETHER });

        console.log(logPrefix, await deployment.tokens.weth.balanceOf(maker.address).callAsync());

        await deployment.tokens.weth
            .approve(deployment.assetProxies.erc20Proxy.address, constants.ONE_ETHER)
            .awaitTransactionSuccessAsync({ from: maker.address });

        console.log(
            logPrefix,
            await deployment.tokens.weth
                .allowance(maker.address, deployment.assetProxies.erc20Proxy.address)
                .callAsync(),
        );

        const signedOrder = await maker.signOrderAsync({ makerAssetData });
        // tslint:disable-next-line:no-non-null-assertion
        const [, fillableTakerAmount] = await deployment
            .devUtils!.getOrderRelevantState(signedOrder, signedOrder.signature)
            .callAsync();
        expect(fillableTakerAmount).to.be.bignumber.equal(signedOrder.takerAssetAmount);
    });

    const logPrefix = '        ';

    // This tests the code on the snapshot
    it('out-of-process ganache test', async () => {
        await deploymentSnapshot.tokens.erc721[0]
            .mint(makerSnapshot.address, new BigNumber(1))
            .awaitTransactionSuccessAsync({ from: makerSnapshot.address });

        console.log(
            logPrefix,
            'owner ',
            await deploymentSnapshot.tokens.erc721[0].ownerOf(new BigNumber(1)).callAsync(),
        );

        console.log(logPrefix, 'makerAddress', makerSnapshot.address)

        await deploymentSnapshot.tokens.erc721[0]
            .setApprovalForAll(deploymentSnapshot.assetProxies.erc721Proxy.address, true)
            .awaitTransactionSuccessAsync({ from: makerSnapshot.address });

        console.log(
            logPrefix,
            'isApprovedForAll ',
            await deploymentSnapshot.tokens.erc721[0]
                .isApprovedForAll(makerSnapshot.address, deploymentSnapshot.assetProxies.erc721Proxy.address)
                .callAsync(),
        );

        const makerAssetData = assetDataUtils.encodeERC721AssetData(
            deploymentSnapshot.tokens.erc721[0].address,
            new BigNumber(1),
        );

        await deploymentSnapshot.tokens.weth
            .deposit()
            .awaitTransactionSuccessAsync({ from: makerSnapshot.address, value: constants.ONE_ETHER });

        console.log(logPrefix, await deploymentSnapshot.tokens.weth.balanceOf(makerSnapshot.address).callAsync());

        await deploymentSnapshot.tokens.weth
            .approve(deploymentSnapshot.assetProxies.erc20Proxy.address, constants.ONE_ETHER)
            .awaitTransactionSuccessAsync({ from: makerSnapshot.address });

        console.log(
            logPrefix,
            await deploymentSnapshot.tokens.weth
                .allowance(makerSnapshot.address, deploymentSnapshot.assetProxies.erc20Proxy.address)
                .callAsync(),
        );

        const signedOrder = await makerSnapshot.signOrderAsync({ makerAssetData });
        const [, fillableTakerAmount] = await devUtils
            .getOrderRelevantState(signedOrder, signedOrder.signature)
            .callAsync();
        expect(fillableTakerAmount).to.be.bignumber.equal(signedOrder.takerAssetAmount);
    });
    // tslint:enable:no-console
});
