import { DydxBridgeActionType, TestDydxBridgeContract } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, describe, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { LogWithDecodedArgs, DecodedLogArgs, LogEntry } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { assetDataUtils } from '@0x/order-utils';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';

import { DeploymentManager } from '../framework/deployment_manager';

import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { Actor } from '../framework/actors/base';
import { deployDydxBridgeAsync } from '../bridges/deploy_dydx_bridge';

import * as _ from 'lodash';

blockchainTests.resets('Exchange fills dydx orders', env => {
    let testContract: TestDydxBridgeContract;
    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    const marketId = new BigNumber(3);
    const makerAssetAmount = toBaseUnitAmount(6);
    const takerAssetAmount = toBaseUnitAmount(1);
    let maker: Maker;
    let taker: Taker;
    const defaultDepositAction = {
        actionType: DydxBridgeActionType.Deposit as number,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        // The bridge is passed the `makerAssetFillAmount` and we
        // want to compute the input `takerAssetFillAmount`
        //   => multiply by `takerAssetAmount` / `makerAssetAmount`.
        conversionRateNumerator: takerAssetAmount,
        conversionRateDenominator: makerAssetAmount,
    };
    const defaultWithdrawAction = {
        actionType: DydxBridgeActionType.Withdraw as number,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        conversionRateNumerator: constants.ZERO_AMOUNT,
        conversionRateDenominator: constants.ZERO_AMOUNT,
    };
    const defaultBridgeData = {
        accountNumbers: [new BigNumber(0)],
        actions: [defaultDepositAction, defaultWithdrawAction],
    };

    before(async () => {
        // Deploy contracts
        const deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
        });
        testContract = await deployDydxBridgeAsync(deployment, env);
        const bridgeData = assetDataUtils.encodeDydxBridgeData(defaultBridgeData);
        const bridgeProxyAssetData = deployment.assetDataEncoder
            .ERC20Bridge(testContract.address, testContract.address, bridgeData)
            .getABIEncodedTransactionData();
        [makerToken, takerToken] = deployment.tokens.erc20;

        // Configure Maker & Taker.
        const orderConfig = {
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData: bridgeProxyAssetData,
            takerAssetData: deployment.assetDataEncoder.ERC20Token(takerToken.address).getABIEncodedTransactionData(),
            // Not important for this test.
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerFeeAssetData: deployment.assetDataEncoder
                .ERC20Token(makerToken.address)
                .getABIEncodedTransactionData(),
            takerFeeAssetData: deployment.assetDataEncoder
                .ERC20Token(takerToken.address)
                .getABIEncodedTransactionData(),
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
        };
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig,
        });
        taker = new Taker({
            name: 'Taker',
            deployment,
        });
        await taker.configureERC20TokenAsync(takerToken, deployment.assetProxies.erc20Proxy.address);
    });

    after(async () => {
        Actor.reset();
    });

    describe('fillOrder', () => {
        const verifyEvents = (logs: (LogWithDecodedArgs<DecodedLogArgs> | LogEntry)[]): void => {
            // Extract values from fill event.
            const fillEvent = _.find(logs, log => {
                return (log as any).event === 'Fill';
            }) as LogWithDecodedArgs<DecodedLogArgs>;
            const makerAssetFilledAmount = fillEvent.args.makerAssetFilledAmount;
            const takerAssetFilledAmount = fillEvent.args.takerAssetFilledAmount;

            // Extract amount deposited into dydx from maker.
            const dydxDepositEvent = _.find(logs, log => {
                return (
                    (log as any).event === 'OperateAction' &&
                    (log as any).args.actionType == DydxBridgeActionType.Deposit
                );
            }) as LogWithDecodedArgs<DecodedLogArgs>;
            const amountDepositedIntoDydx = dydxDepositEvent.args.amountValue;

            // Extract amount withdrawn from dydx to taker.
            const dydxWithdrawEvent = _.find(logs, log => {
                return (
                    (log as any).event === 'OperateAction' &&
                    (log as any).args.actionType == DydxBridgeActionType.Withdraw
                );
            }) as LogWithDecodedArgs<DecodedLogArgs>;
            const amountWithdrawnFromDydx = dydxWithdrawEvent.args.amountValue;

            // Assert fill amounts match amounts deposited/withdrawn from dydx.
            expect(makerAssetFilledAmount).to.bignumber.equal(amountWithdrawnFromDydx);
            expect(takerAssetFilledAmount).to.bignumber.equal(amountDepositedIntoDydx);
        };
        it('should successfully fill a dydx order', async () => {
            const signedOrder = await maker.signOrderAsync();
            const tx = await taker.fillOrderAsync(signedOrder, signedOrder.takerAssetAmount);
            verifyEvents(tx.logs);
        });
        it('should partially fill a dydx order', async () => {
            const signedOrder = await maker.signOrderAsync();
            const tx = await taker.fillOrderAsync(signedOrder, signedOrder.takerAssetAmount.div(2));
            verifyEvents(tx.logs);
        });
    });
});
