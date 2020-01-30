// tslint:disable: max-file-line-count
import { encodeERC20AssetData } from '@0x/contracts-asset-proxy';
import { exchangeDataEncoder, ExchangeRevertErrors } from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    describe,
    ExchangeFunctionName,
    expect,
    orderHashUtils,
    transactionHashUtils,
} from '@0x/contracts-test-utils';
import { SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { Actor } from '../framework/actors/base';
import { FeeRecipient } from '../framework/actors/fee_recipient';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { actorAddressesByName } from '../framework/actors/utils';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Transaction <> protocol fee integration tests', env => {
    let deployment: DeploymentManager;
    let balanceStore: BlockchainBalanceStore;

    let maker: Maker;
    let feeRecipient: FeeRecipient;
    let alice: Taker;
    let bob: Taker;
    let charlie: Taker;
    let wethless: Taker; // Used to test revert scenarios

    let order: SignedOrder; // All orders will have the same fields, modulo salt and expiration time
    let transactionA: SignedZeroExTransaction; // fillOrder transaction signed by Alice
    let transactionB: SignedZeroExTransaction; // fillOrder transaction signed by Bob
    let transactionC: SignedZeroExTransaction; // fillOrder transaction signed by Charlie

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 4,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const [makerToken, takerToken, makerFeeToken, takerFeeToken] = deployment.tokens.erc20;

        alice = new Taker({ name: 'Alice', deployment });
        bob = new Taker({ name: 'Bob', deployment });
        charlie = new Taker({ name: 'Charlie', deployment });
        wethless = new Taker({ name: 'wethless', deployment });
        feeRecipient = new FeeRecipient({
            name: 'Fee recipient',
            deployment,
        });
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: {
                feeRecipientAddress: feeRecipient.address,
                makerAssetData: encodeERC20AssetData(makerToken.address),
                takerAssetData: encodeERC20AssetData(takerToken.address),
                makerFeeAssetData: encodeERC20AssetData(makerFeeToken.address),
                takerFeeAssetData: encodeERC20AssetData(takerFeeToken.address),
            },
        });

        for (const taker of [alice, bob, charlie]) {
            await taker.configureERC20TokenAsync(takerToken);
            await taker.configureERC20TokenAsync(takerFeeToken);
            await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        }
        await wethless.configureERC20TokenAsync(takerToken);
        await wethless.configureERC20TokenAsync(takerFeeToken);
        await wethless.configureERC20TokenAsync(
            deployment.tokens.weth,
            deployment.staking.stakingProxy.address,
            constants.ZERO_AMOUNT, // wethless taker has approved the proxy, but has no weth
        );
        await maker.configureERC20TokenAsync(makerToken);
        await maker.configureERC20TokenAsync(makerFeeToken);

        balanceStore = new BlockchainBalanceStore(
            {
                ...actorAddressesByName([alice, bob, charlie, maker, feeRecipient]),
                StakingProxy: deployment.staking.stakingProxy.address,
            },
            { erc20: { makerToken, takerToken, makerFeeToken, takerFeeToken, wETH: deployment.tokens.weth } },
            {},
        );
        await balanceStore.updateBalancesAsync();

        order = await maker.signOrderAsync();
        let data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
        transactionA = await alice.signTransactionAsync({ data });

        order = await maker.signOrderAsync();
        data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
        transactionB = await bob.signTransactionAsync({ data });

        order = await maker.signOrderAsync();
        data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
        transactionC = await charlie.signTransactionAsync({ data });
    });

    after(async () => {
        Actor.reset();
    });

    const REFUND_AMOUNT = new BigNumber(1);

    function protocolFeeError(
        failedOrder: SignedOrder,
        failedTransaction: SignedZeroExTransaction,
    ): ExchangeRevertErrors.TransactionExecutionError {
        const nestedError = new ExchangeRevertErrors.PayProtocolFeeError(
            orderHashUtils.getOrderHashHex(failedOrder),
            DeploymentManager.protocolFee,
            maker.address,
            wethless.address,
            '0x',
        ).encode();
        return new ExchangeRevertErrors.TransactionExecutionError(
            transactionHashUtils.getTransactionHashHex(failedTransaction),
            nestedError,
        );
    }

    describe('executeTransaction', () => {
        const ETH_FEE_WITH_REFUND = DeploymentManager.protocolFee.plus(REFUND_AMOUNT);

        let expectedBalances: LocalBalanceStore;
        beforeEach(async () => {
            await balanceStore.updateBalancesAsync();
            expectedBalances = LocalBalanceStore.create(balanceStore);
        });
        afterEach(async () => {
            await balanceStore.updateBalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        });

        describe('Simple', () => {
            it('Alice executeTransaction => Alice fillOrder; protocol fee in ETH', async () => {
                const txReceipt = await deployment.exchange
                    .executeTransaction(transactionA, transactionA.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEE_WITH_REFUND });
                expectedBalances.simulateFills([order], alice.address, txReceipt, deployment, ETH_FEE_WITH_REFUND);
            });
            it('Alice executeTransaction => Bob fillOrder; protocol fee in ETH', async () => {
                const txReceipt = await deployment.exchange
                    .executeTransaction(transactionB, transactionB.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEE_WITH_REFUND });
                expectedBalances.simulateFills([order], bob.address, txReceipt, deployment, ETH_FEE_WITH_REFUND);
            });
            it('Alice executeTransaction => Alice fillOrder; protocol fee in wETH', async () => {
                const txReceipt = await deployment.exchange
                    .executeTransaction(transactionA, transactionA.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                expectedBalances.simulateFills([order], alice.address, txReceipt, deployment, REFUND_AMOUNT);
            });
            it('Alice executeTransaction => Bob fillOrder; protocol fee in wETH', async () => {
                const txReceipt = await deployment.exchange
                    .executeTransaction(transactionB, transactionB.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                expectedBalances.simulateFills([order], bob.address, txReceipt, deployment, REFUND_AMOUNT);
            });
            it('Alice executeTransaction => wETH-less taker fillOrder; reverts because protocol fee cannot be paid', async () => {
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const transaction = await wethless.signTransactionAsync({ data });
                const tx = deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                return expect(tx).to.revertWith(protocolFeeError(order, transaction));
            });
            it('Alice executeTransaction => Alice batchFillOrders; mixed protocol fees', async () => {
                const orders = [order, await maker.signOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchFillOrders,
                    orders,
                );
                const batchFillTransaction = await alice.signTransactionAsync({ data });
                const txReceipt = await deployment.exchange
                    .executeTransaction(batchFillTransaction, batchFillTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEE_WITH_REFUND });
                expectedBalances.simulateFills(orders, alice.address, txReceipt, deployment, ETH_FEE_WITH_REFUND);
            });
            it('Alice executeTransaction => Bob batchFillOrders; mixed protocol fees', async () => {
                const orders = [order, await maker.signOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchFillOrders,
                    orders,
                );
                const batchFillTransaction = await bob.signTransactionAsync({ data });
                const txReceipt = await deployment.exchange
                    .executeTransaction(batchFillTransaction, batchFillTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEE_WITH_REFUND });
                expectedBalances.simulateFills(orders, bob.address, txReceipt, deployment, ETH_FEE_WITH_REFUND);
            });
        });
        describe('Nested', () => {
            it('Alice executeTransaction => Alice executeTransaction => Alice fillOrder; protocol fee in ETH', async () => {
                const recursiveData = deployment.exchange
                    .executeTransaction(transactionA, transactionA.signature)
                    .getABIEncodedTransactionData();
                const recursiveTransaction = await alice.signTransactionAsync({ data: recursiveData });
                const txReceipt = await deployment.exchange
                    .executeTransaction(recursiveTransaction, recursiveTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEE_WITH_REFUND });
                expectedBalances.simulateFills([order], alice.address, txReceipt, deployment, ETH_FEE_WITH_REFUND);
            });
            it('Alice executeTransaction => Alice executeTransaction => Bob fillOrder; protocol fee in ETH', async () => {
                const recursiveData = deployment.exchange
                    .executeTransaction(transactionB, transactionB.signature)
                    .getABIEncodedTransactionData();
                const recursiveTransaction = await alice.signTransactionAsync({ data: recursiveData });
                const txReceipt = await deployment.exchange
                    .executeTransaction(recursiveTransaction, recursiveTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEE_WITH_REFUND });
                expectedBalances.simulateFills([order], bob.address, txReceipt, deployment, ETH_FEE_WITH_REFUND);
            });
            it('Alice executeTransaction => Alice executeTransaction => Alice fillOrder; protocol fee in wETH', async () => {
                const recursiveData = deployment.exchange
                    .executeTransaction(transactionA, transactionA.signature)
                    .getABIEncodedTransactionData();
                const recursiveTransaction = await alice.signTransactionAsync({ data: recursiveData });
                const txReceipt = await deployment.exchange
                    .executeTransaction(recursiveTransaction, recursiveTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                expectedBalances.simulateFills([order], alice.address, txReceipt, deployment, REFUND_AMOUNT);
            });
            it('Alice executeTransaction => Alice executeTransaction => Bob fillOrder; protocol fee in wETH', async () => {
                const recursiveData = deployment.exchange
                    .executeTransaction(transactionB, transactionB.signature)
                    .getABIEncodedTransactionData();
                const recursiveTransaction = await alice.signTransactionAsync({ data: recursiveData });
                const txReceipt = await deployment.exchange
                    .executeTransaction(recursiveTransaction, recursiveTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                expectedBalances.simulateFills([order], bob.address, txReceipt, deployment, REFUND_AMOUNT);
            });
            it('Alice executeTransaction => Alice executeTransaction => wETH-less taker fillOrder; reverts because protocol fee cannot be paid', async () => {
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const transaction = await wethless.signTransactionAsync({ data });
                const recursiveData = deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .getABIEncodedTransactionData();
                const recursiveTransaction = await alice.signTransactionAsync({ data: recursiveData });
                const tx = deployment.exchange
                    .executeTransaction(recursiveTransaction, recursiveTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                    transactionHashUtils.getTransactionHashHex(recursiveTransaction),
                    protocolFeeError(order, transaction).encode(),
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });
    });
    describe('batchExecuteTransactions', () => {
        let expectedBalances: LocalBalanceStore;
        beforeEach(async () => {
            await balanceStore.updateBalancesAsync();
            expectedBalances = LocalBalanceStore.create(balanceStore);
        });
        afterEach(async () => {
            await balanceStore.updateBalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        });

        describe('Simple', () => {
            // All orders' protocol fees paid in ETH by sender
            const ETH_FEES_WITH_REFUND = DeploymentManager.protocolFee.times(3).plus(REFUND_AMOUNT);
            // First order's protocol fee paid in ETH by sender, the other two paid in WETH by their respective takers
            const MIXED_FEES_WITH_REFUND = DeploymentManager.protocolFee.times(1).plus(REFUND_AMOUNT);

            it('Alice batchExecuteTransactions => Alice fillOrder, Bob fillOrder, Charlie fillOrder; protocol fees in ETH', async () => {
                const transactions = [transactionA, transactionB, transactionC];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [alice.address, bob.address, charlie.address],
                    txReceipt,
                    deployment,
                    ETH_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, Alice fillOrder, Charlie fillOrder; protocol fees in ETH', async () => {
                const transactions = [transactionB, transactionA, transactionC];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [bob.address, alice.address, charlie.address],
                    txReceipt,
                    deployment,
                    ETH_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, Charlie fillOrder, Alice fillOrder; protocol fees in ETH', async () => {
                const transactions = [transactionB, transactionC, transactionA];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: ETH_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [bob.address, charlie.address, alice.address],
                    txReceipt,
                    deployment,
                    ETH_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Alice fillOrder, Bob fillOrder, Charlie fillOrder; protocol fees in wETH', async () => {
                const transactions = [transactionA, transactionB, transactionC];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [alice.address, bob.address, charlie.address],
                    txReceipt,
                    deployment,
                    REFUND_AMOUNT,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, Alice fillOrder, Charlie fillOrder; protocol fees in wETH', async () => {
                const transactions = [transactionB, transactionA, transactionC];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [bob.address, alice.address, charlie.address],
                    txReceipt,
                    deployment,
                    REFUND_AMOUNT,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, Charlie fillOrder, Alice fillOrder; protocol fees in wETH', async () => {
                const transactions = [transactionB, transactionC, transactionA];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: REFUND_AMOUNT });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [bob.address, charlie.address, alice.address],
                    txReceipt,
                    deployment,
                    REFUND_AMOUNT,
                );
            });
            it('Alice batchExecuteTransactions => Alice fillOrder, Bob fillOrder, Charlie fillOrder; mixed protocol fees', async () => {
                const transactions = [transactionA, transactionB, transactionC];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [alice.address, bob.address, charlie.address],
                    txReceipt,
                    deployment,
                    MIXED_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, Alice fillOrder, Charlie fillOrder; mixed protocol fees', async () => {
                const transactions = [transactionB, transactionA, transactionC];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [bob.address, alice.address, charlie.address],
                    txReceipt,
                    deployment,
                    MIXED_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, Charlie fillOrder, Alice fillOrder; mixed protocol fees', async () => {
                const transactions = [transactionB, transactionC, transactionA];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [bob.address, charlie.address, alice.address],
                    txReceipt,
                    deployment,
                    MIXED_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Alice fillOrder, Bob fillOrder, wETH-less taker fillOrder; reverts because protocol fee cannot be paid', async () => {
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const failTransaction = await wethless.signTransactionAsync({ data });
                const transactions = [transactionA, transactionB, failTransaction];
                const signatures = transactions.map(transaction => transaction.signature);
                const tx = deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                return expect(tx).to.revertWith(protocolFeeError(order, failTransaction));
            });
        });
        describe('Nested', () => {
            // First two orders' protocol fees paid in ETH by sender, the others paid in WETH by their respective takers
            const MIXED_FEES_WITH_REFUND = DeploymentManager.protocolFee.times(2.5);

            // Alice batchExecuteTransactions => Alice fillOrder, Bob fillOrder, Charlie fillOrder
            let nestedTransaction: SignedZeroExTransaction;
            // Second fillOrder transaction signed by Bob
            let transactionB2: SignedZeroExTransaction;
            // Second fillOrder transaction signed by Charlie
            let transactionC2: SignedZeroExTransaction;

            before(async () => {
                let newOrder = await maker.signOrderAsync();
                let data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [newOrder]);
                transactionB2 = await bob.signTransactionAsync({ data });

                newOrder = await maker.signOrderAsync();
                data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [newOrder]);
                transactionC2 = await charlie.signTransactionAsync({ data });

                const transactions = [transactionA, transactionB, transactionC];
                const signatures = transactions.map(tx => tx.signature);
                const recursiveData = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .getABIEncodedTransactionData();
                nestedTransaction = await alice.signTransactionAsync({ data: recursiveData });
            });

            it('Alice executeTransaction => nested batchExecuteTransactions; mixed protocol fees', async () => {
                const txReceipt = await deployment.exchange
                    .executeTransaction(nestedTransaction, nestedTransaction.signature)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order],
                    [alice.address, bob.address, charlie.address],
                    txReceipt,
                    deployment,
                    MIXED_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => nested batchExecuteTransactions, Bob fillOrder, Charlie fillOrder; mixed protocol fees', async () => {
                const transactions = [nestedTransaction, transactionB2, transactionC2];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order, order, order],
                    [alice.address, bob.address, charlie.address, bob.address, charlie.address],
                    txReceipt,
                    deployment,
                    MIXED_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, nested batchExecuteTransactions, Charlie fillOrder; mixed protocol fees', async () => {
                const transactions = [transactionB2, nestedTransaction, transactionC2];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order, order, order],
                    [bob.address, alice.address, bob.address, charlie.address, charlie.address],
                    txReceipt,
                    deployment,
                    MIXED_FEES_WITH_REFUND,
                );
            });
            it('Alice batchExecuteTransactions => Bob fillOrder, Charlie fillOrder, nested batchExecuteTransactions; mixed protocol fees', async () => {
                const transactions = [transactionB2, transactionC2, nestedTransaction];
                const signatures = transactions.map(tx => tx.signature);
                const txReceipt = await deployment.exchange
                    .batchExecuteTransactions(transactions, signatures)
                    .awaitTransactionSuccessAsync({ from: alice.address, value: MIXED_FEES_WITH_REFUND });
                expectedBalances.simulateFills(
                    [order, order, order, order, order],
                    [bob.address, charlie.address, alice.address, bob.address, charlie.address],
                    txReceipt,
                    deployment,
                    MIXED_FEES_WITH_REFUND,
                );
            });
        });
    });
});
