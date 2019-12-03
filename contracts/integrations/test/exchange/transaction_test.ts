// tslint:disable: max-file-line-count
import { IAssetDataContract } from '@0x/contracts-asset-proxy';
import {
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    exchangeDataEncoder,
    ExchangeEvents,
    ExchangeFillEventArgs,
    ExchangeRevertErrors,
    ExchangeSignatureValidatorApprovalEventArgs,
    ExchangeTransactionExecutionEventArgs,
} from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    blockchainTests,
    constants,
    describe,
    ExchangeFunctionName,
    expect,
    getLatestBlockTimestampAsync,
    orderHashUtils,
    randomAddress,
    transactionHashUtils,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { FillResults, OrderStatus, SignatureType, SignedOrder } from '@0x/types';
import { BigNumber, hexConcat, hexRandom } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import { Actor } from '../framework/actors/base';
import { FeeRecipient } from '../framework/actors/fee_recipient';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { DeploymentManager } from '../framework/deployment_manager';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Transaction integration tests', env => {
    let deployment: DeploymentManager;

    let maker: Maker;
    let takers: [Taker, Taker];
    let feeRecipient: FeeRecipient;
    let sender: Actor;

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 4,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const assetDataEncoder = new IAssetDataContract(constants.NULL_ADDRESS, env.provider);
        const [makerToken, takerToken, makerFeeToken, takerFeeToken] = deployment.tokens.erc20;

        takers = [new Taker({ name: 'Taker 1', deployment }), new Taker({ name: 'Taker 2', deployment })];
        feeRecipient = new FeeRecipient({
            name: 'Fee recipient',
            deployment,
        });
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: {
                feeRecipientAddress: feeRecipient.address,
                makerAssetData: assetDataEncoder.ERC20Token(makerToken.address).getABIEncodedTransactionData(),
                takerAssetData: assetDataEncoder.ERC20Token(takerToken.address).getABIEncodedTransactionData(),
                makerFeeAssetData: assetDataEncoder.ERC20Token(makerFeeToken.address).getABIEncodedTransactionData(),
                takerFeeAssetData: assetDataEncoder.ERC20Token(takerFeeToken.address).getABIEncodedTransactionData(),
            },
        });
        sender = new Actor({ name: 'Transaction sender', deployment });

        for (const taker of takers) {
            await taker.configureERC20TokenAsync(takerToken);
            await taker.configureERC20TokenAsync(takerFeeToken);
            await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        }
        await maker.configureERC20TokenAsync(makerToken);
        await maker.configureERC20TokenAsync(makerFeeToken);
    });

    after(async () => {
        Actor.reset();
    });

    function defaultFillEvent(order: SignedOrder): ExchangeFillEventArgs {
        return {
            makerAddress: maker.address,
            feeRecipientAddress: feeRecipient.address,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            makerFeeAssetData: order.makerFeeAssetData,
            takerFeeAssetData: order.takerFeeAssetData,
            orderHash: orderHashUtils.getOrderHashHex(order),
            takerAddress: takers[0].address,
            senderAddress: sender.address,
            makerAssetFilledAmount: order.makerAssetAmount,
            takerAssetFilledAmount: order.takerAssetAmount,
            makerFeePaid: order.makerFee,
            takerFeePaid: order.takerFee,
            protocolFeePaid: DeploymentManager.protocolFee,
        };
    }

    function defaultCancelEvent(order: SignedOrder): ExchangeCancelEventArgs {
        return {
            makerAddress: maker.address,
            feeRecipientAddress: feeRecipient.address,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            senderAddress: sender.address,
            orderHash: orderHashUtils.getOrderHashHex(order),
        };
    }

    describe('executeTransaction', () => {
        describe('general functionality', () => {
            it('should log the correct transactionHash if successfully executed', async () => {
                const order = await maker.signOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const transaction = await takers[0].signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                verifyEventsFromLogs(
                    transactionReceipt.logs,
                    [{ transactionHash: transactionHashUtils.getTransactionHashHex(transaction) }],
                    ExchangeEvents.TransactionExecution,
                );
            });
            it('should revert if the transaction is expired', async () => {
                const order = await maker.signOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const transaction = await takers[0].signTransactionAsync({
                    data,
                    expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
                });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const expectedError = new ExchangeRevertErrors.TransactionError(
                    ExchangeRevertErrors.TransactionErrorCode.Expired,
                    transactionHashHex,
                );
                const tx = deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                return expect(tx).to.revertWith(expectedError);
            });
            it('should revert if the actual gasPrice is greater than expected', async () => {
                const order = await maker.signOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const transaction = await takers[0].signTransactionAsync({ data });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const actualGasPrice = transaction.gasPrice.plus(1);
                const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                    transactionHashHex,
                    actualGasPrice,
                    transaction.gasPrice,
                );
                const tx = deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ gasPrice: actualGasPrice, from: sender.address });
                return expect(tx).to.revertWith(expectedError);
            });
            it('should revert if the actual gasPrice is less than expected', async () => {
                const order = await maker.signOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const transaction = await takers[0].signTransactionAsync({ data });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const actualGasPrice = transaction.gasPrice.minus(1);
                const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                    transactionHashHex,
                    actualGasPrice,
                    transaction.gasPrice,
                );
                const tx = deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ gasPrice: actualGasPrice, from: sender.address });
                return expect(tx).to.revertWith(expectedError);
            });
        });
        describe('fill methods', () => {
            for (const fnName of [
                ...constants.SINGLE_FILL_FN_NAMES,
                ...constants.BATCH_FILL_FN_NAMES,
                ...constants.MARKET_FILL_FN_NAMES,
            ]) {
                it(`${fnName} should revert if signature is invalid and not called by signer`, async () => {
                    const order = await maker.signOrderAsync();
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                    const transaction = await takers[0].signTransactionAsync({ data });
                    transaction.signature = hexConcat(hexRandom(65), SignatureType.EthSign);
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const expectedError = new ExchangeRevertErrors.SignatureError(
                        ExchangeRevertErrors.SignatureErrorCode.BadTransactionSignature,
                        transactionHashHex,
                        transaction.signerAddress,
                        transaction.signature,
                    );
                    const tx = deployment.exchange
                        .executeTransaction(transaction, transaction.signature)
                        .awaitTransactionSuccessAsync({ from: sender.address });
                    return expect(tx).to.revertWith(expectedError);
                });
                it(`${fnName} should be successful if signed by taker and called by sender`, async () => {
                    const order = await maker.signOrderAsync();
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                    const transaction = await takers[0].signTransactionAsync({ data });
                    const transactionReceipt = await deployment.exchange
                        .executeTransaction(transaction, transaction.signature)
                        .awaitTransactionSuccessAsync({ from: sender.address });
                    verifyEventsFromLogs<ExchangeFillEventArgs>(
                        transactionReceipt.logs,
                        [defaultFillEvent(order)],
                        ExchangeEvents.Fill,
                    );
                });
                it(`${fnName} should be successful if called by taker without a transaction signature`, async () => {
                    const order = await maker.signOrderAsync();
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                    const transaction = await takers[0].signTransactionAsync({ data });
                    const transactionReceipt = await deployment.exchange
                        .executeTransaction(transaction, constants.NULL_BYTES)
                        .awaitTransactionSuccessAsync({ from: takers[0].address });
                    verifyEventsFromLogs<ExchangeFillEventArgs>(
                        transactionReceipt.logs,
                        [{ ...defaultFillEvent(order), senderAddress: takers[0].address }],
                        ExchangeEvents.Fill,
                    );
                });
                it(`${fnName} should return the correct data if successful`, async () => {
                    const order = await maker.signOrderAsync();
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                    const transaction = await takers[0].signTransactionAsync({ data });
                    const returnData = await deployment.exchange
                        .executeTransaction(transaction, transaction.signature)
                        .callAsync({ from: sender.address });

                    const decodedReturnData = deployment.exchange.getABIDecodedReturnData(fnName, returnData);
                    const fillResults = Array.isArray(decodedReturnData) ? decodedReturnData[0] : decodedReturnData;

                    expect(fillResults).to.deep.equal(
                        ReferenceFunctions.calculateFillResults(
                            order,
                            order.takerAssetAmount,
                            DeploymentManager.protocolFeeMultiplier,
                            DeploymentManager.gasPrice,
                        ),
                    );
                });
                it(`${fnName} should revert if transaction has already been executed`, async () => {
                    const order = await maker.signOrderAsync();
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                    const transaction = await takers[0].signTransactionAsync({ data });
                    await deployment.exchange
                        .executeTransaction(transaction, transaction.signature)
                        .awaitTransactionSuccessAsync({ from: sender.address });
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const expectedError = new ExchangeRevertErrors.TransactionError(
                        ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                        transactionHashHex,
                    );
                    const tx = deployment.exchange
                        .executeTransaction(transaction, transaction.signature)
                        .awaitTransactionSuccessAsync({ from: sender.address });
                    return expect(tx).to.revertWith(expectedError);
                });
                it(`${fnName} should revert and rethrow error if executeTransaction is called recursively with a signature`, async () => {
                    const order = await maker.signOrderAsync();
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                    const transaction = await takers[0].signTransactionAsync({ data });
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const recursiveData = deployment.exchange
                        .executeTransaction(transaction, transaction.signature)
                        .getABIEncodedTransactionData();
                    const recursiveTransaction = await takers[0].signTransactionAsync({
                        data: recursiveData,
                    });
                    const recursiveTransactionHashHex = transactionHashUtils.getTransactionHashHex(
                        recursiveTransaction,
                    );
                    const noReentrancyError = new ExchangeRevertErrors.TransactionInvalidContextError(
                        transactionHashHex,
                        transaction.signerAddress,
                    ).encode();
                    const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                        recursiveTransactionHashHex,
                        noReentrancyError,
                    );
                    const tx = deployment.exchange
                        .executeTransaction(recursiveTransaction, recursiveTransaction.signature)
                        .awaitTransactionSuccessAsync({ from: sender.address });
                    return expect(tx).to.revertWith(expectedError);
                });
                it(`${fnName} should be successful if executeTransaction is called recursively by taker without a signature`, async () => {
                    const order = await maker.signOrderAsync();
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                    const transaction = await takers[0].signTransactionAsync({ data });
                    const recursiveData = deployment.exchange
                        .executeTransaction(transaction, constants.NULL_BYTES)
                        .getABIEncodedTransactionData();
                    const recursiveTransaction = await takers[0].signTransactionAsync({
                        data: recursiveData,
                    });
                    const transactionReceipt = await deployment.exchange
                        .executeTransaction(recursiveTransaction, recursiveTransaction.signature)
                        .awaitTransactionSuccessAsync({ from: takers[0].address });
                    verifyEventsFromLogs<ExchangeFillEventArgs>(
                        transactionReceipt.logs,
                        [{ ...defaultFillEvent(order), senderAddress: takers[0].address }],
                        ExchangeEvents.Fill,
                    );
                });
                if (
                    [
                        ExchangeFunctionName.FillOrderNoThrow,
                        ExchangeFunctionName.BatchFillOrdersNoThrow,
                        ExchangeFunctionName.MarketBuyOrdersNoThrow,
                        ExchangeFunctionName.MarketSellOrdersNoThrow,
                        ExchangeFunctionName.MarketBuyOrdersFillOrKill,
                        ExchangeFunctionName.MarketSellOrdersFillOrKill,
                    ].indexOf(fnName) === -1
                ) {
                    it(`${fnName} should revert and rethrow error if the underlying function reverts`, async () => {
                        const order = await maker.signOrderAsync();
                        order.signature = constants.NULL_BYTES;
                        const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, [order]);
                        const transaction = await takers[0].signTransactionAsync({ data });
                        const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                        const nestedError = new ExchangeRevertErrors.SignatureError(
                            ExchangeRevertErrors.SignatureErrorCode.InvalidLength,
                            orderHashUtils.getOrderHashHex(order),
                            order.makerAddress,
                            order.signature,
                        ).encode();
                        const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                            transactionHashHex,
                            nestedError,
                        );
                        const tx = deployment.exchange
                            .executeTransaction(transaction, transaction.signature)
                            .awaitTransactionSuccessAsync({ from: sender.address });
                        return expect(tx).to.revertWith(expectedError);
                    });
                }
            }
        });
        describe('cancelOrder', () => {
            it('should revert if not signed by or called by maker', async () => {
                const order = await maker.signOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order]);
                const transaction = await takers[0].signTransactionAsync({ data });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const nestedError = new ExchangeRevertErrors.ExchangeInvalidContextError(
                    ExchangeRevertErrors.ExchangeContextErrorCodes.InvalidMaker,
                    orderHashUtils.getOrderHashHex(order),
                    takers[0].address,
                ).encode();
                const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                    transactionHashHex,
                    nestedError,
                );
                const tx = deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                return expect(tx).to.revertWith(expectedError);
            });
            it('should be successful if signed by maker and called by sender', async () => {
                const order = await maker.signOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order]);
                const transaction = await maker.signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                verifyEventsFromLogs<ExchangeCancelEventArgs>(
                    transactionReceipt.logs,
                    [defaultCancelEvent(order)],
                    ExchangeEvents.Cancel,
                );
            });
            it('should be successful if called by maker without a signature', async () => {
                const order = await maker.signOrderAsync();
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order]);
                const transaction = await maker.signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, constants.NULL_BYTES)
                    .awaitTransactionSuccessAsync({ from: maker.address });
                verifyEventsFromLogs<ExchangeCancelEventArgs>(
                    transactionReceipt.logs,
                    [{ ...defaultCancelEvent(order), senderAddress: maker.address }],
                    ExchangeEvents.Cancel,
                );
            });
        });
        describe('batchCancelOrders', () => {
            it('should revert if not signed by or called by maker', async () => {
                const orders = [await maker.signOrderAsync(), await maker.signOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchCancelOrders,
                    orders,
                );
                const transaction = await takers[0].signTransactionAsync({ data });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const nestedError = new ExchangeRevertErrors.ExchangeInvalidContextError(
                    ExchangeRevertErrors.ExchangeContextErrorCodes.InvalidMaker,
                    orderHashUtils.getOrderHashHex(orders[0]),
                    takers[0].address,
                ).encode();
                const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                    transactionHashHex,
                    nestedError,
                );
                const tx = deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                return expect(tx).to.revertWith(expectedError);
            });
            it('should be successful if signed by maker and called by sender', async () => {
                const orders = [await maker.signOrderAsync(), await maker.signOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchCancelOrders,
                    orders,
                );
                const transaction = await maker.signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                verifyEventsFromLogs<ExchangeCancelEventArgs>(
                    transactionReceipt.logs,
                    [defaultCancelEvent(orders[0]), defaultCancelEvent(orders[1])],
                    ExchangeEvents.Cancel,
                );
            });
            it('should be successful if called by maker without a signature', async () => {
                const orders = [await maker.signOrderAsync(), await maker.signOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchCancelOrders,
                    orders,
                );
                const transaction = await maker.signTransactionAsync({ data });
                transaction.signature = constants.NULL_BYTES;
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: maker.address });
                verifyEventsFromLogs<ExchangeCancelEventArgs>(
                    transactionReceipt.logs,
                    [
                        { ...defaultCancelEvent(orders[0]), senderAddress: maker.address },
                        { ...defaultCancelEvent(orders[1]), senderAddress: maker.address },
                    ],
                    ExchangeEvents.Cancel,
                );
            });
        });
        describe('cancelOrdersUpTo', () => {
            it('should be successful if signed by maker and called by sender', async () => {
                const targetEpoch = constants.ZERO_AMOUNT;
                const data = deployment.exchange.cancelOrdersUpTo(targetEpoch).getABIEncodedTransactionData();
                const transaction = await maker.signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                verifyEventsFromLogs<ExchangeCancelUpToEventArgs>(
                    transactionReceipt.logs,
                    [
                        {
                            makerAddress: maker.address,
                            orderSenderAddress: sender.address,
                            orderEpoch: targetEpoch.plus(1),
                        },
                    ],
                    ExchangeEvents.CancelUpTo,
                );
            });
            it('should be successful if called by maker without a signature', async () => {
                const targetEpoch = constants.ZERO_AMOUNT;
                const data = deployment.exchange.cancelOrdersUpTo(targetEpoch).getABIEncodedTransactionData();
                const transaction = await maker.signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, constants.NULL_BYTES)
                    .awaitTransactionSuccessAsync({ from: maker.address });
                verifyEventsFromLogs<ExchangeCancelUpToEventArgs>(
                    transactionReceipt.logs,
                    [
                        {
                            makerAddress: maker.address,
                            orderSenderAddress: constants.NULL_ADDRESS,
                            orderEpoch: targetEpoch.plus(1),
                        },
                    ],
                    ExchangeEvents.CancelUpTo,
                );
            });
        });
        describe('preSign', () => {
            it('should preSign a hash for the signer', async () => {
                const order = await maker.signOrderAsync();
                const orderHash = orderHashUtils.getOrderHashHex(order);
                const data = deployment.exchange.preSign(orderHash).getABIEncodedTransactionData();
                const transaction = await takers[0].signTransactionAsync({ data });
                let isPreSigned = await deployment.exchange.preSigned(orderHash, takers[0].address).callAsync();
                expect(isPreSigned).to.be.eq(false);
                await deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                isPreSigned = await deployment.exchange.preSigned(orderHash, takers[0].address).callAsync();
                expect(isPreSigned).to.be.eq(true);
            });
            it('should preSign a hash for the caller if called without a signature', async () => {
                const order = await maker.signOrderAsync();
                const orderHash = orderHashUtils.getOrderHashHex(order);
                const data = deployment.exchange.preSign(orderHash).getABIEncodedTransactionData();
                const transaction = await takers[0].signTransactionAsync({ data });
                let isPreSigned = await deployment.exchange.preSigned(orderHash, takers[0].address).callAsync();
                expect(isPreSigned).to.be.eq(false);
                await deployment.exchange
                    .executeTransaction(transaction, constants.NULL_BYTES)
                    .awaitTransactionSuccessAsync({ from: takers[0].address });
                isPreSigned = await deployment.exchange.preSigned(orderHash, takers[0].address).callAsync();
                expect(isPreSigned).to.be.eq(true);
            });
        });
        describe('setSignatureValidatorApproval', () => {
            it('should approve a validator for the signer', async () => {
                const validatorAddress = randomAddress();
                const shouldApprove = true;
                const data = deployment.exchange
                    .setSignatureValidatorApproval(validatorAddress, shouldApprove)
                    .getABIEncodedTransactionData();
                const transaction = await takers[0].signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, transaction.signature)
                    .awaitTransactionSuccessAsync({ from: sender.address });
                verifyEventsFromLogs<ExchangeSignatureValidatorApprovalEventArgs>(
                    transactionReceipt.logs,
                    [
                        {
                            signerAddress: takers[0].address,
                            validatorAddress,
                            isApproved: shouldApprove,
                        },
                    ],
                    ExchangeEvents.SignatureValidatorApproval,
                );
            });
            it('should approve a validator for the caller if called with no signature', async () => {
                const validatorAddress = randomAddress();
                const shouldApprove = true;
                const data = deployment.exchange
                    .setSignatureValidatorApproval(validatorAddress, shouldApprove)
                    .getABIEncodedTransactionData();
                const transaction = await takers[0].signTransactionAsync({ data });
                const transactionReceipt = await deployment.exchange
                    .executeTransaction(transaction, constants.NULL_BYTES)
                    .awaitTransactionSuccessAsync({ from: takers[0].address });
                verifyEventsFromLogs<ExchangeSignatureValidatorApprovalEventArgs>(
                    transactionReceipt.logs,
                    [
                        {
                            signerAddress: takers[0].address,
                            validatorAddress,
                            isApproved: shouldApprove,
                        },
                    ],
                    ExchangeEvents.SignatureValidatorApproval,
                );
            });
        });
    });
    describe('batchExecuteTransactions', () => {
        it('should successfully call fillOrder via 2 transactions with different taker signatures', async () => {
            const order1 = await maker.signOrderAsync();
            const order2 = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
            const transaction1 = await takers[0].signTransactionAsync({ data: data1 });
            const transaction2 = await takers[1].signTransactionAsync({ data: data2 });
            const transactionReceipt = await deployment.exchange
                .batchExecuteTransactions(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                )
                .awaitTransactionSuccessAsync({ from: sender.address });
            verifyEventsFromLogs<ExchangeTransactionExecutionEventArgs>(
                transactionReceipt.logs,
                [
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction1) },
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction2) },
                ],
                ExchangeEvents.TransactionExecution,
            );
            verifyEventsFromLogs<ExchangeFillEventArgs>(
                transactionReceipt.logs,
                [defaultFillEvent(order1), { ...defaultFillEvent(order2), takerAddress: takers[1].address }],
                ExchangeEvents.Fill,
            );
        });
        it('should successfully call fillOrder via 2 transactions when called by taker with no signatures', async () => {
            const order1 = await maker.signOrderAsync();
            const order2 = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
            const transaction1 = await takers[0].signTransactionAsync({ data: data1 });
            const transaction2 = await takers[0].signTransactionAsync({ data: data2 });
            transaction1.signature = constants.NULL_BYTES;
            transaction2.signature = constants.NULL_BYTES;
            const transactionReceipt = await deployment.exchange
                .batchExecuteTransactions(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                )
                .awaitTransactionSuccessAsync({ from: takers[0].address });

            verifyEventsFromLogs<ExchangeTransactionExecutionEventArgs>(
                transactionReceipt.logs,
                [
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction1) },
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction2) },
                ],
                ExchangeEvents.TransactionExecution,
            );
            verifyEventsFromLogs<ExchangeFillEventArgs>(
                transactionReceipt.logs,
                [
                    { ...defaultFillEvent(order1), senderAddress: takers[0].address },
                    { ...defaultFillEvent(order2), senderAddress: takers[0].address },
                ],
                ExchangeEvents.Fill,
            );
        });
        it('should successfully call fillOrder via 2 transactions when one is signed by taker1 and executeTransaction is called by taker2', async () => {
            const order1 = await maker.signOrderAsync();
            const order2 = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
            const transaction1 = await takers[0].signTransactionAsync({ data: data1 });
            const transaction2 = await takers[1].signTransactionAsync({ data: data2 });
            const transactionReceipt = await deployment.exchange
                .batchExecuteTransactions([transaction1, transaction2], [transaction1.signature, constants.NULL_BYTES])
                .awaitTransactionSuccessAsync({ from: takers[1].address });

            verifyEventsFromLogs<ExchangeTransactionExecutionEventArgs>(
                transactionReceipt.logs,
                [
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction1) },
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction2) },
                ],
                ExchangeEvents.TransactionExecution,
            );
            verifyEventsFromLogs<ExchangeFillEventArgs>(
                transactionReceipt.logs,
                [
                    { ...defaultFillEvent(order1), senderAddress: takers[1].address },
                    {
                        ...defaultFillEvent(order2),
                        takerAddress: takers[1].address,
                        senderAddress: takers[1].address,
                    },
                ],
                ExchangeEvents.Fill,
            );
        });
        it('should return the correct data for 2 different fillOrder calls', async () => {
            const order1 = await maker.signOrderAsync();
            const order2 = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
            const transaction1 = await takers[0].signTransactionAsync({ data: data1 });
            const transaction2 = await takers[1].signTransactionAsync({ data: data2 });
            const returnData = await deployment.exchange
                .batchExecuteTransactions(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                )
                .callAsync({ from: sender.address });
            const fillResults1: FillResults = deployment.exchange.getABIDecodedReturnData('fillOrder', returnData[0]);
            const fillResults2: FillResults = deployment.exchange.getABIDecodedReturnData('fillOrder', returnData[1]);
            expect(fillResults1).to.deep.equal(
                ReferenceFunctions.calculateFillResults(
                    order1,
                    order1.takerAssetAmount,
                    DeploymentManager.protocolFeeMultiplier,
                    DeploymentManager.gasPrice,
                ),
            );
            expect(fillResults2).to.deep.equal(
                ReferenceFunctions.calculateFillResults(
                    order2,
                    order2.takerAssetAmount,
                    DeploymentManager.protocolFeeMultiplier,
                    DeploymentManager.gasPrice,
                ),
            );
        });
        it('should successfully call fillOrder and cancelOrder via 2 transactions', async () => {
            const order1 = await maker.signOrderAsync();
            const order2 = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order2]);
            const transaction1 = await takers[0].signTransactionAsync({ data: data1 });
            const transaction2 = await maker.signTransactionAsync({ data: data2 });
            const transactionReceipt = await deployment.exchange
                .batchExecuteTransactions(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                )
                .awaitTransactionSuccessAsync({ from: sender.address });

            verifyEventsFromLogs<ExchangeTransactionExecutionEventArgs>(
                transactionReceipt.logs,
                [
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction1) },
                    { transactionHash: transactionHashUtils.getTransactionHashHex(transaction2) },
                ],
                ExchangeEvents.TransactionExecution,
            );

            const fillLogIndex = transactionReceipt.logs.findIndex(
                log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
            );
            const cancelLogIndex = transactionReceipt.logs.findIndex(
                log => (log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel',
            );
            expect(cancelLogIndex).to.greaterThan(fillLogIndex);

            verifyEventsFromLogs<ExchangeFillEventArgs>(
                transactionReceipt.logs,
                [defaultFillEvent(order1)],
                ExchangeEvents.Fill,
            );
            verifyEventsFromLogs<ExchangeCancelEventArgs>(
                transactionReceipt.logs,
                [defaultCancelEvent(order2)],
                ExchangeEvents.Cancel,
            );
        });
        it('should return the correct data for a fillOrder and cancelOrder call', async () => {
            const order1 = await maker.signOrderAsync();
            const order2 = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order2]);
            const transaction1 = await takers[0].signTransactionAsync({ data: data1 });
            const transaction2 = await maker.signTransactionAsync({ data: data2 });
            const returnData = await deployment.exchange
                .batchExecuteTransactions(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                )
                .callAsync({ from: sender.address });
            const fillResults: FillResults = deployment.exchange.getABIDecodedReturnData('fillOrder', returnData[0]);
            expect(fillResults).to.deep.equal(
                ReferenceFunctions.calculateFillResults(
                    order1,
                    order1.takerAssetAmount,
                    DeploymentManager.protocolFeeMultiplier,
                    DeploymentManager.gasPrice,
                ),
            );
            expect(returnData[1]).to.eq(constants.NULL_BYTES);
        });
        it('should revert if a single transaction reverts', async () => {
            const order = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
            const transaction1 = await maker.signTransactionAsync({ data: data1 });
            const transaction2 = await takers[0].signTransactionAsync({ data: data2 });
            const tx = deployment.exchange
                .batchExecuteTransactions(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                )
                .awaitTransactionSuccessAsync({ from: sender.address });
            const nestedError = new ExchangeRevertErrors.OrderStatusError(
                orderHashUtils.getOrderHashHex(order),
                OrderStatus.Cancelled,
            ).encode();
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHashUtils.getTransactionHashHex(transaction2),
                nestedError,
            );
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if a single transaction is expired', async () => {
            const order1 = await maker.signOrderAsync();
            const order2 = await maker.signOrderAsync();
            const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
            const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = await takers[0].signTransactionAsync({ data: data1 });
            const transaction2 = await takers[1].signTransactionAsync({
                data: data2,
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const tx = deployment.exchange
                .batchExecuteTransactions(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                )
                .awaitTransactionSuccessAsync({ from: sender.address });
            const expiredTransactionHash = transactionHashUtils.getTransactionHashHex(transaction2);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                expiredTransactionHash,
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
