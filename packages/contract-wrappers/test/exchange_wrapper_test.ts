import { DummyERC20TokenContract } from '@0x/abi-gen-wrappers';
import { BlockchainLifecycle, callbackErrorReporter } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, orderHashUtils, signatureUtils } from '@0x/order-utils';
import { DoneCallback, RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import 'mocha';

import { ContractWrappers, ExchangeCancelEventArgs, ExchangeEvents, ExchangeFillEventArgs, OrderStatus } from '../src';
import { DecodedLogEvent } from '../src/types';

import { UntransferrableDummyERC20Token } from './artifacts/UntransferrableDummyERC20Token';
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
    let txHash: string;
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
        zrxTokenAddress = contractWrappers.exchange.zrxTokenAddress;
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
                txHash = await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#fillOrderNoThrowAsync', () => {
            it('should fill a valid order', async () => {
                txHash = await contractWrappers.exchange.fillOrderNoThrowAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#fillOrKillOrderAsync', () => {
            it('should fill or kill a valid order', async () => {
                txHash = await contractWrappers.exchange.fillOrKillOrderAsync(
                    signedOrder,
                    takerTokenFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#batchFillOrdersAsync', () => {
            it('should fill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                txHash = await contractWrappers.exchange.batchFillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#marketBuyOrdersAsync', () => {
            it('should maker buy', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const makerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.exchange.marketBuyOrdersAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#marketBuyOrdersNoThrowAsync', () => {
            it('should no throw maker buy', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const makerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.exchange.marketBuyOrdersNoThrowAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#marketSellOrdersAsync', () => {
            it('should maker sell', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.exchange.marketSellOrdersAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#marketSellOrdersNoThrowAsync', () => {
            it('should no throw maker sell', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmount = takerTokenFillAmount;
                txHash = await contractWrappers.exchange.marketSellOrdersNoThrowAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#batchFillOrdersNoThrowAsync', () => {
            it('should fill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                txHash = await contractWrappers.exchange.batchFillOrdersNoThrowAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                let orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
                orderInfo = await contractWrappers.exchange.getOrderInfoAsync(anotherSignedOrder);
                expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FullyFilled);
            });
        });
        describe('#batchFillOrKillOrdersAsync', () => {
            it('should fill or kill a batch of valid orders', async () => {
                const signedOrders = [signedOrder, anotherSignedOrder];
                const takerAssetFillAmounts = [takerTokenFillAmount, takerTokenFillAmount];
                txHash = await contractWrappers.exchange.batchFillOrKillOrdersAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
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
                txHash = await contractWrappers.exchange.matchOrdersAsync(
                    signedOrder,
                    matchingSignedOrder,
                    takerAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
    });
    describe('cancel order(s)', () => {
        describe('#cancelOrderAsync', () => {
            it('should cancel a valid order', async () => {
                txHash = await contractWrappers.exchange.cancelOrderAsync(signedOrder);
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#batchCancelOrdersAsync', () => {
            it('should cancel a batch of valid orders', async () => {
                const orders = [signedOrder, anotherSignedOrder];
                txHash = await contractWrappers.exchange.batchCancelOrdersAsync(orders);
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
        describe('#cancelOrdersUpTo/getOrderEpochAsync', () => {
            it('should cancel orders up to target order epoch', async () => {
                const targetOrderEpoch = new BigNumber(42);
                txHash = await contractWrappers.exchange.cancelOrdersUpToAsync(targetOrderEpoch, makerAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const orderEpoch = await contractWrappers.exchange.getOrderEpochAsync(
                    makerAddress,
                    constants.NULL_ADDRESS,
                );
                expect(orderEpoch).to.be.bignumber.equal(targetOrderEpoch.plus(1));
            });
        });
    });
    describe('#getZRXAssetData', () => {
        it('should get the asset data', () => {
            const ZRX_ASSET_DATA = contractWrappers.exchange.getZRXAssetData();
            const ASSET_DATA_HEX_LENGTH = 74;
            expect(ZRX_ASSET_DATA).to.have.length(ASSET_DATA_HEX_LENGTH);
        });
    });
    describe('#getOrderInfoAsync', () => {
        it('should get the order info', async () => {
            const orderInfo = await contractWrappers.exchange.getOrderInfoAsync(signedOrder);
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expect(orderInfo.orderHash).to.be.equal(orderHash);
        });
    });
    describe('#getOrdersInfoAsync', () => {
        it('should get the orders info', async () => {
            const ordersInfo = await contractWrappers.exchange.getOrdersInfoAsync([signedOrder, anotherSignedOrder]);
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expect(ordersInfo[0].orderHash).to.be.equal(orderHash);
            const anotherOrderHash = orderHashUtils.getOrderHashHex(anotherSignedOrder);
            expect(ordersInfo[1].orderHash).to.be.equal(anotherOrderHash);
        });
    });
    describe('#validateOrderFillableOrThrowAsync', () => {
        it('should throw if signature is invalid', async () => {
            const signedOrderWithInvalidSignature = {
                ...signedOrder,
                signature:
                    '0x1b61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403',
            };

            return expect(
                contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrderWithInvalidSignature),
            ).to.eventually.to.be.rejectedWith(RevertReason.InvalidOrderSignature);
        });
        it('should validate the order with the current balances and allowances for the maker', async () => {
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder, {
                validateRemainingOrderAmountIsFillable: false,
            });
        });
        it('should validate the order with remaining fillable amount for the order', async () => {
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
        });
        it('should validate the order with specified amount', async () => {
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder, {
                expectedFillTakerTokenAmount: signedOrder.takerAssetAmount,
            });
        });
        it('should throw if the amount is greater than the allowance/balance', async () => {
            return expect(
                contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder, {
                    // tslint:disable-next-line:custom-no-magic-numbers
                    expectedFillTakerTokenAmount: new BigNumber(2).pow(256).minus(1),
                }),
            ).to.eventually.to.be.rejected();
        });
        it('should throw when the maker does not have enough balance for the remaining order amount', async () => {
            const makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
            // Change maker balance to have less than the order amount
            const remainingBalance = makerBalance.minus(signedOrder.makerAssetAmount.minus(1));
            await web3Wrapper.awaitTransactionSuccessAsync(
                await contractWrappers.erc20Token.transferAsync(
                    makerTokenAddress,
                    makerAddress,
                    constants.NULL_ADDRESS,
                    remainingBalance,
                ),
            );
            return expect(
                contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder),
            ).to.eventually.to.be.rejected();
        });
        it('should validate the order when remaining order amount has some fillable amount', async () => {
            const makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
            // Change maker balance to have less than the order amount
            const remainingBalance = makerBalance.minus(signedOrder.makerAssetAmount.minus(1));
            await web3Wrapper.awaitTransactionSuccessAsync(
                await contractWrappers.erc20Token.transferAsync(
                    makerTokenAddress,
                    makerAddress,
                    constants.NULL_ADDRESS,
                    remainingBalance,
                ),
            );
            // An amount is still transferrable
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder, {
                validateRemainingOrderAmountIsFillable: false,
            });
        });
        it('should throw when the ERC20 token has transfer restrictions', async () => {
            const artifactDependencies = {};
            const untransferrableToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
                UntransferrableDummyERC20Token,
                provider,
                { from: userAddresses[0] },
                artifactDependencies,
                'UntransferrableToken',
                'UTT',
                new BigNumber(constants.ZRX_DECIMALS),
                // tslint:disable-next-line:custom-no-magic-numbers
                new BigNumber(2).pow(20).minus(1),
            );
            const untransferrableMakerAssetData = assetDataUtils.encodeERC20AssetData(untransferrableToken.address);
            const invalidSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                untransferrableMakerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await contractWrappers.erc20Token.setProxyAllowanceAsync(
                    untransferrableToken.address,
                    makerAddress,
                    signedOrder.makerAssetAmount,
                ),
            );
            return expect(
                contractWrappers.exchange.validateOrderFillableOrThrowAsync(invalidSignedOrder),
            ).to.eventually.to.be.rejectedWith('TRANSFER_FAILED');
        });
    });
    describe('#isValidSignature', () => {
        it('should check if the signature is valid', async () => {
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            let isValid = await contractWrappers.exchange.isValidSignatureAsync(
                orderHash,
                signedOrder.makerAddress,
                signedOrder.signature,
            );
            expect(isValid).to.be.true();
            isValid = await contractWrappers.exchange.isValidSignatureAsync(
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
            const isAllowed = await contractWrappers.exchange.isAllowedValidatorAsync(signerAddress, validatorAddress);
            expect(isAllowed).to.be.false();
        });
    });
    describe('#setSignatureValidatorApproval', () => {
        it('should set signature validator approval', async () => {
            const validatorAddress = constants.NULL_ADDRESS;
            const isApproved = true;
            const senderAddress = makerAddress;
            txHash = await contractWrappers.exchange.setSignatureValidatorApprovalAsync(
                validatorAddress,
                isApproved,
                senderAddress,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });
    });
    describe('#isTransactionExecutedAsync', () => {
        it('should check if the transaction is executed', async () => {
            const transactionHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            const isExecuted = await contractWrappers.exchange.isTransactionExecutedAsync(transactionHash);
            expect(isExecuted).to.be.false();
        });
    });
    describe('#getAssetProxyBySignatureAsync', () => {
        it('should fill or kill a valid order', async () => {
            const erc20ProxyId = await contractWrappers.erc20Proxy.getProxyIdAsync();
            const erc20ProxyAddressById = await contractWrappers.exchange.getAssetProxyBySignatureAsync(erc20ProxyId);
            const erc20ProxyAddress = contractWrappers.erc20Proxy.address;
            expect(erc20ProxyAddressById).to.be.equal(erc20ProxyAddress);
            const erc721ProxyId = await contractWrappers.erc721Proxy.getProxyIdAsync();
            const erc721ProxyAddressById = await contractWrappers.exchange.getAssetProxyBySignatureAsync(erc721ProxyId);
            const erc721ProxyAddress = contractWrappers.erc721Proxy.address;
            expect(erc721ProxyAddressById).to.be.equal(erc721ProxyAddress);
        });
    });
    describe('#preSignAsync/isPreSignedAsync', () => {
        it('should preSign the hash', async () => {
            const senderAddress = takerAddress;
            const hash = orderHashUtils.getOrderHashHex(signedOrder);
            const signerAddress = signedOrder.makerAddress;
            let isPreSigned = await contractWrappers.exchange.isPreSignedAsync(hash, signerAddress);
            expect(isPreSigned).to.be.false();
            txHash = await contractWrappers.exchange.preSignAsync(
                hash,
                signerAddress,
                signedOrder.signature,
                senderAddress,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            isPreSigned = await contractWrappers.exchange.isPreSignedAsync(hash, signerAddress);
            expect(isPreSigned).to.be.true();

            const preSignedSignature = '0x06';
            const isValidSignature = await contractWrappers.exchange.isValidSignatureAsync(
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
            const VERSION = '2.0.0';
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
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    takerAddress,
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
                await contractWrappers.exchange.cancelOrderAsync(signedOrder);
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
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    takerAddress,
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
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    takerTokenFillAmountInBaseUnits,
                    takerAddress,
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
            txHash = await contractWrappers.exchange.fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress);
            const eventName = ExchangeEvents.Fill;
            const indexFilterValues = {};
            const logs = await contractWrappers.exchange.getLogsAsync(eventName, blockRange, indexFilterValues);
            expect(logs).to.have.length(1);
            expect(logs[0].event).to.be.equal(eventName);
        });
        it('should only get the logs with the correct event name', async () => {
            txHash = await contractWrappers.exchange.fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
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
            txHash = await contractWrappers.exchange.fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const signedOrderWithAnotherMakerAddress = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                anotherMakerAddress,
                takerAddress,
                fillableAmount,
            );
            txHash = await contractWrappers.exchange.fillOrderAsync(
                signedOrderWithAnotherMakerAddress,
                takerTokenFillAmount,
                takerAddress,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);

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
