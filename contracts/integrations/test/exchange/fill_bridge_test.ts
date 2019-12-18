import { dydxBridgeDataEncoder, DydxBridgeActionType, DydxBridgeContract, DydxBridgeData, artifacts as assetProxyArtifacts, ERC20BridgeProxyContract } from '@0x/contracts-asset-proxy';
import { StakingProxyContract, ZrxVaultContract, artifacts as stakingArtifacts } from '@0x/contracts-staking';
import { blockchainTests, constants, describe, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { assetDataUtils } from '@0x/order-utils';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';

import { contractAddresses, contractWrappers } from '../mainnet_fork_utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-protocol';

import { DeploymentManager } from '../framework/deployment_manager';

import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { Actor } from '../framework/actors/base';

blockchainTests.resets.only('Exchange fill dydx orders', env => {
    let testContract: DydxBridgeContract;
    let testProxyContract: ERC20BridgeProxyContract;
    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    const marketId = new BigNumber(3);
    let maker: Maker;
    let taker: Taker;
    const defaultDepositAction = {
        actionType: DydxBridgeActionType.Deposit as number,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        conversionRateNumerator: constants.ZERO_AMOUNT,
        conversionRateDenominator: constants.ZERO_AMOUNT,
    };
    const defaultWithdrawAction = {
        actionType: DydxBridgeActionType.Withdraw as number,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        conversionRateNumerator: new BigNumber(2),
        conversionRateDenominator: new BigNumber(10),
    };
    const defaultBridgeData = {
        accountNumbers: [new BigNumber(0)],
        actions: [defaultDepositAction, defaultWithdrawAction],
    }

    before(async () => {
        const deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
        });
        [makerToken, takerToken] = deployment.tokens.erc20;
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: {
                makerAssetData: assetDataUtils.encodeDydxBridgeData(defaultBridgeData),
                takerAssetData: deployment.assetDataEncoder.ERC20Token(takerToken.address).getABIEncodedTransactionData(),
                makerFeeAssetData: constants.NULL_ADDRESS,
                takerFeeAssetData: constants.NULL_ADDRESS,
                feeRecipientAddress: constants.NULL_ADDRESS,
            },
        });
        taker = new Taker({
            name: 'Taker',
            deployment
        });
    });

    after(async () => {
        Actor.reset();
    });

    describe('Dydx Orders', () => {
        it.only('should successfully fill a dydx order', async () => {
           // throw new Error(`maker Address: ${maker.address}`);
            const signedOrder = await maker.signOrderAsync();
            console.log(JSON.stringify(signedOrder));
            //console.log(JSON.stringify(signedOrder));
            const tx = await taker.fillOrderAsync(signedOrder, signedOrder.takerAssetAmount);
            console.log(JSON.stringify(tx));
        });
    });
});
