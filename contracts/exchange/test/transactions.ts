// tslint:disable: max-file-line-count
import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    describe,
    expect,
    getLatestBlockTimestampAsync,
    OrderFactory,
    orderHashUtils,
    TransactionFactory,
} from '@0x/contracts-test-utils';
import { transactionHashUtils } from '@0x/order-utils';
import { FillResults, OrderStatus } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { LogWithDecodedArgs, MethodAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import {
    artifacts as localArtifacts,
    constants as exchangeConstants,
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeContract,
    exchangeDataEncoder,
    ExchangeFillEventArgs,
    ExchangeFunctionName,
    ExchangeRevertErrors,
    ExchangeSignatureValidatorApprovalEventArgs,
    ExchangeTransactionExecutionEventArgs,
    ExchangeWrapper,
} from '../src/';

const artifacts = { ...erc20Artifacts, ...localArtifacts };

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Exchange transactions', env => {
    let chainId: number;
    let senderAddress: string;
    let owner: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let validatorAddress: string;
    let taker2Address: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let takerFeeToken: DummyERC20TokenContract;
    let makerFeeToken: DummyERC20TokenContract;
    let exchangeInstance: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;

    let orderFactory: OrderFactory;
    let makerTransactionFactory: TransactionFactory;
    let takerTransactionFactory: TransactionFactory;
    let taker2TransactionFactory: TransactionFactory;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;

    let defaultMakerTokenAddress: string;
    let defaultTakerTokenAddress: string;
    let defaultMakerFeeTokenAddress: string;
    let defaultTakerFeeTokenAddress: string;
    let makerPrivateKey: Buffer;
    let takerPrivateKey: Buffer;
    let taker2PrivateKey: Buffer;

    const devUtils = new DevUtilsContract(constants.NULL_ADDRESS, env.provider, env.txDefaults);
    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([
            owner,
            senderAddress,
            makerAddress,
            takerAddress,
            feeRecipientAddress,
            validatorAddress,
            taker2Address,
        ] = _.slice(accounts, 0, 7));

        erc20Wrapper = new ERC20Wrapper(env.provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 4;
        [erc20TokenA, erc20TokenB, takerFeeToken, makerFeeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(chainId),
        );
        exchangeWrapper = new ExchangeWrapper(exchangeInstance);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);

        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchangeInstance.address, { from: owner });

        defaultMakerTokenAddress = erc20TokenA.address;
        defaultTakerTokenAddress = erc20TokenB.address;
        defaultMakerFeeTokenAddress = makerFeeToken.address;
        defaultTakerFeeTokenAddress = takerFeeToken.address;

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: await devUtils.encodeERC20AssetData.callAsync(defaultMakerTokenAddress),
            takerAssetData: await devUtils.encodeERC20AssetData.callAsync(defaultTakerTokenAddress),
            makerFeeAssetData: await devUtils.encodeERC20AssetData.callAsync(defaultMakerFeeTokenAddress),
            takerFeeAssetData: await devUtils.encodeERC20AssetData.callAsync(defaultTakerFeeTokenAddress),
            exchangeAddress: exchangeInstance.address,
            chainId,
        };
        makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        taker2PrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(taker2Address)];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        makerTransactionFactory = new TransactionFactory(makerPrivateKey, exchangeInstance.address, chainId);
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchangeInstance.address, chainId);
        taker2TransactionFactory = new TransactionFactory(taker2PrivateKey, exchangeInstance.address, chainId);
    });
    describe('executeTransaction', () => {
        describe('general functionality', () => {
            it('should log the correct transactionHash if successfully executed', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orders = [order];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, takerAddress);
                const transactionExecutionLogs = transactionReceipt.logs.filter(
                    log =>
                        (log as LogWithDecodedArgs<ExchangeTransactionExecutionEventArgs>).event ===
                        'TransactionExecution',
                );
                expect(transactionExecutionLogs.length).to.eq(1);
                const executionLogArgs = (transactionExecutionLogs[0] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(executionLogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction),
                );
            });
            it('should revert if the transaction is expired', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orders = [order];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, orders);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({
                    data,
                    expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
                });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const expectedError = new ExchangeRevertErrors.TransactionError(
                    ExchangeRevertErrors.TransactionErrorCode.Expired,
                    transactionHashHex,
                );
                const tx = exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                return expect(tx).to.revertWith(expectedError);
            });
            it('should revert if the actual gasPrice is greater than expected', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orders = [order];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({
                    data,
                });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const actualGasPrice = transaction.gasPrice.plus(1);
                const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                    transactionHashHex,
                    actualGasPrice,
                    transaction.gasPrice,
                );
                const tx = exchangeInstance.executeTransaction.sendTransactionAsync(
                    transaction,
                    transaction.signature,
                    { gasPrice: actualGasPrice, from: senderAddress },
                );
                return expect(tx).to.revertWith(expectedError);
            });
            it('should revert if the actual gasPrice is less than expected', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orders = [order];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({
                    data,
                });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const actualGasPrice = transaction.gasPrice.minus(1);
                const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                    transactionHashHex,
                    actualGasPrice,
                    transaction.gasPrice,
                );
                const tx = exchangeInstance.executeTransaction.sendTransactionAsync(
                    transaction,
                    transaction.signature,
                    { gasPrice: actualGasPrice, from: senderAddress },
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });
        describe('fill methods', () => {
            for (const fnName of [
                ...exchangeConstants.SINGLE_FILL_FN_NAMES,
                ...exchangeConstants.BATCH_FILL_FN_NAMES,
                ...exchangeConstants.MARKET_FILL_FN_NAMES,
            ]) {
                it(`${fnName} should revert if signature is invalid and not called by signer`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                    const v = ethUtil.toBuffer(transaction.signature.slice(0, 4));
                    const invalidR = ethUtil.sha3('invalidR');
                    const invalidS = ethUtil.sha3('invalidS');
                    const signatureType = ethUtil.toBuffer(`0x${transaction.signature.slice(-2)}`);
                    const invalidSigBuff = Buffer.concat([v, invalidR, invalidS, signatureType]);
                    const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
                    transaction.signature = invalidSigHex;
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const expectedError = new ExchangeRevertErrors.SignatureError(
                        ExchangeRevertErrors.SignatureErrorCode.BadTransactionSignature,
                        transactionHashHex,
                        transaction.signerAddress,
                        transaction.signature,
                    );
                    const tx = exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                    return expect(tx).to.revertWith(expectedError);
                });
                it(`${fnName} should be successful if signed by taker and called by sender`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                    const transactionReceipt = await exchangeWrapper.executeTransactionAsync(
                        transaction,
                        senderAddress,
                    );
                    const fillLogs = transactionReceipt.logs.filter(
                        log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                    );
                    expect(fillLogs.length).to.eq(1);
                    const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                    expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                    expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                    expect(fillLogArgs.senderAddress).to.eq(senderAddress);
                    expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(fillLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
                    expect(fillLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
                    expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(orders[0].makerAssetAmount);
                    expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(orders[0].takerAssetAmount);
                    expect(fillLogArgs.makerFeePaid).to.bignumber.eq(orders[0].makerFee);
                    expect(fillLogArgs.takerFeePaid).to.bignumber.eq(orders[0].takerFee);
                    expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
                });
                it(`${fnName} should be successful if called by taker without a transaction signature`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                    transaction.signature = constants.NULL_BYTES;
                    const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, takerAddress);
                    const fillLogs = transactionReceipt.logs.filter(
                        log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                    );
                    expect(fillLogs.length).to.eq(1);
                    const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                    expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                    expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                    expect(fillLogArgs.senderAddress).to.eq(takerAddress);
                    expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(fillLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
                    expect(fillLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
                    expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(orders[0].makerAssetAmount);
                    expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(orders[0].takerAssetAmount);
                    expect(fillLogArgs.makerFeePaid).to.bignumber.eq(orders[0].makerFee);
                    expect(fillLogArgs.takerFeePaid).to.bignumber.eq(orders[0].takerFee);
                    expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
                });
                it(`${fnName} should return the correct data if successful`, async () => {
                    const order = await orderFactory.newSignedOrderAsync();
                    const orders = [order];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                    const returnData = await exchangeInstance.executeTransaction.callAsync(
                        transaction,
                        transaction.signature,
                        {
                            from: senderAddress,
                        },
                    );
                    const abi = artifacts.Exchange.compilerOutput.abi;
                    const methodAbi = abi.filter(abiItem => (abiItem as MethodAbi).name === fnName)[0] as MethodAbi;
                    const abiEncoder = new AbiEncoder.Method(methodAbi);

                    const decodedReturnData = abiEncoder.decodeReturnValues(returnData);
                    const fillResults =
                        exchangeConstants.BATCH_FILL_FN_NAMES.indexOf(fnName) !== -1
                            ? decodedReturnData.fillResults[0]
                            : decodedReturnData.fillResults;

                    expect(fillResults.makerAssetFilledAmount).to.be.bignumber.eq(order.makerAssetAmount);
                    expect(fillResults.takerAssetFilledAmount).to.be.bignumber.eq(order.takerAssetAmount);
                    expect(fillResults.makerFeePaid).to.be.bignumber.eq(order.makerFee);
                    expect(fillResults.takerFeePaid).to.be.bignumber.eq(order.takerFee);
                });
                it(`${fnName} should revert if transaction has already been executed`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                    await exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const expectedError = new ExchangeRevertErrors.TransactionError(
                        ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                        transactionHashHex,
                    );
                    const tx = exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                    return expect(tx).to.revertWith(expectedError);
                });
                it(`${fnName} should revert and rethrow error if executeTransaction is called recursively with a signature`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const recursiveData = exchangeInstance.executeTransaction.getABIEncodedTransactionData(
                        transaction,
                        transaction.signature,
                    );
                    const recursiveTransaction = await takerTransactionFactory.newSignedTransactionAsync({
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
                    const tx = exchangeWrapper.executeTransactionAsync(recursiveTransaction, senderAddress);
                    return expect(tx).to.revertWith(expectedError);
                });
                it(`${fnName} should be successful if executeTransaction is called recursively by taker without a signature`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                    const recursiveData = exchangeInstance.executeTransaction.getABIEncodedTransactionData(
                        transaction,
                        constants.NULL_BYTES,
                    );
                    const recursiveTransaction = await takerTransactionFactory.newSignedTransactionAsync({
                        data: recursiveData,
                    });
                    const transactionReceipt = await exchangeWrapper.executeTransactionAsync(
                        recursiveTransaction,
                        takerAddress,
                    );
                    const fillLogs = transactionReceipt.logs.filter(
                        log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                    );
                    expect(fillLogs.length).to.eq(1);
                    const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                    expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                    expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                    expect(fillLogArgs.senderAddress).to.eq(takerAddress);
                    expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(fillLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
                    expect(fillLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
                    expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(orders[0].makerAssetAmount);
                    expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(orders[0].takerAssetAmount);
                    expect(fillLogArgs.makerFeePaid).to.bignumber.eq(orders[0].makerFee);
                    expect(fillLogArgs.takerFeePaid).to.bignumber.eq(orders[0].takerFee);
                    expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
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
                        const order = await orderFactory.newSignedOrderAsync();
                        order.signature = constants.NULL_BYTES;
                        const orders = [order];
                        const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                        const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
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
                        const tx = exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                        return expect(tx).to.revertWith(expectedError);
                    });
                }
            }
        });
        describe('cancelOrder', () => {
            it('should revert if not signed by or called by maker', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orders = [order];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, orders);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const nestedError = new ExchangeRevertErrors.ExchangeInvalidContextError(
                    ExchangeRevertErrors.ExchangeContextErrorCodes.InvalidMaker,
                    orderHashUtils.getOrderHashHex(order),
                    takerAddress,
                ).encode();
                const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                    transactionHashHex,
                    nestedError,
                );
                const tx = exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                return expect(tx).to.revertWith(expectedError);
            });
            it('should be successful if signed by maker and called by sender', async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, orders);
                const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel',
                );
                expect(cancelLogs.length).to.eq(1);
                const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.senderAddress).to.eq(senderAddress);
                expect(cancelLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(cancelLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
                expect(cancelLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
                expect(cancelLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
            });
            it('should be successful if called by maker without a signature', async () => {
                const orders = [await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, orders);
                const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
                transaction.signature = constants.NULL_BYTES;
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, makerAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel',
                );
                expect(cancelLogs.length).to.eq(1);
                const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.senderAddress).to.eq(makerAddress);
                expect(cancelLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(cancelLogArgs.makerAssetData).to.eq(orders[0].makerAssetData);
                expect(cancelLogArgs.takerAssetData).to.eq(orders[0].takerAssetData);
                expect(cancelLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(orders[0]));
            });
        });
        describe('batchCancelOrders', () => {
            it('should revert if not signed by or called by maker', async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchCancelOrders,
                    orders,
                );
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const nestedError = new ExchangeRevertErrors.ExchangeInvalidContextError(
                    ExchangeRevertErrors.ExchangeContextErrorCodes.InvalidMaker,
                    orderHashUtils.getOrderHashHex(orders[0]),
                    takerAddress,
                ).encode();
                const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                    transactionHashHex,
                    nestedError,
                );
                const tx = exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                return expect(tx).to.revertWith(expectedError);
            });
            it('should be successful if signed by maker and called by sender', async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchCancelOrders,
                    orders,
                );
                const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel',
                );
                expect(cancelLogs.length).to.eq(orders.length);
                orders.forEach((order, index) => {
                    const cancelLogArgs = (cancelLogs[index] as LogWithDecodedArgs<ExchangeCancelEventArgs>).args;
                    expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                    expect(cancelLogArgs.senderAddress).to.eq(senderAddress);
                    expect(cancelLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(cancelLogArgs.makerAssetData).to.eq(order.makerAssetData);
                    expect(cancelLogArgs.takerAssetData).to.eq(order.takerAssetData);
                    expect(cancelLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order));
                });
            });
            it('should be successful if called by maker without a signature', async () => {
                const orders = [await orderFactory.newSignedOrderAsync(), await orderFactory.newSignedOrderAsync()];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(
                    ExchangeFunctionName.BatchCancelOrders,
                    orders,
                );
                const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
                transaction.signature = constants.NULL_BYTES;
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, makerAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel',
                );
                expect(cancelLogs.length).to.eq(orders.length);
                orders.forEach((order, index) => {
                    const cancelLogArgs = (cancelLogs[index] as LogWithDecodedArgs<ExchangeCancelEventArgs>).args;
                    expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                    expect(cancelLogArgs.senderAddress).to.eq(makerAddress);
                    expect(cancelLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(cancelLogArgs.makerAssetData).to.eq(order.makerAssetData);
                    expect(cancelLogArgs.takerAssetData).to.eq(order.takerAssetData);
                    expect(cancelLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order));
                });
            });
        });
        describe('cancelOrdersUpTo', () => {
            it('should be successful if signed by maker and called by sender', async () => {
                const targetEpoch = constants.ZERO_AMOUNT;
                const data = exchangeInstance.cancelOrdersUpTo.getABIEncodedTransactionData(targetEpoch);
                const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).event === 'CancelUpTo',
                );
                expect(cancelLogs.length).to.eq(1);
                const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.orderSenderAddress).to.eq(senderAddress);
                expect(cancelLogArgs.orderEpoch).to.bignumber.eq(targetEpoch.plus(1));
            });
            it('should be successful if called by maker without a signature', async () => {
                const targetEpoch = constants.ZERO_AMOUNT;
                const data = exchangeInstance.cancelOrdersUpTo.getABIEncodedTransactionData(targetEpoch);
                const transaction = await makerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, makerAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).event === 'CancelUpTo',
                );
                expect(cancelLogs.length).to.eq(1);
                const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.orderSenderAddress).to.eq(constants.NULL_ADDRESS);
                expect(cancelLogArgs.orderEpoch).to.bignumber.eq(targetEpoch.plus(1));
            });
        });
        describe('preSign', () => {
            it('should preSign a hash for the signer', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orderHash = orderHashUtils.getOrderHashHex(order);
                const data = exchangeInstance.preSign.getABIEncodedTransactionData(orderHash);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                let isPreSigned = await exchangeInstance.preSigned.callAsync(orderHash, takerAddress);
                expect(isPreSigned).to.be.eq(false);
                await exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                isPreSigned = await exchangeInstance.preSigned.callAsync(orderHash, takerAddress);
                expect(isPreSigned).to.be.eq(true);
            });
            it('should preSign a hash for the caller if called without a signature', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orderHash = orderHashUtils.getOrderHashHex(order);
                const data = exchangeInstance.preSign.getABIEncodedTransactionData(orderHash);
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                transaction.signature = constants.NULL_BYTES;
                let isPreSigned = await exchangeInstance.preSigned.callAsync(orderHash, takerAddress);
                expect(isPreSigned).to.be.eq(false);
                await exchangeWrapper.executeTransactionAsync(transaction, takerAddress);
                isPreSigned = await exchangeInstance.preSigned.callAsync(orderHash, takerAddress);
                expect(isPreSigned).to.be.eq(true);
            });
        });
        describe('setSignatureValidatorApproval', () => {
            it('should approve a validator for the signer', async () => {
                const shouldApprove = true;
                const data = exchangeInstance.setSignatureValidatorApproval.getABIEncodedTransactionData(
                    validatorAddress,
                    shouldApprove,
                );
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                const validatorApprovalLogs = transactionReceipt.logs.filter(
                    log =>
                        (log as LogWithDecodedArgs<ExchangeSignatureValidatorApprovalEventArgs>).event ===
                        'SignatureValidatorApproval',
                );
                expect(validatorApprovalLogs.length).to.eq(1);
                const validatorApprovalLogArgs = (validatorApprovalLogs[0] as LogWithDecodedArgs<
                    ExchangeSignatureValidatorApprovalEventArgs
                >).args;
                expect(validatorApprovalLogArgs.signerAddress).to.eq(takerAddress);
                expect(validatorApprovalLogArgs.validatorAddress).to.eq(validatorAddress);
                expect(validatorApprovalLogArgs.isApproved).to.eq(shouldApprove);
            });
            it('should approve a validator for the caller if called with no signature', async () => {
                const shouldApprove = true;
                const data = exchangeInstance.setSignatureValidatorApproval.getABIEncodedTransactionData(
                    validatorAddress,
                    shouldApprove,
                );
                const transaction = await takerTransactionFactory.newSignedTransactionAsync({ data });
                transaction.signature = constants.NULL_BYTES;
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, takerAddress);
                const validatorApprovalLogs = transactionReceipt.logs.filter(
                    log =>
                        (log as LogWithDecodedArgs<ExchangeSignatureValidatorApprovalEventArgs>).event ===
                        'SignatureValidatorApproval',
                );
                expect(validatorApprovalLogs.length).to.eq(1);
                const validatorApprovalLogArgs = (validatorApprovalLogs[0] as LogWithDecodedArgs<
                    ExchangeSignatureValidatorApprovalEventArgs
                >).args;
                expect(validatorApprovalLogArgs.signerAddress).to.eq(takerAddress);
                expect(validatorApprovalLogArgs.validatorAddress).to.eq(validatorAddress);
                expect(validatorApprovalLogArgs.isApproved).to.eq(shouldApprove);
            });
        });
        describe('batchExecuteTransactions', () => {
            it('should successfully call fillOrder via 2 transactions with different taker signatures', async () => {
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
                const transaction1 = await takerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await taker2TransactionFactory.newSignedTransactionAsync({ data: data2 });
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    senderAddress,
                );

                const transactionExecutionLogs = transactionReceipt.logs.filter(
                    log =>
                        (log as LogWithDecodedArgs<ExchangeTransactionExecutionEventArgs>).event ===
                        'TransactionExecution',
                );
                expect(transactionExecutionLogs.length).to.eq(2);

                const execution1LogArgs = (transactionExecutionLogs[0] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution1LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction1),
                );

                const execution2LogArgs = (transactionExecutionLogs[1] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution2LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction2),
                );

                const fillLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                );
                expect(fillLogs.length).to.eq(2);

                const fill1LogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fill1LogArgs.makerAddress).to.eq(makerAddress);
                expect(fill1LogArgs.takerAddress).to.eq(takerAddress);
                expect(fill1LogArgs.senderAddress).to.eq(senderAddress);
                expect(fill1LogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fill1LogArgs.makerAssetData).to.eq(order1.makerAssetData);
                expect(fill1LogArgs.takerAssetData).to.eq(order1.takerAssetData);
                expect(fill1LogArgs.makerAssetFilledAmount).to.bignumber.eq(order1.makerAssetAmount);
                expect(fill1LogArgs.takerAssetFilledAmount).to.bignumber.eq(order1.takerAssetAmount);
                expect(fill1LogArgs.makerFeePaid).to.bignumber.eq(order1.makerFee);
                expect(fill1LogArgs.takerFeePaid).to.bignumber.eq(order1.takerFee);
                expect(fill1LogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order1));

                const fill2LogArgs = (fillLogs[1] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fill2LogArgs.makerAddress).to.eq(makerAddress);
                expect(fill2LogArgs.takerAddress).to.eq(taker2Address);
                expect(fill2LogArgs.senderAddress).to.eq(senderAddress);
                expect(fill2LogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fill2LogArgs.makerAssetData).to.eq(order2.makerAssetData);
                expect(fill2LogArgs.takerAssetData).to.eq(order2.takerAssetData);
                expect(fill2LogArgs.makerAssetFilledAmount).to.bignumber.eq(order2.makerAssetAmount);
                expect(fill2LogArgs.takerAssetFilledAmount).to.bignumber.eq(order2.takerAssetAmount);
                expect(fill2LogArgs.makerFeePaid).to.bignumber.eq(order2.makerFee);
                expect(fill2LogArgs.takerFeePaid).to.bignumber.eq(order2.takerFee);
                expect(fill2LogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order2));
            });
            it('should successfully call fillOrder via 2 transactions when called by taker with no signatures', async () => {
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
                const transaction1 = await takerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await takerTransactionFactory.newSignedTransactionAsync({ data: data2 });
                transaction1.signature = constants.NULL_BYTES;
                transaction2.signature = constants.NULL_BYTES;
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    takerAddress,
                );

                const transactionExecutionLogs = transactionReceipt.logs.filter(
                    log =>
                        (log as LogWithDecodedArgs<ExchangeTransactionExecutionEventArgs>).event ===
                        'TransactionExecution',
                );
                expect(transactionExecutionLogs.length).to.eq(2);

                const execution1LogArgs = (transactionExecutionLogs[0] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution1LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction1),
                );

                const execution2LogArgs = (transactionExecutionLogs[1] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution2LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction2),
                );

                const fillLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                );
                expect(fillLogs.length).to.eq(2);

                const fill1LogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fill1LogArgs.makerAddress).to.eq(makerAddress);
                expect(fill1LogArgs.takerAddress).to.eq(takerAddress);
                expect(fill1LogArgs.senderAddress).to.eq(takerAddress);
                expect(fill1LogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fill1LogArgs.makerAssetData).to.eq(order1.makerAssetData);
                expect(fill1LogArgs.takerAssetData).to.eq(order1.takerAssetData);
                expect(fill1LogArgs.makerAssetFilledAmount).to.bignumber.eq(order1.makerAssetAmount);
                expect(fill1LogArgs.takerAssetFilledAmount).to.bignumber.eq(order1.takerAssetAmount);
                expect(fill1LogArgs.makerFeePaid).to.bignumber.eq(order1.makerFee);
                expect(fill1LogArgs.takerFeePaid).to.bignumber.eq(order1.takerFee);
                expect(fill1LogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order1));

                const fill2LogArgs = (fillLogs[1] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fill2LogArgs.makerAddress).to.eq(makerAddress);
                expect(fill2LogArgs.takerAddress).to.eq(takerAddress);
                expect(fill2LogArgs.senderAddress).to.eq(takerAddress);
                expect(fill2LogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fill2LogArgs.makerAssetData).to.eq(order2.makerAssetData);
                expect(fill2LogArgs.takerAssetData).to.eq(order2.takerAssetData);
                expect(fill2LogArgs.makerAssetFilledAmount).to.bignumber.eq(order2.makerAssetAmount);
                expect(fill2LogArgs.takerAssetFilledAmount).to.bignumber.eq(order2.takerAssetAmount);
                expect(fill2LogArgs.makerFeePaid).to.bignumber.eq(order2.makerFee);
                expect(fill2LogArgs.takerFeePaid).to.bignumber.eq(order2.takerFee);
                expect(fill2LogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order2));
            });
            it('should successfully call fillOrder via 2 transactions when one is signed by taker1 and executeTransaction is called by taker2', async () => {
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
                const transaction1 = await takerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await taker2TransactionFactory.newSignedTransactionAsync({ data: data2 });
                transaction2.signature = constants.NULL_BYTES;
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    taker2Address,
                );

                const transactionExecutionLogs = transactionReceipt.logs.filter(
                    log =>
                        (log as LogWithDecodedArgs<ExchangeTransactionExecutionEventArgs>).event ===
                        'TransactionExecution',
                );
                expect(transactionExecutionLogs.length).to.eq(2);

                const execution1LogArgs = (transactionExecutionLogs[0] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution1LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction1),
                );

                const execution2LogArgs = (transactionExecutionLogs[1] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution2LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction2),
                );

                const fillLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                );
                expect(fillLogs.length).to.eq(2);

                const fill1LogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fill1LogArgs.makerAddress).to.eq(makerAddress);
                expect(fill1LogArgs.takerAddress).to.eq(takerAddress);
                expect(fill1LogArgs.senderAddress).to.eq(taker2Address);
                expect(fill1LogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fill1LogArgs.makerAssetData).to.eq(order1.makerAssetData);
                expect(fill1LogArgs.takerAssetData).to.eq(order1.takerAssetData);
                expect(fill1LogArgs.makerAssetFilledAmount).to.bignumber.eq(order1.makerAssetAmount);
                expect(fill1LogArgs.takerAssetFilledAmount).to.bignumber.eq(order1.takerAssetAmount);
                expect(fill1LogArgs.makerFeePaid).to.bignumber.eq(order1.makerFee);
                expect(fill1LogArgs.takerFeePaid).to.bignumber.eq(order1.takerFee);
                expect(fill1LogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order1));

                const fill2LogArgs = (fillLogs[1] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fill2LogArgs.makerAddress).to.eq(makerAddress);
                expect(fill2LogArgs.takerAddress).to.eq(taker2Address);
                expect(fill2LogArgs.senderAddress).to.eq(taker2Address);
                expect(fill2LogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fill2LogArgs.makerAssetData).to.eq(order2.makerAssetData);
                expect(fill2LogArgs.takerAssetData).to.eq(order2.takerAssetData);
                expect(fill2LogArgs.makerAssetFilledAmount).to.bignumber.eq(order2.makerAssetAmount);
                expect(fill2LogArgs.takerAssetFilledAmount).to.bignumber.eq(order2.takerAssetAmount);
                expect(fill2LogArgs.makerFeePaid).to.bignumber.eq(order2.makerFee);
                expect(fill2LogArgs.takerFeePaid).to.bignumber.eq(order2.takerFee);
                expect(fill2LogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order2));
            });
            it('should return the correct data for 2 different fillOrder calls', async () => {
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
                const transaction1 = await takerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await taker2TransactionFactory.newSignedTransactionAsync({ data: data2 });
                const returnData = await exchangeInstance.batchExecuteTransactions.callAsync(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                    { from: senderAddress },
                );
                const abi = artifacts.Exchange.compilerOutput.abi;
                const methodAbi = abi.filter(
                    abiItem => (abiItem as MethodAbi).name === ExchangeFunctionName.FillOrder,
                )[0] as MethodAbi;
                const abiEncoder = new AbiEncoder.Method(methodAbi);
                const fillResults1: FillResults = abiEncoder.decodeReturnValues(returnData[0]).fillResults;
                const fillResults2: FillResults = abiEncoder.decodeReturnValues(returnData[1]).fillResults;
                expect(fillResults1.makerAssetFilledAmount).to.be.bignumber.eq(order1.makerAssetAmount);
                expect(fillResults1.takerAssetFilledAmount).to.be.bignumber.eq(order1.takerAssetAmount);
                expect(fillResults1.makerFeePaid).to.be.bignumber.eq(order1.makerFee);
                expect(fillResults1.takerFeePaid).to.be.bignumber.eq(order1.takerFee);
                expect(fillResults2.makerAssetFilledAmount).to.be.bignumber.eq(order2.makerAssetAmount);
                expect(fillResults2.takerAssetFilledAmount).to.be.bignumber.eq(order2.takerAssetAmount);
                expect(fillResults2.makerFeePaid).to.be.bignumber.eq(order2.makerFee);
                expect(fillResults2.takerFeePaid).to.be.bignumber.eq(order2.takerFee);
            });
            it('should successfully call fillOrder and cancelOrder via 2 transactions', async () => {
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [
                    order2,
                ]);
                const transaction1 = await takerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await makerTransactionFactory.newSignedTransactionAsync({ data: data2 });
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    senderAddress,
                );

                const transactionExecutionLogs = transactionReceipt.logs.filter(
                    log =>
                        (log as LogWithDecodedArgs<ExchangeTransactionExecutionEventArgs>).event ===
                        'TransactionExecution',
                );
                expect(transactionExecutionLogs.length).to.eq(2);

                const execution1LogArgs = (transactionExecutionLogs[0] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution1LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction1),
                );

                const execution2LogArgs = (transactionExecutionLogs[1] as LogWithDecodedArgs<
                    ExchangeTransactionExecutionEventArgs
                >).args;
                expect(execution2LogArgs.transactionHash).to.equal(
                    transactionHashUtils.getTransactionHashHex(transaction2),
                );

                let fillLogIndex: number = 0;
                let cancelLogIndex: number = 0;
                const fillLogs = transactionReceipt.logs.filter((log, index) => {
                    if ((log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill') {
                        fillLogIndex = index;
                        return true;
                    }
                    return false;
                });
                const cancelLogs = transactionReceipt.logs.filter((log, index) => {
                    if ((log as LogWithDecodedArgs<ExchangeCancelEventArgs>).event === 'Cancel') {
                        cancelLogIndex = index;
                        return true;
                    }
                    return false;
                });
                expect(fillLogs.length).to.eq(1);
                expect(cancelLogs.length).to.eq(1);
                expect(cancelLogIndex).to.greaterThan(fillLogIndex);

                const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                expect(fillLogArgs.senderAddress).to.eq(senderAddress);
                expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(fillLogArgs.makerAssetData).to.eq(order1.makerAssetData);
                expect(fillLogArgs.takerAssetData).to.eq(order1.takerAssetData);
                expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(order1.makerAssetAmount);
                expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(order1.takerAssetAmount);
                expect(fillLogArgs.makerFeePaid).to.bignumber.eq(order1.makerFee);
                expect(fillLogArgs.takerFeePaid).to.bignumber.eq(order1.takerFee);
                expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order1));

                const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.senderAddress).to.eq(senderAddress);
                expect(cancelLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                expect(cancelLogArgs.makerAssetData).to.eq(order2.makerAssetData);
                expect(cancelLogArgs.takerAssetData).to.eq(order2.takerAssetData);
                expect(cancelLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(order2));
            });
            it('should return the correct data for a fillOrder and cancelOrder call', async () => {
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [
                    order2,
                ]);
                const transaction1 = await takerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await makerTransactionFactory.newSignedTransactionAsync({ data: data2 });
                const returnData = await exchangeInstance.batchExecuteTransactions.callAsync(
                    [transaction1, transaction2],
                    [transaction1.signature, transaction2.signature],
                    { from: senderAddress },
                );
                const abi = artifacts.Exchange.compilerOutput.abi;
                const methodAbi = abi.filter(
                    abiItem => (abiItem as MethodAbi).name === ExchangeFunctionName.FillOrder,
                )[0] as MethodAbi;
                const abiEncoder = new AbiEncoder.Method(methodAbi);
                const fillResults: FillResults = abiEncoder.decodeReturnValues(returnData[0]).fillResults;
                expect(fillResults.makerAssetFilledAmount).to.be.bignumber.eq(order1.makerAssetAmount);
                expect(fillResults.takerAssetFilledAmount).to.be.bignumber.eq(order1.takerAssetAmount);
                expect(fillResults.makerFeePaid).to.be.bignumber.eq(order1.makerFee);
                expect(fillResults.takerFeePaid).to.be.bignumber.eq(order1.takerFee);
                expect(returnData[1]).to.eq(constants.NULL_BYTES);
            });
            it('should revert if a single transaction reverts', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.CancelOrder, [order]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order]);
                const transaction1 = await makerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await takerTransactionFactory.newSignedTransactionAsync({ data: data2 });
                const tx = exchangeWrapper.batchExecuteTransactionsAsync([transaction1, transaction2], senderAddress);
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
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const transaction1 = await takerTransactionFactory.newSignedTransactionAsync({ data: data1 });
                const transaction2 = await taker2TransactionFactory.newSignedTransactionAsync({
                    data: data2,
                    expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
                });
                const tx = exchangeWrapper.batchExecuteTransactionsAsync([transaction1, transaction2], senderAddress);
                const expiredTransactionHash = transactionHashUtils.getTransactionHashHex(transaction2);
                const expectedError = new ExchangeRevertErrors.TransactionError(
                    ExchangeRevertErrors.TransactionErrorCode.Expired,
                    expiredTransactionHash,
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });
    });
});
