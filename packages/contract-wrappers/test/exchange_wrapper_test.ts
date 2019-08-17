import { BlockchainLifecycle, callbackErrorReporter } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, orderHashUtils, signatureUtils } from '@0x/order-utils';
import { DoneCallback, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import 'mocha';

import { ContractWrappers, ExchangeCancelEventArgs, ExchangeEvents, ExchangeFillEventArgs, OrderStatus } from '../src';
import { DecodedLogEvent } from '../src/types';
import { _getDefaultContractAddresses } from '../src/utils/contract_addresses';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { migrateOnceAsync } from './utils/migrate';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ExchangeWrapper', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAddress: string;
    let anotherMakerAddress: string;
    let takerAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    const fillableAmount = new BigNumber(5);
    const takerTokenFillAmount = new BigNumber(5);
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;

    before(async () => {
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = contractAddresses.zrxToken;
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
            contractWrappers.erc721Proxy.address,
        );
        [, makerAddress, takerAddress, , anotherMakerAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        signedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
        );
        anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
        );
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
    describe('fill order(s)', () => {
        describe('#fillOrderAsync', () => {
            it('should fill a valid order', async () => {
                await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    signedOrder.signature,
                    { from: takerAddress },
                );
            });
        });
        describe('#fillOrderNoThrowAsync', () => {
            it('should fill a valid order', async () => {
                await contractWrappers.exchange.fillOrderNoThrow.awaitTransactionSuccessAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    signedOrder.signature,
                    { from: takerAddress },
                );
                const orderInfo = await contractWrappers.exchange.getOrderInfo.callAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#fillOrKillOrderAsync', () => {
            it('should fill or kill a valid order', async () => {
                await contractWrappers.exchange.fillOrKillOrder.awaitTransactionSuccessAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    signedOrder.signature,
                    { from: takerAddress },
                );
            });
        });
        describe('#batchFillOrdersAsync', () => {
            it('should fill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                await contractWrappers.exchange.batchFillOrders.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(o => o.signature),
                    { from: takerAddress },
                );
            });
        });
        describe('#marketBuyOrdersAsync', () => {
            it('should maker buy', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const makerAssetFillAmount = takerTokenFillAmount;
                await contractWrappers.exchange.marketBuyOrders.awaitTransactionSuccessAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(o => o.signature),
                    { from: takerAddress },
                );
            });
        });
        describe('#marketBuyOrdersNoThrowAsync', () => {
            it('should no throw maker buy', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const makerAssetFillAmount = takerTokenFillAmount;
                await contractWrappers.exchange.marketBuyOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(o => o.signature),
                    { from: takerAddress },
                );
                const orderInfo = await contractWrappers.exchange.getOrderInfo.callAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#marketSellOrdersAsync', () => {
            it('should maker sell', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmount = takerTokenFillAmount;
                await contractWrappers.exchange.marketSellOrders.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(o => o.signature),
                    { from: takerAddress },
                );
            });
        });
        describe('#marketSellOrdersNoThrowAsync', () => {
            it('should no throw maker sell', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmount = takerTokenFillAmount;
                await contractWrappers.exchange.marketSellOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(o => o.signature),
                    { from: takerAddress },
                );
                const orderInfo = await contractWrappers.exchange.getOrderInfo.callAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#batchFillOrdersNoThrowAsync', () => {
            it('should fill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                await contractWrappers.exchange.batchFillOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(o => o.signature),
                    { from: takerAddress },
                );
                let orderInfo = await contractWrappers.exchange.getOrderInfo.callAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
                orderInfo = await contractWrappers.exchange.getOrderInfo.callAsync(anotherSignedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#batchFillOrKillOrdersAsync', () => {
            it('should fill or kill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                await contractWrappers.exchange.batchFillOrKillOrders.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(o => o.signature),
                    { from: takerAddress },
                );
            });
        });
        describe('#matchOrdersAsync', () => {
            it('should match two valid ordersr', async () => {
                const matchingSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    takerAssetData,
                    makerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                await contractWrappers.exchange.matchOrders.awaitTransactionSuccessAsync(
                    signedOrder,
                    matchingSignedOrder,
                    signedOrder.signature,
                    matchingSignedOrder.signature,
                    { from: takerAddress },
                );
            });
        });
    });
    describe('cancel order(s)', () => {
        describe('#cancelOrderAsync', () => {
            it('should cancel a valid order', async () => {
                await contractWrappers.exchange.cancelOrder.awaitTransactionSuccessAsync(signedOrder, {
                    from: makerAddress,
                });
            });
        });
        describe('#batchCancelOrdersAsync', () => {
            it('should cancel a batch of valid orders', async () => {
                const orders = [signedOrder, anotherSignedOrder];
                await contractWrappers.exchange.batchCancelOrders.awaitTransactionSuccessAsync(orders, {
                    from: makerAddress,
                });
            });
        });
        describe('#cancelOrdersUpTo/getOrderEpochAsync', () => {
            it('should cancel orders up to target order epoch', async () => {
                const targetOrderEpoch = new BigNumber(42);
                await contractWrappers.exchange.cancelOrdersUpTo.awaitTransactionSuccessAsync(targetOrderEpoch, {
                    from: makerAddress,
                });
                const orderEpoch = await contractWrappers.exchange.orderEpoch.callAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                );
                expect(orderEpoch).to.be.bignumber.equal(targetOrderEpoch.plus(1));
            });
        });
    });
    describe('#getOrderInfoAsync', () => {
        it('should get the order info', async () => {
            const orderInfo = await contractWrappers.exchange.getOrderInfo.callAsync(signedOrder);
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expect(orderInfo.orderHash).to.be.equal(orderHash);
        });
    });
    describe('#getOrdersInfoAsync', () => {
        it('should get the orders info', async () => {
            const ordersInfo = await contractWrappers.exchange.getOrdersInfo.callAsync([
                signedOrder,
                anotherSignedOrder,
            ]);
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expect(ordersInfo[0].orderHash).to.be.equal(orderHash);
            const anotherOrderHash = orderHashUtils.getOrderHashHex(anotherSignedOrder);
            expect(ordersInfo[1].orderHash).to.be.equal(anotherOrderHash);
        });
    });
    describe('#isValidSignature', () => {
        it('should check if the signature is valid', async () => {
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            let isValid = await contractWrappers.exchange.isValidSignature.callAsync(
                orderHash,
                signedOrder.makerAddress,
                signedOrder.signature,
            );
            expect(isValid).to.be.true();
            isValid = await contractWrappers.exchange.isValidSignature.callAsync(
                orderHash,
                signedOrder.takerAddress,
                signedOrder.signature,
            );
            expect(isValid).to.be.false();
        });
    });
    describe('#isAllowedValidatorAsync', () => {
        it('should check if the validator is allowed', async () => {
            const signerAddress = makerAddress;
            const validatorAddress = constants.NULL_ADDRESS;
            const isAllowed = await contractWrappers.exchange.allowedValidators.callAsync(
                signerAddress,
                validatorAddress,
            );
            expect(isAllowed).to.be.false();
        });
    });
    describe('#setSignatureValidatorApproval', () => {
        it('should set signature validator approval', async () => {
            const validatorAddress = constants.NULL_ADDRESS;
            const isApproved = true;
            const senderAddress = makerAddress;
            await contractWrappers.exchange.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                validatorAddress,
                isApproved,
                { from: senderAddress },
            );
        });
    });
    describe('#isTransactionExecutedAsync', () => {
        it('should check if the transaction is executed', async () => {
            const transactionHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            const isExecuted = await contractWrappers.exchange.transactions.callAsync(transactionHash);
            expect(isExecuted).to.be.false();
        });
    });
    describe('#getAssetProxyBySignatureAsync', () => {
        it('should fill or kill a valid order', async () => {
            const erc20ProxyId = await contractWrappers.erc20Proxy.getProxyId.callAsync();
            const erc20ProxyAddressById = await contractWrappers.exchange.getAssetProxy.callAsync(erc20ProxyId);
            const erc20ProxyAddress = contractWrappers.erc20Proxy.address;
            expect(erc20ProxyAddressById).to.be.equal(erc20ProxyAddress);
            const erc721ProxyId = await contractWrappers.erc721Proxy.getProxyId.callAsync();
            const erc721ProxyAddressById = await contractWrappers.exchange.getAssetProxy.callAsync(erc721ProxyId);
            const erc721ProxyAddress = contractWrappers.erc721Proxy.address;
            expect(erc721ProxyAddressById).to.be.equal(erc721ProxyAddress);
        });
    });
    describe('#preSign/isPresigned', () => {
        it('should preSign the hash', async () => {
            const senderAddress = takerAddress;
            const hash = orderHashUtils.getOrderHashHex(signedOrder);
            const signerAddress = signedOrder.makerAddress;
            let isPreSigned = await contractWrappers.exchange.preSigned.callAsync(hash, signerAddress);
            expect(isPreSigned).to.be.false();
            await contractWrappers.exchange.preSign.awaitTransactionSuccessAsync(
                hash,
                signerAddress,
                signedOrder.signature,
                { from: senderAddress },
            );
            isPreSigned = await contractWrappers.exchange.preSigned.callAsync(hash, signerAddress);
            expect(isPreSigned).to.be.true();

            const preSignedSignature = '0x06';
            const isValidSignature = await contractWrappers.exchange.isValidSignature.callAsync(
                hash,
                signerAddress,
                preSignedSignature,
            );
            expect(isValidSignature).to.be.true();

            // Test our TS implementation of signature validation
            const isValidSignatureInTs = await signatureUtils.isValidSignatureAsync(
                provider,
                hash,
                preSignedSignature,
                signerAddress,
            );
            expect(isValidSignatureInTs).to.be.true();
        });
    });
    describe('#getVersionAsync', () => {
        it('should return version the hash', async () => {
            const version = await contractWrappers.exchange.getVersionAsync();
            const VERSION = '3.0.0';
            expect(version).to.be.equal(VERSION);
        });
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        const takerTokenFillAmountInBaseUnits = new BigNumber(1);
        beforeEach(async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
        });
        afterEach(async () => {
            contractWrappers.exchange.unsubscribeAll();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribe` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the Fill event when an order is filled', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ExchangeFillEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.Fill);
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.Fill, indexFilterValues, callback);
                await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    signedOrder.signature,
                    { from: takerAddress },
                );
            })().catch(done);
        });
        it('Should receive the LogCancel event when an order is cancelled', (done: DoneCallback) => {
            (async () => {
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ExchangeCancelEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.Cancel);
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.Cancel, indexFilterValues, callback);
                await contractWrappers.exchange.cancelOrder.awaitTransactionSuccessAsync(signedOrder, {
                    from: makerAddress,
                });
            })().catch(done);
        });
        it('Outstanding subscriptions are cancelled when contractWrappers.unsubscribeAll called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ExchangeFillEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.Fill, indexFilterValues, callbackNeverToBeCalled);

                contractWrappers.unsubscribeAll();

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (logEvent: DecodedLogEvent<ExchangeFillEventArgs>) => {
                        expect(logEvent.log.event).to.be.equal(ExchangeEvents.Fill);
                    },
                );
                contractWrappers.exchange.subscribe(ExchangeEvents.Fill, indexFilterValues, callback);
                await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    signedOrder.signature,
                    { from: takerAddress },
                );
            })().catch(done);
        });
        it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
            (async () => {
                const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
                    (_logEvent: DecodedLogEvent<ExchangeFillEventArgs>) => {
                        done(new Error('Expected this subscription to have been cancelled'));
                    },
                );
                const subscriptionToken = contractWrappers.exchange.subscribe(
                    ExchangeEvents.Fill,
                    indexFilterValues,
                    callbackNeverToBeCalled,
                );
                contractWrappers.exchange.unsubscribe(subscriptionToken);
                await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    signedOrder.signature,
                    { from: takerAddress },
                );
                done();
            })().catch(done);
        });
    });
    describe('#getLogsAsync', () => {
        const blockRange = {
            fromBlock: 0,
            toBlock: BlockParamLiteral.Latest,
        };
        it('should get logs with decoded args emitted by Fill', async () => {
            await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                signedOrder,
                takerTokenFillAmount,
                signedOrder.signature,
                { from: takerAddress },
            );
            const eventName = ExchangeEvents.Fill;
            const indexFilterValues = {};
            const logs = await contractWrappers.exchange.getLogsAsync(eventName, blockRange, indexFilterValues);
            expect(logs).to.have.length(1);
            expect(logs[0].event).to.be.equal(eventName);
        });
        it('should only get the logs with the correct event name', async () => {
            await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                signedOrder,
                takerTokenFillAmount,
                signedOrder.signature,
                { from: takerAddress },
            );
            const differentEventName = ExchangeEvents.Cancel;
            const indexFilterValues = {};
            const logs = await contractWrappers.exchange.getLogsAsync(
                differentEventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(0);
        });
        it('should only get the logs with the correct indexed fields', async () => {
            await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                signedOrder,
                takerTokenFillAmount,
                signedOrder.signature,
                { from: takerAddress },
            );
            const signedOrderWithAnotherMakerAddress = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                anotherMakerAddress,
                takerAddress,
                fillableAmount,
            );
            await contractWrappers.exchange.fillOrder.awaitTransactionSuccessAsync(
                signedOrderWithAnotherMakerAddress,
                takerTokenFillAmount,
                signedOrderWithAnotherMakerAddress.signature,
                { from: takerAddress },
            );
            const eventName = ExchangeEvents.Fill;
            const indexFilterValues = {
                makerAddress: anotherMakerAddress,
            };
            const logs = await contractWrappers.exchange.getLogsAsync<ExchangeFillEventArgs>(
                eventName,
                blockRange,
                indexFilterValues,
            );
            expect(logs).to.have.length(1);
            const args = logs[0].args;
            expect(args.makerAddress).to.be.equal(anotherMakerAddress);
        });
    });
}); // tslint:disable:max-file-line-count
