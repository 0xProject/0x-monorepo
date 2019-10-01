import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    artifacts as exchangeArtifacts,
    constants as exchangeConstants,
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeContract,
    exchangeDataEncoder,
    ExchangeEvents,
    ExchangeFillEventArgs,
    ExchangeFunctionName,
} from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    getLatestBlockTimestampAsync,
    OrderFactory,
    TransactionFactory,
} from '@0x/contracts-test-utils';
import { assetDataUtils, CoordinatorRevertErrors, orderHashUtils, transactionHashUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { ApprovalFactory, artifacts, CoordinatorContract } from '../src';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Coordinator tests', env => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20Proxy: ERC20ProxyContract;
    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let makerFeeToken: DummyERC20TokenContract;
    let coordinatorContract: CoordinatorContract;
    let exchange: ExchangeContract;

    let erc20Wrapper: ERC20Wrapper;
    let orderFactory: OrderFactory;
    let takerTransactionFactory: TransactionFactory;
    let makerTransactionFactory: TransactionFactory;
    let approvalFactory: ApprovalFactory;

    // const GAS_PRICE = new BigNumber(env.txDefaults.gasPrice || constants.DEFAULT_GAS_PRICE);
    // const PROTOCOL_FEE_MULTIPLIER = new BigNumber(150);
    // const PROTOCOL_FEE = GAS_PRICE.times(PROTOCOL_FEE_MULTIPLIER);
    const PROTOCOL_FEE = new BigNumber(0);

    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        erc20Wrapper = new ERC20Wrapper(env.provider, usedAddresses, owner);
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, makerFeeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(chainId),
        );

        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            exchange.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(
            erc20Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        coordinatorContract = await CoordinatorContract.deployFrom0xArtifactAsync(
            artifacts.Coordinator,
            env.provider,
            env.txDefaults,
            { ...exchangeArtifacts, ...artifacts },
            exchange.address,
            new BigNumber(chainId),
        );

        // Configure order defaults
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            senderAddress: coordinatorContract.address,
            makerAddress,
            takerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenB.address),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(makerFeeToken.address),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(makerFeeToken.address),
            exchangeAddress: exchange.address,
            chainId,
        };
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        const feeRecipientPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(feeRecipientAddress)];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        makerTransactionFactory = new TransactionFactory(makerPrivateKey, exchange.address, chainId);
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchange.address, chainId);
        approvalFactory = new ApprovalFactory(feeRecipientPrivateKey, coordinatorContract.address);
    });

    function verifyEvents<TEventArgs>(
        txReceipt: TransactionReceiptWithDecodedLogs,
        expectedEvents: TEventArgs[],
        eventName: string,
    ): void {
        const logs = filterLogsToArguments<TEventArgs>(txReceipt.logs, eventName);
        expect(logs.length).to.eq(expectedEvents.length);
        logs.forEach((log, index) => {
            expect(log).to.deep.equal(expectedEvents[index]);
        });
    }

    function expectedFillEvent(order: SignedOrder): ExchangeFillEventArgs {
        return {
            makerAddress: order.makerAddress,
            feeRecipientAddress: order.feeRecipientAddress,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            makerFeeAssetData: order.makerFeeAssetData,
            takerFeeAssetData: order.takerFeeAssetData,
            takerAddress: order.takerAddress,
            senderAddress: order.senderAddress,
            makerAssetFilledAmount: order.makerAssetAmount,
            takerAssetFilledAmount: order.takerAssetAmount,
            makerFeePaid: order.makerFee,
            takerFeePaid: order.takerFee,
            protocolFeePaid: PROTOCOL_FEE,
            orderHash: orderHashUtils.getOrderHashHex(order),
        };
    }

    function expectedCancelEvent(order: SignedOrder): ExchangeCancelEventArgs {
        return {
            makerAddress: order.makerAddress,
            feeRecipientAddress: order.feeRecipientAddress,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            senderAddress: order.senderAddress,
            orderHash: orderHashUtils.getOrderHashHex(order),
        };
    }

    describe('single order fills', () => {
        for (const fnName of exchangeConstants.SINGLE_FILL_FN_NAMES) {
            it(`${fnName} should fill the order with a signed approval`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );
                const transactionReceipt = await coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: takerAddress },
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );

                verifyEvents(transactionReceipt, [expectedFillEvent(orders[0])], ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the order if called by approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipientAddress,
                    transaction.signature,
                    [],
                    [],
                    { from: feeRecipientAddress },
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                verifyEvents(transactionReceipt, [expectedFillEvent(orders[0])], ExchangeEvents.Fill);
            });
            it(`${fnName} should revert with no approval signature`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const tx = coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [],
                    [],
                    {
                        from: takerAddress,
                        gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                    },
                );

                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                expect(tx).to.revertWith(
                    new CoordinatorRevertErrors.InvalidApprovalSignatureError(transactionHash, feeRecipientAddress),
                );
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );
                const signature = `${approval.signature.slice(0, 4)}FFFFFFFF${approval.signature.slice(12)}`;
                const tx = coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [signature],
                    { from: takerAddress },
                );

                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                expect(tx).to.revertWith(
                    new CoordinatorRevertErrors.InvalidApprovalSignatureError(transactionHash, feeRecipientAddress),
                );
            });
            it(`${fnName} should revert with an expired approval`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).minus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );

                const tx = coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: takerAddress },
                );

                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                expect(tx).to.revertWith(
                    new CoordinatorRevertErrors.ApprovalExpiredError(transactionHash, approvalExpirationTimeSeconds),
                );
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );

                const tx = coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: owner },
                );
                expect(tx).to.revertWith(new CoordinatorRevertErrors.InvalidOriginError(takerAddress));
            });
        }
    });
    describe('batch order fills', () => {
        for (const fnName of [...exchangeConstants.MARKET_FILL_FN_NAMES, ...exchangeConstants.BATCH_FILL_FN_NAMES]) {
            it(`${fnName} should fill the orders with a signed approval`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );
                const transactionReceipt = await coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: takerAddress, gas: constants.MAX_EXECUTE_TRANSACTION_GAS },
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );

                const expectedEvents = orders.map(order => expectedFillEvent(order));
                verifyEvents(transactionReceipt, expectedEvents, ExchangeEvents.Fill);
            });
            it(`${fnName} should fill the orders if called by approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    feeRecipientAddress,
                    transaction.signature,
                    [],
                    [],
                    { from: feeRecipientAddress, gas: constants.MAX_EXECUTE_TRANSACTION_GAS },
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );

                const expectedEvents = orders.map(order => expectedFillEvent(order));
                verifyEvents(transactionReceipt, expectedEvents, ExchangeEvents.Fill);
            });
            it(`${fnName} should revert with an invalid approval signature`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );
                const signature = `${approval.signature.slice(0, 4)}FFFFFFFF${approval.signature.slice(12)}`;
                const tx = coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [signature],
                    { from: takerAddress },
                );

                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                expect(tx).to.revertWith(
                    new CoordinatorRevertErrors.InvalidApprovalSignatureError(transactionHash, feeRecipientAddress),
                );
            });
            it(`${fnName} should revert with an expired approval`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).minus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );
                const tx = coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: takerAddress },
                );

                const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
                expect(tx).to.revertWith(
                    new CoordinatorRevertErrors.ApprovalExpiredError(transactionHash, approvalExpirationTimeSeconds),
                );
            });
            it(`${fnName} should revert if not called by tx signer or approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory.newSignedApproval(
                    transaction,
                    takerAddress,
                    approvalExpirationTimeSeconds,
                );

                const tx = coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                    transaction,
                    takerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: owner },
                );
                expect(tx).to.revertWith(new CoordinatorRevertErrors.InvalidOriginError(takerAddress));
            });
        }
    });
    describe('cancels', () => {
        it('cancelOrder call should be successful without an approval', async () => {
            const orders = [await orderFactory.newSignedOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, orders);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            const transactionReceipt = await coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                transaction,
                makerAddress,
                transaction.signature,
                [],
                [],
                {
                    from: makerAddress,
                },
            );
            verifyEvents(transactionReceipt, [expectedCancelEvent(orders[0])], ExchangeEvents.Cancel);
        });
        it('batchCancelOrders call should be successful without an approval', async () => {
            const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.BatchCancelOrders, orders);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            const transactionReceipt = await coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                transaction,
                makerAddress,
                transaction.signature,
                [],
                [],
                {
                    from: makerAddress,
                },
            );
            const expectedEvents = orders.map(order => expectedCancelEvent(order));
            verifyEvents(transactionReceipt, expectedEvents, ExchangeEvents.Cancel);
        });
        it('cancelOrdersUpTo call should be successful without an approval', async () => {
            const targetEpoch = constants.ZERO_AMOUNT;
            const data = exchange.cancelOrdersUpTo.getABIEncodedTransactionData(targetEpoch);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            const transactionReceipt = await coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
                transaction,
                makerAddress,
                transaction.signature,
                [],
                [],
                {
                    from: makerAddress,
                },
            );
            const expectedEvent: ExchangeCancelUpToEventArgs = {
                makerAddress,
                orderSenderAddress: coordinatorContract.address,
                orderEpoch: targetEpoch.plus(1),
            };
            verifyEvents(transactionReceipt, [expectedEvent], ExchangeEvents.CancelUpTo);
        });
    });
});
// tslint:disable:max-file-line-count
