import { encodeERC20AssetData } from '@0x/contracts-asset-proxy';
import { CoordinatorContract, CoordinatorRevertErrors, SignedCoordinatorApproval } from '@0x/contracts-coordinator';
import {
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    exchangeDataEncoder,
    ExchangeEvents,
    ExchangeFillEventArgs,
} from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    ExchangeFunctionName,
    expect,
    orderHashUtils,
    transactionHashUtils,
    verifyEvents,
} from '@0x/contracts-test-utils';
import { SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';

import { Actor } from '../framework/actors/base';
import { FeeRecipient } from '../framework/actors/fee_recipient';
import { Maker } from '../framework/actors/maker';
import { actorAddressesByName } from '../framework/actors/utils';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

import { deployCoordinatorAsync } from './deploy_coordinator';

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
                makerAssetData: encodeERC20AssetData(makerToken.address),
                takerAssetData: encodeERC20AssetData(takerToken.address),
                makerFeeAssetData: encodeERC20AssetData(makerFeeToken.address),
                takerFeeAssetData: encodeERC20AssetData(takerFeeToken.address),
            },
        });

        await taker.configureERC20TokenAsync(takerToken);
        await taker.configureERC20TokenAsync(takerFeeToken);
        await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        await maker.configureERC20TokenAsync(makerToken);
        await maker.configureERC20TokenAsync(makerFeeToken);

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

    after(async () => {
        Actor.reset();
    });

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

        for (const fnName of constants.SINGLE_FILL_FN_NAMES) {
            before(async () => {
                order = await maker.signOrderAsync();
                data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                transaction = await taker.signTransactionAsync({ data });
                approval = feeRecipient.signCoordinatorApproval(transaction, taker.address);
            });

            it(`${fnName} should fill the order with a signed approval`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator
                    .executeTransaction(transaction, taker.address, transaction.signature, [approval.signature])
                    .awaitTransactionSuccessAsync({ from: taker.address, value: DeploymentManager.protocolFee });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills(
                    [order],
                    taker.address,
                    txReceipt,
                    deployment,
                    DeploymentManager.protocolFee,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (eth protocol fee, no refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator
                    .executeTransaction(transaction, feeRecipient.address, transaction.signature, [])
                    .awaitTransactionSuccessAsync({ from: feeRecipient.address, value: DeploymentManager.protocolFee });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills(
                    [order],
                    taker.address,
                    txReceipt,
                    deployment,
                    DeploymentManager.protocolFee,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (eth protocol fee, refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator
                    .executeTransaction(transaction, feeRecipient.address, transaction.signature, [])
                    .awaitTransactionSuccessAsync({
                        from: feeRecipient.address,
                        value: DeploymentManager.protocolFee.plus(1),
                    });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills(
                    [order],
                    taker.address,
                    txReceipt,
                    deployment,
                    DeploymentManager.protocolFee.plus(1),
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (weth protocol fee, no refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator
                    .executeTransaction(transaction, feeRecipient.address, transaction.signature, [])
                    .awaitTransactionSuccessAsync({ from: feeRecipient.address });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills([order], taker.address, txReceipt, deployment);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver (weth protocol fee, refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const txReceipt = await coordinator
                    .executeTransaction(transaction, feeRecipient.address, transaction.signature, [])
                    .awaitTransactionSuccessAsync({ from: feeRecipient.address, value: new BigNumber(1) });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills([order], taker.address, txReceipt, deployment, new BigNumber(1));
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, [expectedFillEvent(order)], ExchangeEvents.Fill);
            });
            it(`${fnName} should revert with no approval signature`, async () => {
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                const tx = coordinator
                    .executeTransaction(transaction, taker.address, transaction.signature, [])
                    .awaitTransactionSuccessAsync({ from: taker.address, value: DeploymentManager.protocolFee });

                const expectedError = new CoordinatorRevertErrors.InvalidApprovalSignatureError(
                    transactionHash,
                    feeRecipient.address,
                );
                return expect(tx).to.revertWith(expectedError);
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const approvalSignature = hexUtils.concat(
                    hexUtils.slice(approval.signature, 0, 2),
                    '0xFFFFFFFF',
                    hexUtils.slice(approval.signature, 6),
                );
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                const tx = coordinator
                    .executeTransaction(transaction, taker.address, transaction.signature, [approvalSignature])
                    .awaitTransactionSuccessAsync({ from: taker.address, value: DeploymentManager.protocolFee });

                const expectedError = new CoordinatorRevertErrors.InvalidApprovalSignatureError(
                    transactionHash,
                    feeRecipient.address,
                );
                return expect(tx).to.revertWith(expectedError);
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const tx = coordinator
                    .executeTransaction(transaction, taker.address, transaction.signature, [approval.signature])
                    .awaitTransactionSuccessAsync({ from: maker.address, value: DeploymentManager.protocolFee });

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

        for (const fnName of [...constants.MARKET_FILL_FN_NAMES, ...constants.BATCH_FILL_FN_NAMES]) {
            before(async () => {
                orders = [await maker.signOrderAsync(), await maker.signOrderAsync()];
                data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                transaction = await taker.signTransactionAsync({ data });
                approval = feeRecipient.signCoordinatorApproval(transaction, taker.address);
            });

            it(`${fnName} should fill the orders with a signed approval`, async () => {
                await balanceStore.updateBalancesAsync();
                const value = DeploymentManager.protocolFee.times(orders.length);
                const txReceipt = await coordinator
                    .executeTransaction(transaction, taker.address, transaction.signature, [approval.signature])
                    .awaitTransactionSuccessAsync({ from: taker.address, value });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills(orders, taker.address, txReceipt, deployment, value);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, orders.map(order => expectedFillEvent(order)), ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the orders if called by approver (eth fee, no refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const value = DeploymentManager.protocolFee.times(orders.length);
                const txReceipt = await coordinator
                    .executeTransaction(transaction, feeRecipient.address, transaction.signature, [])
                    .awaitTransactionSuccessAsync({ from: feeRecipient.address, value });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills(orders, taker.address, txReceipt, deployment, value);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, orders.map(order => expectedFillEvent(order)), ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the orders if called by approver (mixed fees, refund)`, async () => {
                await balanceStore.updateBalancesAsync();
                const value = DeploymentManager.protocolFee.plus(1);
                const txReceipt = await coordinator
                    .executeTransaction(transaction, feeRecipient.address, transaction.signature, [])
                    .awaitTransactionSuccessAsync({ from: feeRecipient.address, value });

                const expectedBalances = LocalBalanceStore.create(balanceStore);
                expectedBalances.simulateFills(orders, taker.address, txReceipt, deployment, value);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
                verifyEvents(txReceipt, orders.map(order => expectedFillEvent(order)), ExchangeEvents.Fill);
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const approvalSignature = hexUtils.concat(
                    hexUtils.slice(approval.signature, 0, 2),
                    '0xFFFFFFFF',
                    hexUtils.slice(approval.signature, 6),
                );
                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                const tx = coordinator
                    .executeTransaction(transaction, taker.address, transaction.signature, [approvalSignature])
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.times(orders.length),
                    });
                const expectedError = new CoordinatorRevertErrors.InvalidApprovalSignatureError(
                    transactionHash,
                    feeRecipient.address,
                );
                return expect(tx).to.revertWith(expectedError);
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const tx = coordinator
                    .executeTransaction(transaction, taker.address, transaction.signature, [approval.signature])
                    .awaitTransactionSuccessAsync({
                        from: maker.address,
                        value: DeploymentManager.protocolFee.times(orders.length),
                    });
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
            });
            const txReceipt = await coordinator
                .executeTransaction(transaction, maker.address, transaction.signature, [])
                .awaitTransactionSuccessAsync({ from: maker.address });

            verifyEvents(txReceipt, [expectedCancelEvent(order)], ExchangeEvents.Cancel);
        });
        it('batchCancelOrders call should be successful without an approval', async () => {
            const orders = [await maker.signOrderAsync(), await maker.signOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.BatchCancelOrders, orders);
            const transaction = await maker.signTransactionAsync({
                data,
            });
            const txReceipt = await coordinator
                .executeTransaction(transaction, maker.address, transaction.signature, [])
                .awaitTransactionSuccessAsync({ from: maker.address });

            verifyEvents(txReceipt, orders.map(order => expectedCancelEvent(order)), ExchangeEvents.Cancel);
        });
        it('cancelOrdersUpTo call should be successful without an approval', async () => {
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrdersUpTo, []);
            const transaction = await maker.signTransactionAsync({
                data,
            });
            const txReceipt = await coordinator
                .executeTransaction(transaction, maker.address, transaction.signature, [])
                .awaitTransactionSuccessAsync({ from: maker.address });

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
