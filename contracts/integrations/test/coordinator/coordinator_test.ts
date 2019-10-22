import { CoordinatorContract, SignedCoordinatorApproval } from '@0x/contracts-coordinator';
import {
    BlockchainBalanceStore,
    LocalBalanceStore,
    constants as exchangeConstants,
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    exchangeDataEncoder,
    ExchangeEvents,
    ExchangeFillEventArgs,
    ExchangeFunctionName,
} from '@0x/contracts-exchange';
import { blockchainTests, expect, hexConcat, hexSlice, verifyEvents } from '@0x/contracts-test-utils';
import { assetDataUtils, CoordinatorRevertErrors, orderHashUtils, transactionHashUtils } from '@0x/order-utils';
import { SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor, actorAddressesByName, FeeRecipient, Maker } from '../actors';
import { deployCoordinatorAsync } from './deploy_coordinator';
import { DeploymentManager } from '../utils/deployment_manager';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Coordinator integration tests', env => {
    let deployment: DeploymentManager;
    let coordinator: CoordinatorContract;
    let balanceStore: BlockchainBalanceStore;

    let maker: Maker;
    let taker: Actor;
    let feeRecipient: FeeRecipient;

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 4,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        coordinator = await deployCoordinatorAsync(deployment, env);

        const [makerToken, takerToken, makerFeeToken, takerFeeToken] = deployment.tokens.erc20;

        taker = new Actor({ name: 'Taker', deployment });
        feeRecipient = new FeeRecipient({
            name: 'Fee recipient',
            deployment,
            verifyingContract: coordinator,
        });
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: {
                senderAddress: coordinator.address,
                feeRecipientAddress: feeRecipient.address,
                makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
                makerFeeAssetData: assetDataUtils.encodeERC20AssetData(makerFeeToken.address),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(takerFeeToken.address),
            },
        });

        taker.configureERC20TokenAsync(takerToken);
        taker.configureERC20TokenAsync(takerFeeToken);
        taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        maker.configureERC20TokenAsync(makerToken);
        maker.configureERC20TokenAsync(makerFeeToken);

        balanceStore = new BlockchainBalanceStore(
            {
                ...actorAddressesByName([maker, taker, feeRecipient]),
                Coordinator: coordinator.address,
                StakingProxy: deployment.staking.stakingProxy.address,
            },
            { erc20: { makerToken, takerToken, makerFeeToken, takerFeeToken, wETH: deployment.tokens.weth } },
            {},
        );
    });

    function simulateFills(
        orders: SignedOrder[],
        txReceipt: TransactionReceiptWithDecodedLogs,
        msgValue: BigNumber = new BigNumber(0),
    ): LocalBalanceStore {
        const localBalanceStore = LocalBalanceStore.create(balanceStore);
        // Transaction gas cost
        localBalanceStore.burnGas(txReceipt.from, DeploymentManager.gasPrice.times(txReceipt.gasUsed));

        for (const order of orders) {
            // Taker -> Maker
            localBalanceStore.transferAsset(taker.address, maker.address, order.takerAssetAmount, order.takerAssetData);
            // Maker -> Taker
            localBalanceStore.transferAsset(maker.address, taker.address, order.makerAssetAmount, order.makerAssetData);
            // Taker -> Fee Recipient
            localBalanceStore.transferAsset(
                taker.address,
                feeRecipient.address,
                order.takerFee,
                order.takerFeeAssetData,
            );
            // Maker -> Fee Recipient
            localBalanceStore.transferAsset(
                maker.address,
                feeRecipient.address,
                order.makerFee,
                order.makerFeeAssetData,
            );

            // Protocol fee
            if (msgValue.isGreaterThanOrEqualTo(DeploymentManager.protocolFee)) {
                localBalanceStore.sendEth(
                    txReceipt.from,
                    deployment.staking.stakingProxy.address,
                    DeploymentManager.protocolFee,
                );
                msgValue = msgValue.minus(DeploymentManager.protocolFee);
            } else {
                localBalanceStore.transferAsset(
                    taker.address,
                    deployment.staking.stakingProxy.address,
                    DeploymentManager.protocolFee,
                    assetDataUtils.encodeERC20AssetData(deployment.tokens.weth.address),
                );
            }
        }

        return localBalanceStore;
    }

    function expectedFillEvent(order: SignedOrder): ExchangeFillEventArgs {
        return {
            makerAddress: order.makerAddress,
            takerAddress: taker.address,
            senderAddress: order.senderAddress,
            feeRecipientAddress: order.feeRecipientAddress,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            makerFeeAssetData: order.makerFeeAssetData,
            takerFeeAssetData: order.takerFeeAssetData,
            makerAssetFilledAmount: order.makerAssetAmount,
            takerAssetFilledAmount: order.takerAssetAmount,
            makerFeePaid: order.makerFee,
            takerFeePaid: order.takerFee,
            protocolFeePaid: DeploymentManager.protocolFee,
            orderHash: orderHashUtils.getOrderHashHex(order),
        };
    }

    describe('single order fills', () => {
        let order: SignedOrder;
        let data: string;
        let transaction: SignedZeroExTransaction;
        let approval: SignedCoordinatorApproval;

        for (const fnName of exchangeConstants.SINGLE_FILL_FN_NAMES) {
            before(async () => {
                order = await maker.signOrderAsync();
                data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                transaction = await taker.signTransactionAsync({
                    data,
                    gasPrice: DeploymentManager.gasPrice,
                });
                approval = feeRecipient.signCoordinatorApproval(transaction, taker.address);
            });

            it(`${fnName} should fill the order with a signed approval`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    taker.address,
                    transaction.signature,
                    [approval.signature],
                    { from: taker.address, value: DeploymentManager.protocolFee },
                );

                const expectedBalances = simulateFills([order], txReceipt, DeploymentManager.protocolFee);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (eth protocol fee, no refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipient.address,
                    transaction.signature,
                    [],
                    { from: feeRecipient.address, value: DeploymentManager.protocolFee },
                );

                const expectedBalances = simulateFills([order], txReceipt, DeploymentManager.protocolFee);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (eth protocol fee, refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipient.address,
                    transaction.signature,
                    [],
                    { from: feeRecipient.address, value: DeploymentManager.protocolFee.plus(1) },
                );

                const expectedBalances = simulateFills([order], txReceipt, DeploymentManager.protocolFee.plus(1));
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (weth protocol fee, no refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipient.address,
                    transaction.signature,
                    [],
                    { from: feeRecipient.address },
                );

                const expectedBalances = simulateFills([order], txReceipt);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (weth protocol fee, refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipient.address,
                    transaction.signature,
                    [],
                    { from: feeRecipient.address, value: new BigNumber(1) },
                );

                const expectedBalances = simulateFills([order], txReceipt, new BigNumber(1));
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should revert with no approval signature`, async () => {
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                const tx = coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    taker.address,
                    transaction.signature,
                    [],
                    { from: taker.address, value: DeploymentManager.protocolFee },
                );

                const expectedError = new CoordinatorRevertErrors.InvalidApprovalSignatureError(
                    transactionHash,
                    feeRecipient.address,
                );
                return expect(tx).to.revertWith(expectedError);
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const approvalSignature = hexConcat(
                    hexSlice(approval.signature, 0, 2),
                    '0xFFFFFFFF',
                    hexSlice(approval.signature, 6),
                );
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                const tx = coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    taker.address,
                    transaction.signature,
                    [approvalSignature],
                    { from: taker.address, value: DeploymentManager.protocolFee },
                );

                const expectedError = new CoordinatorRevertErrors.InvalidApprovalSignatureError(
                    transactionHash,
                    feeRecipient.address,
                );
                return expect(tx).to.revertWith(expectedError);
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const tx = coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    taker.address,
                    transaction.signature,
                    [approval.signature],
                    { from: maker.address, value: DeploymentManager.protocolFee },
                );

                const expectedError = new CoordinatorRevertErrors.InvalidOriginError(taker.address);
                return expect(tx).to.revertWith(expectedError);
            });
        }
    });
    describe('batch order fills', () => {
        let orders: SignedOrder[];
        let data: string;
        let transaction: SignedZeroExTransaction;
        let approval: SignedCoordinatorApproval;

        for (const fnName of [...exchangeConstants.MARKET_FILL_FN_NAMES, ...exchangeConstants.BATCH_FILL_FN_NAMES]) {
            before(async () => {
                orders = [await maker.signOrderAsync(), await maker.signOrderAsync()];
                data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                transaction = await taker.signTransactionAsync({
                    data,
                    gasPrice: DeploymentManager.gasPrice,
                });
                approval = feeRecipient.signCoordinatorApproval(transaction, taker.address);
            });

            it(`${fnName} should fill the orders with a signed approval`, async () => {
                await balanceStore.updateBalancesAsync();
                const value = DeploymentManager.protocolFee.times(orders.length);
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    taker.address,
                    transaction.signature,
                    [approval.signature],
                    { from: taker.address, value },
                );

                const expectedBalances = simulateFills(orders, txReceipt, value);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, orders.map(order => expectedFillEvent(order)), ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the orders if called by approver (eth fee, no refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const value = DeploymentManager.protocolFee.times(orders.length);
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipient.address,
                    transaction.signature,
                    [],
                    { from: feeRecipient.address, value },
                );

                const expectedBalances = simulateFills(orders, txReceipt, value);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, orders.map(order => expectedFillEvent(order)), ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the orders if called by approver (mixed fees, refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const value = DeploymentManager.protocolFee.plus(1);
                const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipient.address,
                    transaction.signature,
                    [],
                    { from: feeRecipient.address, value },
                );

                const expectedBalances = simulateFills(orders, txReceipt, value);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, orders.map(order => expectedFillEvent(order)), ExchangeEvents.Fill);
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const approvalSignature = hexConcat(
                    hexSlice(approval.signature, 0, 2),
                    '0xFFFFFFFF',
                    hexSlice(approval.signature, 6),
                );
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                const tx = coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    taker.address,
                    transaction.signature,
                    [approvalSignature],
                    { from: taker.address, value: DeploymentManager.protocolFee.times(orders.length) },
                );
                const expectedError = new CoordinatorRevertErrors.InvalidApprovalSignatureError(
                    transactionHash,
                    feeRecipient.address,
                );
                return expect(tx).to.revertWith(expectedError);
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const tx = coordinator.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    taker.address,
                    transaction.signature,
                    [approval.signature],
                    { from: maker.address, value: DeploymentManager.protocolFee.times(orders.length) },
                );
                const expectedError = new CoordinatorRevertErrors.InvalidOriginError(taker.address);
                return expect(tx).to.revertWith(expectedError);
            });
        }
    });
    describe('cancels', () => {
        function expectedCancelEvent(order: SignedOrder): ExchangeCancelEventArgs {
            return {
                makerAddress: order.makerAddress,
                senderAddress: order.senderAddress,
                feeRecipientAddress: order.feeRecipientAddress,
                makerAssetData: order.makerAssetData,
                takerAssetData: order.takerAssetData,
                orderHash: orderHashUtils.getOrderHashHex(order),
            };
        }

        it('cancelOrder call should be successful without an approval', async () => {
            const order = await maker.signOrderAsync();
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order]);
            const transaction = await maker.signTransactionAsync({
                data,
                gasPrice: DeploymentManager.gasPrice,
            });
            const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                transaction,
                maker.address,
                transaction.signature,
                [],
                { from: maker.address },
            );

            verifyEvents(txReceipt, [expectedCancelEvent(order)], ExchangeEvents.Cancel);
        });
        it('batchCancelOrders call should be successful without an approval', async () => {
            const orders = [await maker.signOrderAsync(), await maker.signOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.BatchCancelOrders, orders);
            const transaction = await maker.signTransactionAsync({
                data,
                gasPrice: DeploymentManager.gasPrice,
            });
            const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                transaction,
                maker.address,
                transaction.signature,
                [],
                { from: maker.address },
            );

            verifyEvents(txReceipt, orders.map(order => expectedCancelEvent(order)), ExchangeEvents.Cancel);
        });
        it('cancelOrdersUpTo call should be successful without an approval', async () => {
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrdersUpTo, []);
            const transaction = await maker.signTransactionAsync({
                data,
                gasPrice: DeploymentManager.gasPrice,
            });
            const txReceipt = await coordinator.executeTransaction.awaitTransactionSuccessAsync(
                transaction,
                maker.address,
                transaction.signature,
                [],
                { from: maker.address },
            );

            const expectedEvent: ExchangeCancelUpToEventArgs = {
                makerAddress: maker.address,
                orderSenderAddress: coordinator.address,
                orderEpoch: new BigNumber(1),
            };
            verifyEvents(txReceipt, [expectedEvent], ExchangeEvents.CancelUpTo);
        });
    });
});
// tslint:disable:max-file-line-count
