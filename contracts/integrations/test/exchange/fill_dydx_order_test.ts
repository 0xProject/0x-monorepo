import { DydxBridgeActionType, dydxBridgeDataEncoder, TestDydxBridgeContract } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { LibMathRevertErrors } from '@0x/contracts-exchange-libs';
import { blockchainTests, constants, describe, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/order-utils';
import { BigNumber, RevertError } from '@0x/utils';
import { DecodedLogArgs, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { deployDydxBridgeAsync } from '../bridges/deploy_dydx_bridge';
import { Actor } from '../framework/actors/base';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { DeploymentManager } from '../framework/deployment_manager';

blockchainTests.resets('Exchange fills dydx orders', env => {
    let testContract: TestDydxBridgeContract;
    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    const marketId = new BigNumber(3);
    const dydxConversionRateNumerator = toBaseUnitAmount(6);
    const dydxConversionRateDenominator = toBaseUnitAmount(1);
    let maker: Maker;
    let taker: Taker;
    let orderConfig: Partial<SignedOrder>;
    let dydxBridgeProxyAssetData: string;
    let deployment: DeploymentManager;
    let testTokenAddress: string;
    const defaultDepositAction = {
        actionType: DydxBridgeActionType.Deposit as number,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        conversionRateNumerator: dydxConversionRateNumerator,
        conversionRateDenominator: dydxConversionRateDenominator,
    };
    const defaultWithdrawAction = {
        actionType: DydxBridgeActionType.Withdraw as number,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        conversionRateNumerator: constants.ZERO_AMOUNT,
        conversionRateDenominator: constants.ZERO_AMOUNT,
    };
    const bridgeData = {
        accountNumbers: [new BigNumber(0)],
        actions: [defaultDepositAction, defaultWithdrawAction],
    };

    before(async () => {
        // Deploy contracts
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
        });
        testContract = await deployDydxBridgeAsync(deployment, env);
        const encodedBridgeData = dydxBridgeDataEncoder.encode({ bridgeData });
        testTokenAddress = await testContract.getTestToken().callAsync();
        dydxBridgeProxyAssetData = deployment.assetDataEncoder
            .ERC20Bridge(testTokenAddress, testContract.address, encodedBridgeData)
            .getABIEncodedTransactionData();
        [makerToken, takerToken] = deployment.tokens.erc20;

        // Configure default order parameters.
        orderConfig = {
            makerAssetAmount: toBaseUnitAmount(1),
            takerAssetAmount: toBaseUnitAmount(1),
            makerAssetData: deployment.assetDataEncoder.ERC20Token(makerToken.address).getABIEncodedTransactionData(),
            takerAssetData: deployment.assetDataEncoder.ERC20Token(takerToken.address).getABIEncodedTransactionData(),
            // Not important for this test.
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerFeeAssetData: deployment.assetDataEncoder
                .ERC20Token(makerToken.address)
                .getABIEncodedTransactionData(),
            takerFeeAssetData: deployment.assetDataEncoder
                .ERC20Token(takerToken.address)
                .getABIEncodedTransactionData(),
            makerFee: toBaseUnitAmount(1),
            takerFee: toBaseUnitAmount(1),
        };

        // Configure maker.
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig,
        });
        await maker.configureERC20TokenAsync(makerToken, deployment.assetProxies.erc20Proxy.address);

        // Configure taker.
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
        interface DydxFillResults {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            amountDepositedIntoDydx: BigNumber;
            amountWithdrawnFromDydx: BigNumber;
        }
        const fillOrder = async (
            signedOrder: SignedOrder,
            customTakerAssetFillAmount?: BigNumber,
        ): Promise<DydxFillResults> => {
            // Fill order
            const takerAssetFillAmount =
                customTakerAssetFillAmount !== undefined ? customTakerAssetFillAmount : signedOrder.takerAssetAmount;
            const tx = await taker.fillOrderAsync(signedOrder, takerAssetFillAmount);

            // Extract values from fill event.
            // tslint:disable no-unnecessary-type-assertion
            const fillEvent = _.find(tx.logs, log => {
                return (log as any).event === 'Fill';
            }) as LogWithDecodedArgs<DecodedLogArgs>;

            // Extract amount deposited into dydx from maker.
            const dydxDepositEvent = _.find(tx.logs, log => {
                return (
                    (log as any).event === 'OperateAction' &&
                    (log as any).args.actionType === DydxBridgeActionType.Deposit
                );
            }) as LogWithDecodedArgs<DecodedLogArgs>;

            // Extract amount withdrawn from dydx to taker.
            const dydxWithdrawEvent = _.find(tx.logs, log => {
                return (
                    (log as any).event === 'OperateAction' &&
                    (log as any).args.actionType === DydxBridgeActionType.Withdraw
                );
            }) as LogWithDecodedArgs<DecodedLogArgs>;

            // Return values of interest for assertions.
            return {
                makerAssetFilledAmount: fillEvent.args.makerAssetFilledAmount,
                takerAssetFilledAmount: fillEvent.args.takerAssetFilledAmount,
                makerFeePaid: fillEvent.args.makerFeePaid,
                takerFeePaid: fillEvent.args.takerFeePaid,
                amountDepositedIntoDydx: dydxDepositEvent.args.amountValue,
                amountWithdrawnFromDydx: dydxWithdrawEvent.args.amountValue,
            };
        };
        it('should successfully fill a dydx order (DydxBridge used in makerAssetData)', async () => {
            const signedOrder = await maker.signOrderAsync({
                // Invert the dydx conversion rate when using the bridge in the makerAssetData.
                makerAssetData: dydxBridgeProxyAssetData,
                makerAssetAmount: dydxConversionRateDenominator,
                takerAssetAmount: dydxConversionRateNumerator,
            });
            const dydxFillResults = await fillOrder(signedOrder);
            expect(
                dydxFillResults.makerAssetFilledAmount,
                'makerAssetFilledAmount should equal amountWithdrawnFromDydx',
            ).to.bignumber.equal(dydxFillResults.amountWithdrawnFromDydx);
            expect(
                dydxFillResults.takerAssetFilledAmount,
                'takerAssetFilledAmount should equal amountDepositedIntoDydx',
            ).to.bignumber.equal(dydxFillResults.amountDepositedIntoDydx);
        });
        it('should successfully fill a dydx order (DydxBridge used in takerAssetData)', async () => {
            const signedOrder = await maker.signOrderAsync({
                // Match the dydx conversion rate when using the bridge in the takerAssetData.
                takerAssetData: dydxBridgeProxyAssetData,
                makerAssetAmount: dydxConversionRateNumerator,
                takerAssetAmount: dydxConversionRateDenominator,
            });
            const dydxFillResults = await fillOrder(signedOrder);
            expect(
                dydxFillResults.makerAssetFilledAmount,
                'makerAssetFilledAmount should equal amountDepositedIntoDydx',
            ).to.bignumber.equal(dydxFillResults.amountDepositedIntoDydx);
            expect(
                dydxFillResults.takerAssetFilledAmount,
                'takerAssetFilledAmount should equal amountWithdrawnFromDydx',
            ).to.bignumber.equal(dydxFillResults.amountWithdrawnFromDydx);
        });
        it('should successfully fill a dydx order (DydxBridge used in makerFeeAssetData)', async () => {
            const signedOrder = await maker.signOrderAsync({
                // Invert the dydx conversion rate when using the bridge in the makerFeeAssetData.
                makerFeeAssetData: dydxBridgeProxyAssetData,
                makerFee: dydxConversionRateDenominator,
                takerFee: dydxConversionRateNumerator,
            });
            const dydxFillResults = await fillOrder(signedOrder);
            expect(
                dydxFillResults.makerFeePaid,
                'makerFeePaid should equal amountWithdrawnFromDydx',
            ).to.bignumber.equal(dydxFillResults.amountWithdrawnFromDydx);
            expect(
                dydxFillResults.takerFeePaid,
                'takerFeePaid should equal amountDepositedIntoDydx',
            ).to.bignumber.equal(dydxFillResults.amountDepositedIntoDydx);
        });
        it('should successfully fill a dydx order (DydxBridge used in takerFeeAssetData)', async () => {
            const signedOrder = await maker.signOrderAsync({
                // Match the dydx conversion rate when using the bridge in the takerFeeAssetData.
                takerFeeAssetData: dydxBridgeProxyAssetData,
                makerFee: dydxConversionRateNumerator,
                takerFee: dydxConversionRateDenominator,
            });
            const dydxFillResults = await fillOrder(signedOrder);
            expect(
                dydxFillResults.makerFeePaid,
                'makerFeePaid should equal amountDepositedIntoDydx',
            ).to.bignumber.equal(dydxFillResults.amountDepositedIntoDydx);
            expect(
                dydxFillResults.takerFeePaid,
                'takerFeePaid should equal amountWithdrawnFromDydx',
            ).to.bignumber.equal(dydxFillResults.amountWithdrawnFromDydx);
        });
        it('should partially fill a dydx order (DydxBridge used in makerAssetData)', async () => {
            const signedOrder = await maker.signOrderAsync({
                // Invert the dydx conversion rate when using the bridge in the makerAssetData.
                makerAssetData: dydxBridgeProxyAssetData,
                makerAssetAmount: dydxConversionRateDenominator,
                takerAssetAmount: dydxConversionRateNumerator,
            });
            const dydxFillResults = await fillOrder(signedOrder, signedOrder.takerAssetAmount.div(2));
            expect(
                dydxFillResults.makerAssetFilledAmount,
                'makerAssetFilledAmount should equal amountWithdrawnFromDydx',
            ).to.bignumber.equal(dydxFillResults.amountWithdrawnFromDydx);
            expect(
                dydxFillResults.takerAssetFilledAmount,
                'takerAssetFilledAmount should equal amountDepositedIntoDydx',
            ).to.bignumber.equal(dydxFillResults.amountDepositedIntoDydx);
        });
        it('should revert in DydxBridge when there is a rounding error', async () => {
            // This order will not trigger the rounding error in the Exchange,
            // but will trigger one in the DydxBridge.
            const badDepositAction = {
                ...defaultDepositAction,
                conversionRateNumerator: new BigNumber(5318),
                conversionRateDenominator: new BigNumber(47958),
            };
            const badBridgeData = {
                accountNumbers: [new BigNumber(0)],
                actions: [badDepositAction],
            };
            const encodedBridgeData = dydxBridgeDataEncoder.encode({ bridgeData: badBridgeData });
            const badDydxBridgeProxyAssetData = deployment.assetDataEncoder
                .ERC20Bridge(testTokenAddress, testContract.address, encodedBridgeData)
                .getABIEncodedTransactionData();
            const signedOrder = await maker.signOrderAsync({
                makerAssetData: badDydxBridgeProxyAssetData,
                makerAssetAmount: badDepositAction.conversionRateDenominator,
                takerAssetAmount: badDepositAction.conversionRateNumerator,
            });
            const takerAssetFillAmount = new BigNumber(998);

            // Compute expected error.
            const target = takerAssetFillAmount
                .multipliedBy(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const expectedAssetProxyError = new LibMathRevertErrors.RoundingError(
                signedOrder.takerAssetAmount,
                signedOrder.makerAssetAmount,
                target,
            );

            // Call fillOrder and assert the rounding error generated by the DydxBridge.
            const txPromise = taker.fillOrderAsync(signedOrder, takerAssetFillAmount);
            let assetProxyError;
            try {
                await txPromise.catch();
            } catch (e) {
                assetProxyError = RevertError.decode(e.values.errorData);
            }
            expect(assetProxyError).to.deep.equal(expectedAssetProxyError);
        });
    });
});
