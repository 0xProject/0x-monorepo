import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    artifacts as exchangeArtifacts,
    constants as exchangeConstants,
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeContract,
    exchangeDataEncoder,
    ExchangeFillEventArgs,
    ExchangeFunctionName,
} from '@0x/contracts-exchange';
import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    getLatestBlockTimestampAsync,
    OrderFactory,
    provider,
    TransactionFactory,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

import { ApprovalFactory, artifacts, CoordinatorContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
web3Wrapper.abiDecoder.addABI(exchangeArtifacts.Exchange.compilerOutput.abi);
// tslint:disable:no-unnecessary-type-assertion
describe('Coordinator tests', () => {
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

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        chainId = await providerUtils.getChainIdAsync(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts.slice(0, 4));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, makerFeeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            provider,
            txDefaults,
            new BigNumber(chainId),
        );

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        await web3Wrapper.awaitTransactionSuccessAsync(
            await exchange.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, { from: owner }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        coordinatorContract = await CoordinatorContract.deployFrom0xArtifactAsync(
            artifacts.Coordinator,
            provider,
            txDefaults,
            artifacts,
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
            domain: {
                verifyingContractAddress: exchange.address,
                chainId,
            },
        };
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        const feeRecipientPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(feeRecipientAddress)];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        makerTransactionFactory = new TransactionFactory(makerPrivateKey, exchange.address, chainId);
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchange.address, chainId);
        approvalFactory = new ApprovalFactory(feeRecipientPrivateKey, coordinatorContract.address);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

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
                const transactionReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                    await coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: takerAddress },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const fillLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                );
                expect(fillLogs.length).to.eq(1);
                const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                expect(fillLogArgs.senderAddress).to.eq(coordinatorContract.address);
                expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fillLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
                expect(fillLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
                expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(orders[0].makerAssetAmount);
                expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(orders[0].takerAssetAmount);
                expect(fillLogArgs.makerFeePaid).to.bignumber.eq(orders[0].makerFee);
                expect(fillLogArgs.takerFeePaid).to.bignumber.eq(orders[0].takerFee);
                expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
            });
            it(`${fnName} should fill the order if called by approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                    await coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        feeRecipientAddress,
                        transaction.signature,
                        [],
                        [],
                        { from: feeRecipientAddress },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const fillLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                );
                expect(fillLogs.length).to.eq(1);
                const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                expect(fillLogArgs.senderAddress).to.eq(coordinatorContract.address);
                expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fillLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
                expect(fillLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
                expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(orders[0].makerAssetAmount);
                expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(orders[0].takerAssetAmount);
                expect(fillLogArgs.makerFeePaid).to.bignumber.eq(orders[0].makerFee);
                expect(fillLogArgs.takerFeePaid).to.bignumber.eq(orders[0].takerFee);
                expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
            });
            it(`${fnName} should revert with no approval signature`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                await expectTransactionFailedAsync(
                    coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [],
                        [],
                        {
                            from: takerAddress,
                            gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                        },
                    ),
                    RevertReason.InvalidApprovalSignature,
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
                await expectTransactionFailedAsync(
                    coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [signature],
                        { from: takerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
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
                await expectTransactionFailedAsync(
                    coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: takerAddress },
                    ),
                    RevertReason.ApprovalExpired,
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
                await expectTransactionFailedAsync(
                    coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: owner },
                    ),
                    RevertReason.InvalidOrigin,
                );
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
                const transactionReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                    await coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: takerAddress, gas: constants.MAX_EXECUTE_TRANSACTION_GAS },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const fillLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                );
                expect(fillLogs.length).to.eq(orders.length);
                orders.forEach((order, index) => {
                    const fillLogArgs = (fillLogs[index] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                    expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                    expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                    expect(fillLogArgs.senderAddress).to.eq(coordinatorContract.address);
                    expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(fillLogArgs.makerAssetData).to.eq(order.makerAssetData);
                    expect(fillLogArgs.takerAssetData).to.eq(order.takerAssetData);
                    expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(order.makerAssetAmount);
                    expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(order.takerAssetAmount);
                    expect(fillLogArgs.makerFeePaid).to.bignumber.eq(order.makerFee);
                    expect(fillLogArgs.takerFeePaid).to.bignumber.eq(order.takerFee);
                    expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order));
                });
            });
            it(`${fnName} should fill the orders if called by approver`, async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                    await coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        feeRecipientAddress,
                        transaction.signature,
                        [],
                        [],
                        { from: feeRecipientAddress, gas: constants.MAX_EXECUTE_TRANSACTION_GAS },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const fillLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                );
                expect(fillLogs.length).to.eq(orders.length);
                orders.forEach((order, index) => {
                    const fillLogArgs = (fillLogs[index] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                    expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                    expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                    expect(fillLogArgs.senderAddress).to.eq(coordinatorContract.address);
                    expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(fillLogArgs.makerAssetData).to.eq(order.makerAssetData);
                    expect(fillLogArgs.takerAssetData).to.eq(order.takerAssetData);
                    expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(order.makerAssetAmount);
                    expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(order.takerAssetAmount);
                    expect(fillLogArgs.makerFeePaid).to.bignumber.eq(order.makerFee);
                    expect(fillLogArgs.takerFeePaid).to.bignumber.eq(order.takerFee);
                    expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order));
                });
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
                await expectTransactionFailedAsync(
                    coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [signature],
                        { from: takerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
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
                await expectTransactionFailedAsync(
                    coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: takerAddress },
                    ),
                    RevertReason.ApprovalExpired,
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
                await expectTransactionFailedAsync(
                    coordinatorContract.executeTransaction.sendTransactionAsync(
                        transaction,
                        takerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: owner },
                    ),
                    RevertReason.InvalidOrigin,
                );
            });
        }
    });
    describe('cancels', () => {
        it('cancelOrder call should be successful without an approval', async () => {
            const orders = [await orderFactory.newSignedOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, orders);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            const transactionReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                await coordinatorContract.executeTransaction.sendTransactionAsync(
                    transaction,
                    makerAddress,
                    transaction.signature,
                    [],
                    [],
                    {
                        from: makerAddress,
                    },
                ),
            );
            const cancelLogs = transactionReceipt.logs.filter(
                log => (log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel',
            );
            expect(cancelLogs.length).to.eq(1);
            const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelEventArgs>).args;
            expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
            expect(cancelLogArgs.senderAddress).to.eq(coordinatorContract.address);
            expect(cancelLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
            expect(cancelLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
            expect(cancelLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
            expect(cancelLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
        });
        it('batchCancelOrders call should be successful without an approval', async () => {
            const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.BatchCancelOrders, orders);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            const transactionReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                await coordinatorContract.executeTransaction.sendTransactionAsync(
                    transaction,
                    makerAddress,
                    transaction.signature,
                    [],
                    [],
                    {
                        from: makerAddress,
                    },
                ),
            );
            const cancelLogs = transactionReceipt.logs.filter(
                log => (log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel',
            );
            expect(cancelLogs.length).to.eq(orders.length);
            orders.forEach((order, index) => {
                const cancelLogArgs = (cancelLogs[index] as LogWithDecodedArgs<ExchangeCancelEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.senderAddress).to.eq(coordinatorContract.address);
                expect(cancelLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(cancelLogArgs.makerAssetData).to.eq(order.makerAssetData);
                expect(cancelLogArgs.takerAssetData).to.eq(order.takerAssetData);
                expect(cancelLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order));
            });
        });
        it('cancelOrdersUpTo call should be successful without an approval', async () => {
            const targetEpoch = constants.ZERO_AMOUNT;
            const data = exchange.cancelOrdersUpTo.getABIEncodedTransactionData(targetEpoch);
            const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
            const transactionReceipt = await web3Wrapper.awaitTransactionSuccessAsync(
                await coordinatorContract.executeTransaction.sendTransactionAsync(
                    transaction,
                    makerAddress,
                    transaction.signature,
                    [],
                    [],
                    {
                        from: makerAddress,
                    },
                ),
            );
            const cancelLogs = transactionReceipt.logs.filter(
                log => (log as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).event === 'CancelUpTo',
            );
            expect(cancelLogs.length).to.eq(1);
            const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).args;
            expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
            expect(cancelLogArgs.orderSenderAddress).to.eq(coordinatorContract.address);
            expect(cancelLogArgs.orderEpoch).to.bignumber.eq(targetEpoch.plus(1));
        });
    });
});
// tslint:disable:max-file-line-count
