import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
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
    TestProtocolFeeCollectorContract,
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

    const GAS_PRICE = new BigNumber(env.txDefaults.gasPrice || constants.DEFAULT_GAS_PRICE);
    const PROTOCOL_FEE_MULTIPLIER = new BigNumber(150);
    const PROTOCOL_FEE = GAS_PRICE.times(PROTOCOL_FEE_MULTIPLIER);

    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        // Deploy Exchange
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(chainId),
        );

        // Set up ERC20
        erc20Wrapper = new ERC20Wrapper(env.provider, usedAddresses, owner);
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, makerFeeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, { from: owner });
        await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, { from: owner });

        // Set up WETH
        const wethContract = await WETH9Contract.deployFrom0xArtifactAsync(
            erc20Artifacts.WETH9,
            env.provider,
            env.txDefaults,
            {},
        );
        const weth = new DummyERC20TokenContract(wethContract.address, env.provider);
        erc20Wrapper.addDummyTokenContract(weth);
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        // Set up Protocol Fee Collector
        const protocolFeeCollector = await TestProtocolFeeCollectorContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.TestProtocolFeeCollector,
            env.provider,
            env.txDefaults,
            {},
            weth.address,
        );
        await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(PROTOCOL_FEE_MULTIPLIER);
        await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(protocolFeeCollector.address);
        for (const account of usedAddresses) {
            await wethContract.deposit.awaitTransactionSuccessAsync({
                from: account,
                value: constants.ONE_ETHER,
            });
            await wethContract.approve.awaitTransactionSuccessAsync(
                protocolFeeCollector.address,
                constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                {
                    from: account,
                },
            );
        }

        // Deploy Coordinator
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
            takerAddress,
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
            protocolFeePaid: PROTOCOL_FEE,
            orderHash: orderHashUtils.getOrderHashHex(order),
        };
    }

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
                    { from: takerAddress, value: PROTOCOL_FEE },
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
                    { from: feeRecipientAddress, value: PROTOCOL_FEE },
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
                        value: PROTOCOL_FEE,
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
                    { from: takerAddress, value: PROTOCOL_FEE },
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
                    { from: takerAddress, value: PROTOCOL_FEE },
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
                    { from: owner, value: PROTOCOL_FEE },
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
                    {
                        from: takerAddress,
                        gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                        value: PROTOCOL_FEE.times(orders.length),
                    },
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
                    {
                        from: feeRecipientAddress,
                        gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                        value: PROTOCOL_FEE.times(orders.length),
                    },
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
                    { from: takerAddress, value: PROTOCOL_FEE.times(orders.length) },
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
                    { from: takerAddress, value: PROTOCOL_FEE.times(orders.length) },
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
                    { from: owner, value: PROTOCOL_FEE.times(orders.length) },
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
