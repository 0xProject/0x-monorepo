// tslint:disable: max-file-line-count
import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    chaiSetup,
    constants,
    FillResults,
    LogDecoder,
    OrderFactory,
    provider,
    TransactionFactory,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import {
    assetDataUtils,
    ExchangeRevertErrors,
    generatePseudoRandomSalt,
    orderHashUtils,
    transactionHashUtils,
} from '@0x/order-utils';
import { EIP712DomainWithDefaultSchema, OrderStatus, RevertReason } from '@0x/types';
import { AbiEncoder, BigNumber, providerUtils } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs, MethodAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import {
    artifacts,
    constants as exchangeConstants,
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeContract,
    exchangeDataEncoder,
    ExchangeFillEventArgs,
    ExchangeFunctionName,
    ExchangeSignatureValidatorApprovalEventArgs,
    ExchangeWrapper,
    ExchangeWrapperContract,
    WhitelistContract,
} from '../src/';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Exchange transactions', () => {
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
    let zrxToken: DummyERC20TokenContract;
    let exchangeInstance: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;

    let domain: EIP712DomainWithDefaultSchema;
    let orderFactory: OrderFactory;
    let makerTransactionFactory: TransactionFactory;
    let takerTransactionFactory: TransactionFactory;
    let taker2TransactionFactory: TransactionFactory;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;

    let defaultMakerTokenAddress: string;
    let defaultTakerTokenAddress: string;
    let makerPrivateKey: Buffer;
    let takerPrivateKey: Buffer;
    let taker2PrivateKey: Buffer;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        chainId = await providerUtils.getChainIdAsync(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([
            owner,
            senderAddress,
            makerAddress,
            takerAddress,
            feeRecipientAddress,
            validatorAddress,
            taker2Address,
        ] = _.slice(accounts, 0, 7));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetDataUtils.encodeERC20AssetData(zrxToken.address),
            new BigNumber(chainId),
        );
        exchangeWrapper = new ExchangeWrapper(exchangeInstance, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, { from: owner }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        defaultMakerTokenAddress = erc20TokenA.address;
        defaultTakerTokenAddress = erc20TokenB.address;

        domain = {
            verifyingContractAddress: exchangeInstance.address,
            chainId,
        };

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerTokenAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerTokenAddress),
            domain,
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
        describe('fill methods', () => {
            for (const fnName of [
                ...exchangeConstants.SINGLE_FILL_FN_NAMES,
                ...exchangeConstants.BATCH_FILL_FN_NAMES,
                ...exchangeConstants.MARKET_FILL_FN_NAMES,
            ]) {
                it(`${fnName} should revert if signature is invalid and not called by signer`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
                    const v = ethUtil.toBuffer(transaction.signature.slice(0, 4));
                    const invalidR = ethUtil.sha3('invalidR');
                    const invalidS = ethUtil.sha3('invalidS');
                    const signatureType = ethUtil.toBuffer(`0x${transaction.signature.slice(-2)}`);
                    const invalidSigBuff = Buffer.concat([v, invalidR, invalidS, signatureType]);
                    const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
                    transaction.signature = invalidSigHex;
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const expectedError = new ExchangeRevertErrors.TransactionSignatureError(
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
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                    const fillResults: FillResults =
                        decodedReturnData.fillResults === undefined
                            ? decodedReturnData.totalFillResults
                            : decodedReturnData.fillResults;
                    expect(fillResults.makerAssetFilledAmount).to.be.bignumber.eq(order.makerAssetAmount);
                    expect(fillResults.takerAssetFilledAmount).to.be.bignumber.eq(order.takerAssetAmount);
                    expect(fillResults.makerFeePaid).to.be.bignumber.eq(order.makerFee);
                    expect(fillResults.takerFeePaid).to.be.bignumber.eq(order.takerFee);
                });
                it(`${fnName} should revert if transaction has already been executed`, async () => {
                    const orders = [await orderFactory.newSignedOrderAsync()];
                    const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                    const recursiveData = exchangeInstance.executeTransaction.getABIEncodedTransactionData(
                        transaction,
                        transaction.signature,
                    );
                    const recursiveTransaction = takerTransactionFactory.newSignedTransaction(recursiveData);
                    const recursiveTransactionHashHex = transactionHashUtils.getTransactionHashHex(
                        recursiveTransaction,
                    );
                    const noReentrancyError = new ExchangeRevertErrors.TransactionError(
                        ExchangeRevertErrors.TransactionErrorCode.NoReentrancy,
                        transactionHashHex,
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
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
                    const recursiveData = exchangeInstance.executeTransaction.getABIEncodedTransactionData(
                        transaction,
                        constants.NULL_BYTES,
                    );
                    const recursiveTransaction = takerTransactionFactory.newSignedTransaction(recursiveData);
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
                    ].indexOf(fnName) === -1
                ) {
                    it(`${fnName} should revert and rethrow error if the underlying function reverts`, async () => {
                        const order = await orderFactory.newSignedOrderAsync();
                        order.signature = constants.NULL_BYTES;
                        const orders = [order];
                        const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                        const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                const transaction = takerTransactionFactory.newSignedTransaction(data);
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const nestedError = new ExchangeRevertErrors.InvalidMakerError(
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
                const transaction = makerTransactionFactory.newSignedTransaction(data);
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
                const transaction = makerTransactionFactory.newSignedTransaction(data);
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
                const transaction = takerTransactionFactory.newSignedTransaction(data);
                const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
                const nestedError = new ExchangeRevertErrors.InvalidMakerError(
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
                const transaction = makerTransactionFactory.newSignedTransaction(data);
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
                const transaction = makerTransactionFactory.newSignedTransaction(data);
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
                const transaction = makerTransactionFactory.newSignedTransaction(data);
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, senderAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).event === 'CancelUpTo',
                );
                expect(cancelLogs.length).to.eq(1);
                const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.senderAddress).to.eq(senderAddress);
                expect(cancelLogArgs.orderEpoch).to.bignumber.eq(targetEpoch.plus(1));
            });
            it('should be successful if called by maker without a signature', async () => {
                const targetEpoch = constants.ZERO_AMOUNT;
                const data = exchangeInstance.cancelOrdersUpTo.getABIEncodedTransactionData(targetEpoch);
                const transaction = makerTransactionFactory.newSignedTransaction(data);
                const transactionReceipt = await exchangeWrapper.executeTransactionAsync(transaction, makerAddress);
                const cancelLogs = transactionReceipt.logs.filter(
                    log => (log as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).event === 'CancelUpTo',
                );
                expect(cancelLogs.length).to.eq(1);
                const cancelLogArgs = (cancelLogs[0] as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>).args;
                expect(cancelLogArgs.makerAddress).to.eq(makerAddress);
                expect(cancelLogArgs.senderAddress).to.eq(constants.NULL_ADDRESS);
                expect(cancelLogArgs.orderEpoch).to.bignumber.eq(targetEpoch.plus(1));
            });
        });
        describe('preSign', () => {
            it('should preSign a hash for the signer', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const orderHash = orderHashUtils.getOrderHashHex(order);
                const data = exchangeInstance.preSign.getABIEncodedTransactionData(orderHash);
                const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                expect(validatorApprovalLogArgs.approved).to.eq(shouldApprove);
            });
            it('should approve a validator for the caller if called with no signature', async () => {
                const shouldApprove = true;
                const data = exchangeInstance.setSignatureValidatorApproval.getABIEncodedTransactionData(
                    validatorAddress,
                    shouldApprove,
                );
                const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                expect(validatorApprovalLogArgs.approved).to.eq(shouldApprove);
            });
        });
        describe('setOrderValidatorApproval', () => {
            it('should approve a validator for the signer', async () => {
                const shouldApprove = true;
                const data = exchangeInstance.setOrderValidatorApproval.getABIEncodedTransactionData(
                    validatorAddress,
                    shouldApprove,
                );
                const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                expect(validatorApprovalLogArgs.approved).to.eq(shouldApprove);
            });
            it('should approve a validator for the caller if called without a signature', async () => {
                const shouldApprove = true;
                const data = exchangeInstance.setOrderValidatorApproval.getABIEncodedTransactionData(
                    validatorAddress,
                    shouldApprove,
                );
                const transaction = takerTransactionFactory.newSignedTransaction(data);
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
                expect(validatorApprovalLogArgs.approved).to.eq(shouldApprove);
            });
        });
        describe('batchExecuteTransactions', () => {
            it('should successfully call fillOrder via 2 transactions with different taker signatures', async () => {
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync();
                const data1 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order1]);
                const data2 = exchangeDataEncoder.encodeOrdersToExchangeData(ExchangeFunctionName.FillOrder, [order2]);
                const transaction1 = takerTransactionFactory.newSignedTransaction(data1);
                const transaction2 = taker2TransactionFactory.newSignedTransaction(data2);
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    senderAddress,
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
                const transaction1 = takerTransactionFactory.newSignedTransaction(data1);
                const transaction2 = takerTransactionFactory.newSignedTransaction(data2);
                transaction1.signature = constants.NULL_BYTES;
                transaction2.signature = constants.NULL_BYTES;
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    takerAddress,
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
                const transaction1 = takerTransactionFactory.newSignedTransaction(data1);
                const transaction2 = taker2TransactionFactory.newSignedTransaction(data2);
                transaction2.signature = constants.NULL_BYTES;
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    taker2Address,
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
                const transaction1 = takerTransactionFactory.newSignedTransaction(data1);
                const transaction2 = taker2TransactionFactory.newSignedTransaction(data2);
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
                const transaction1 = takerTransactionFactory.newSignedTransaction(data1);
                const transaction2 = makerTransactionFactory.newSignedTransaction(data2);
                const transactionReceipt = await exchangeWrapper.batchExecuteTransactionsAsync(
                    [transaction1, transaction2],
                    senderAddress,
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
                const transaction1 = takerTransactionFactory.newSignedTransaction(data1);
                const transaction2 = makerTransactionFactory.newSignedTransaction(data2);
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
                const transaction1 = makerTransactionFactory.newSignedTransaction(data1);
                const transaction2 = takerTransactionFactory.newSignedTransaction(data2);
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
        });
        describe('examples', () => {
            describe('ExchangeWrapper', () => {
                let exchangeWrapperContract: ExchangeWrapperContract;

                before(async () => {
                    exchangeWrapperContract = await ExchangeWrapperContract.deployFrom0xArtifactAsync(
                        artifacts.ExchangeWrapper,
                        provider,
                        txDefaults,
                        exchangeInstance.address,
                    );
                });

                it("should cancel an order if called from the order's sender", async () => {
                    const orderSalt = constants.ZERO_AMOUNT;
                    const signedOrder = await orderFactory.newSignedOrderAsync({
                        senderAddress: exchangeWrapperContract.address,
                        salt: orderSalt,
                    });
                    const targetOrderEpoch = orderSalt.plus(1);
                    const cancelData = exchangeInstance.cancelOrdersUpTo.getABIEncodedTransactionData(targetOrderEpoch);
                    const cancelTransaction = makerTransactionFactory.newSignedTransaction(cancelData);
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await exchangeWrapperContract.cancelOrdersUpTo.sendTransactionAsync(
                            targetOrderEpoch,
                            cancelTransaction.salt,
                            cancelTransaction.signature,
                            { from: makerAddress },
                        ),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );

                    const takerAssetFillAmount = signedOrder.takerAssetAmount;
                    const fillData = exchangeInstance.fillOrder.getABIEncodedTransactionData(
                        signedOrder,
                        takerAssetFillAmount,
                        signedOrder.signature,
                    );
                    const fillTransaction = takerTransactionFactory.newSignedTransaction(fillData);
                    const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
                    const transactionHashHex = transactionHashUtils.getTransactionHashHex(fillTransaction);
                    const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                        transactionHashHex,
                        new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.Cancelled).encode(),
                    );
                    const tx = exchangeWrapperContract.fillOrder.sendTransactionAsync(
                        signedOrder,
                        takerAssetFillAmount,
                        fillTransaction.salt,
                        signedOrder.signature,
                        fillTransaction.signature,
                        { from: takerAddress },
                    );
                    return expect(tx).to.revertWith(expectedError);
                });

                it("should not cancel an order if not called from the order's sender", async () => {
                    const orderSalt = constants.ZERO_AMOUNT;
                    const signedOrder = await orderFactory.newSignedOrderAsync({
                        senderAddress: exchangeWrapperContract.address,
                        salt: orderSalt,
                    });
                    const targetOrderEpoch = orderSalt.plus(1);
                    await exchangeWrapper.cancelOrdersUpToAsync(targetOrderEpoch, makerAddress);

                    const takerAssetFillAmount = signedOrder.takerAssetAmount;
                    const data = exchangeInstance.fillOrder.getABIEncodedTransactionData(
                        signedOrder,
                        takerAssetFillAmount,
                        signedOrder.signature,
                    );
                    const transaction = takerTransactionFactory.newSignedTransaction(data);
                    const logDecoder = new LogDecoder(web3Wrapper, artifacts);
                    const transactionReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                        await exchangeWrapperContract.fillOrder.sendTransactionAsync(
                            signedOrder,
                            takerAssetFillAmount,
                            transaction.salt,
                            signedOrder.signature,
                            transaction.signature,
                            { from: takerAddress },
                        ),
                    );
                    const fillLogs = transactionReceipt.logs.filter(
                        log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                    );
                    expect(fillLogs.length).to.eq(1);
                    const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                    expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                    expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                    expect(fillLogArgs.senderAddress).to.eq(exchangeWrapperContract.address);
                    expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(fillLogArgs.makerAssetData).to.eq(signedOrder.makerAssetData);
                    expect(fillLogArgs.takerAssetData).to.eq(signedOrder.takerAssetData);
                    expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(signedOrder.makerAssetAmount);
                    expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(signedOrder.takerAssetAmount);
                    expect(fillLogArgs.makerFeePaid).to.bignumber.eq(signedOrder.makerFee);
                    expect(fillLogArgs.takerFeePaid).to.bignumber.eq(signedOrder.takerFee);
                    expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(signedOrder));
                });
            });
            describe('Whitelist', () => {
                let whitelistContract: WhitelistContract;
                before(async () => {
                    whitelistContract = await WhitelistContract.deployFrom0xArtifactAsync(
                        artifacts.Whitelist,
                        provider,
                        txDefaults,
                        exchangeInstance.address,
                    );
                    const isApproved = true;
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await exchangeInstance.setSignatureValidatorApproval.sendTransactionAsync(
                            whitelistContract.address,
                            isApproved,
                            { from: takerAddress },
                        ),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );
                });

                it('should revert if maker has not been whitelisted', async () => {
                    const isApproved = true;
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await whitelistContract.updateWhitelistStatus.sendTransactionAsync(takerAddress, isApproved, {
                            from: owner,
                        }),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );

                    const signedOrder = await orderFactory.newSignedOrderAsync({
                        senderAddress: whitelistContract.address,
                    });
                    const takerAssetFillAmount = signedOrder.takerAssetAmount;
                    const salt = generatePseudoRandomSalt();
                    const tx = whitelistContract.fillOrderIfWhitelisted.sendTransactionAsync(
                        signedOrder,
                        takerAssetFillAmount,
                        salt,
                        signedOrder.signature,
                        { from: takerAddress },
                    );
                    return expect(tx).to.revertWith(RevertReason.MakerNotWhitelisted);
                });

                it('should revert if taker has not been whitelisted', async () => {
                    const isApproved = true;
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await whitelistContract.updateWhitelistStatus.sendTransactionAsync(makerAddress, isApproved, {
                            from: owner,
                        }),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );

                    const signedOrder = await orderFactory.newSignedOrderAsync({
                        senderAddress: whitelistContract.address,
                    });
                    const takerAssetFillAmount = signedOrder.takerAssetAmount;
                    const salt = generatePseudoRandomSalt();
                    const tx = whitelistContract.fillOrderIfWhitelisted.sendTransactionAsync(
                        signedOrder,
                        takerAssetFillAmount,
                        salt,
                        signedOrder.signature,
                        { from: takerAddress },
                    );
                    return expect(tx).to.revertWith(RevertReason.TakerNotWhitelisted);
                });

                it('should fill the order if maker and taker have been whitelisted', async () => {
                    const isApproved = true;
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await whitelistContract.updateWhitelistStatus.sendTransactionAsync(makerAddress, isApproved, {
                            from: owner,
                        }),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );

                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await whitelistContract.updateWhitelistStatus.sendTransactionAsync(takerAddress, isApproved, {
                            from: owner,
                        }),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );

                    const signedOrder = await orderFactory.newSignedOrderAsync({
                        senderAddress: whitelistContract.address,
                    });
                    const takerAssetFillAmount = signedOrder.takerAssetAmount;
                    const salt = generatePseudoRandomSalt();
                    const logDecoder = new LogDecoder(web3Wrapper, artifacts);
                    const transactionReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                        await whitelistContract.fillOrderIfWhitelisted.sendTransactionAsync(
                            signedOrder,
                            takerAssetFillAmount,
                            salt,
                            signedOrder.signature,
                            { from: takerAddress },
                        ),
                    );

                    const fillLogs = transactionReceipt.logs.filter(
                        log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
                    );
                    expect(fillLogs.length).to.eq(1);
                    const fillLogArgs = (fillLogs[0] as LogWithDecodedArgs<ExchangeFillEventArgs>).args;
                    expect(fillLogArgs.makerAddress).to.eq(makerAddress);
                    expect(fillLogArgs.takerAddress).to.eq(takerAddress);
                    expect(fillLogArgs.senderAddress).to.eq(whitelistContract.address);
                    expect(fillLogArgs.feeRecipientAddress).to.eq(feeRecipientAddress);
                    expect(fillLogArgs.makerAssetData).to.eq(signedOrder.makerAssetData);
                    expect(fillLogArgs.takerAssetData).to.eq(signedOrder.takerAssetData);
                    expect(fillLogArgs.makerAssetFilledAmount).to.bignumber.eq(signedOrder.makerAssetAmount);
                    expect(fillLogArgs.takerAssetFilledAmount).to.bignumber.eq(signedOrder.takerAssetAmount);
                    expect(fillLogArgs.makerFeePaid).to.bignumber.eq(signedOrder.makerFee);
                    expect(fillLogArgs.takerFeePaid).to.bignumber.eq(signedOrder.takerFee);
                    expect(fillLogArgs.orderHash).to.eq(orderHashUtils.getOrderHashHex(signedOrder));
                });
            });
        });
    });
});
