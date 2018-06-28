import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';

import { ContractWrappers } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
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
    let coinbase: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipient: string;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        await blockchainLifecycle.startAsync();
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = tokenUtils.getProtocolTokenAddress();
        fillScenarios = new FillScenarios(provider, userAddresses, zrxTokenAddress, exchangeContractAddress);
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
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
    describe.only('fill order(s)', () => {
        const fillableAmount = new BigNumber(5);
        const takerTokenFillAmount = new BigNumber(5);
        describe('#fillOrderAsync', () => {
            describe('successful fills', () => {
                it('should fill a valid order', async () => {
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress,
                        takerTokenAddress,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );
                    const txHash = await contractWrappers.exchange.fillOrderAsync(
                        signedOrder,
                        takerTokenFillAmount,
                        takerAddress,
                    );
                    console.log(await web3Wrapper.awaitTransactionSuccessAsync(txHash));
                });
            });
        });
    });
    // describe('#subscribe', () => {
    //     const indexFilterValues = {};
    //     const shouldThrowOnInsufficientBalanceOrAllowance = true;
    //     let makerTokenAddress: string;
    //     let takerTokenAddress: string;
    //     let coinbase: string;
    //     let takerAddress: string;
    //     let makerAddress: string;
    //     let fillableAmount: BigNumber;
    //     let signedOrder: SignedOrder;
    //     const takerTokenFillAmountInBaseUnits = new BigNumber(1);
    //     const cancelTakerAmountInBaseUnits = new BigNumber(1);
    //     before(() => {
    //         [coinbase, makerAddress, takerAddress] = userAddresses;
    //         const [makerToken, takerToken] = tokenUtils.getDummyTokens();
    //         makerTokenAddress = makerToken.address;
    //         takerTokenAddress = takerToken.address;
    //     });
    //     beforeEach(async () => {
    //         fillableAmount = new BigNumber(5);
    //         signedOrder = await fillScenarios.createFillableSignedOrderAsync(
    //             makerTokenAddress,
    //             takerTokenAddress,
    //             makerAddress,
    //             takerAddress,
    //             fillableAmount,
    //         );
    //     });
    //     afterEach(async () => {
    //         contractWrappers.exchange.unsubscribeAll();
    //     });
    //     // Hack: Mocha does not allow a test to be both async and have a `done` callback
    //     // Since we need to await the receipt of the event in the `subscribe` callback,
    //     // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
    //     // wrap the rest of the test in an async block
    //     // Source: https://github.com/mochajs/mocha/issues/2407
    //     it('Should receive the LogFill event when an order is filled', (done: DoneCallback) => {
    //         (async () => {
    //             const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
    //                 (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
    //                     expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogFill);
    //                 },
    //             );
    //             contractWrappers.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callback);
    //             await contractWrappers.exchange.fillOrderAsync(
    //                 signedOrder,
    //                 takerTokenFillAmountInBaseUnits,
    //                 shouldThrowOnInsufficientBalanceOrAllowance,
    //                 takerAddress,
    //             );
    //         })().catch(done);
    //     });
    //     it('Should receive the LogCancel event when an order is cancelled', (done: DoneCallback) => {
    //         (async () => {
    //             const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
    //                 (logEvent: DecodedLogEvent<LogCancelContractEventArgs>) => {
    //                     expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogCancel);
    //                 },
    //             );
    //             contractWrappers.exchange.subscribe(ExchangeEvents.LogCancel, indexFilterValues, callback);
    //             await contractWrappers.exchange.cancelOrderAsync(signedOrder, cancelTakerAmountInBaseUnits);
    //         })().catch(done);
    //     });
    //     it('Outstanding subscriptions are cancelled when contractWrappers.setProvider called', (done: DoneCallback) => {
    //         (async () => {
    //             const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
    //                 (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
    //                     done(new Error('Expected this subscription to have been cancelled'));
    //                 },
    //             );
    //             contractWrappers.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callbackNeverToBeCalled);

    //             contractWrappers.setProvider(provider, constants.TESTRPC_NETWORK_ID);

    //             const callback = callbackErrorReporter.reportNodeCallbackErrors(done)(
    //                 (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
    //                     expect(logEvent.log.event).to.be.equal(ExchangeEvents.LogFill);
    //                 },
    //             );
    //             contractWrappers.exchange.subscribe(ExchangeEvents.LogFill, indexFilterValues, callback);
    //             await contractWrappers.exchange.fillOrderAsync(
    //                 signedOrder,
    //                 takerTokenFillAmountInBaseUnits,
    //                 shouldThrowOnInsufficientBalanceOrAllowance,
    //                 takerAddress,
    //             );
    //         })().catch(done);
    //     });
    //     it('Should cancel subscription when unsubscribe called', (done: DoneCallback) => {
    //         (async () => {
    //             const callbackNeverToBeCalled = callbackErrorReporter.reportNodeCallbackErrors(done)(
    //                 (logEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
    //                     done(new Error('Expected this subscription to have been cancelled'));
    //                 },
    //             );
    //             const subscriptionToken = contractWrappers.exchange.subscribe(
    //                 ExchangeEvents.LogFill,
    //                 indexFilterValues,
    //                 callbackNeverToBeCalled,
    //             );
    //             contractWrappers.exchange.unsubscribe(subscriptionToken);
    //             await contractWrappers.exchange.fillOrderAsync(
    //                 signedOrder,
    //                 takerTokenFillAmountInBaseUnits,
    //                 shouldThrowOnInsufficientBalanceOrAllowance,
    //                 takerAddress,
    //             );
    //             done();
    //         })().catch(done);
    //     });
    // });
    // describe('#getZRXTokenAddressAsync', () => {
    //     it('gets the same token as is in token registry', () => {
    //         const zrxAddress = contractWrappers.exchange.getZRXTokenAddress();
    //         const zrxToken = tokenUtils.getProtocolTokenOrThrow();
    //         expect(zrxAddress).to.equal(zrxToken.address);
    //     });
    // });
    // describe('#getLogsAsync', () => {
    //     let makerTokenAddress: string;
    //     let takerTokenAddress: string;
    //     let makerAddress: string;
    //     let takerAddress: string;
    //     const fillableAmount = new BigNumber(5);
    //     const shouldThrowOnInsufficientBalanceOrAllowance = true;
    //     const blockRange: BlockRange = {
    //         fromBlock: 0,
    //         toBlock: BlockParamLiteral.Latest,
    //     };
    //     let txHash: string;
    //     before(async () => {
    //         [, makerAddress, takerAddress] = userAddresses;
    //         const [makerToken, takerToken] = tokenUtils.getDummyTokens();
    //         makerTokenAddress = makerToken.address;
    //         takerTokenAddress = takerToken.address;
    //     });
    //     it('should get logs with decoded args emitted by LogFill', async () => {
    //         const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
    //             makerTokenAddress,
    //             takerTokenAddress,
    //             makerAddress,
    //             takerAddress,
    //             fillableAmount,
    //         );
    //         txHash = await contractWrappers.exchange.fillOrderAsync(
    //             signedOrder,
    //             fillableAmount,
    //             shouldThrowOnInsufficientBalanceOrAllowance,
    //             takerAddress,
    //         );
    //         await web3Wrapper.awaitTransactionSuccessAsync(txHash);
    //         const eventName = ExchangeEvents.LogFill;
    //         const indexFilterValues = {};
    //         const logs = await contractWrappers.exchange.getLogsAsync(eventName, blockRange, indexFilterValues);
    //         expect(logs).to.have.length(1);
    //         expect(logs[0].event).to.be.equal(eventName);
    //     });
    //     it('should only get the logs with the correct event name', async () => {
    //         const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
    //             makerTokenAddress,
    //             takerTokenAddress,
    //             makerAddress,
    //             takerAddress,
    //             fillableAmount,
    //         );
    //         txHash = await contractWrappers.exchange.fillOrderAsync(
    //             signedOrder,
    //             fillableAmount,
    //             shouldThrowOnInsufficientBalanceOrAllowance,
    //             takerAddress,
    //         );
    //         await web3Wrapper.awaitTransactionSuccessAsync(txHash);
    //         const differentEventName = ExchangeEvents.LogCancel;
    //         const indexFilterValues = {};
    //         const logs = await contractWrappers.exchange.getLogsAsync(
    //             differentEventName,
    //             blockRange,
    //             indexFilterValues,
    //         );
    //         expect(logs).to.have.length(0);
    //     });
    //     it('should only get the logs with the correct indexed fields', async () => {
    //         const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
    //             makerTokenAddress,
    //             takerTokenAddress,
    //             makerAddress,
    //             takerAddress,
    //             fillableAmount,
    //         );
    //         txHash = await contractWrappers.exchange.fillOrderAsync(
    //             signedOrder,
    //             fillableAmount,
    //             shouldThrowOnInsufficientBalanceOrAllowance,
    //             takerAddress,
    //         );
    //         await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    //         const differentMakerAddress = userAddresses[2];
    //         const anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
    //             makerTokenAddress,
    //             takerTokenAddress,
    //             differentMakerAddress,
    //             takerAddress,
    //             fillableAmount,
    //         );
    //         txHash = await contractWrappers.exchange.fillOrderAsync(
    //             anotherSignedOrder,
    //             fillableAmount,
    //             shouldThrowOnInsufficientBalanceOrAllowance,
    //             takerAddress,
    //         );
    //         await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    //         const eventName = ExchangeEvents.LogFill;
    //         const indexFilterValues = {
    //             maker: differentMakerAddress,
    //         };
    //         const logs = await contractWrappers.exchange.getLogsAsync<LogFillContractEventArgs>(
    //             eventName,
    //             blockRange,
    //             indexFilterValues,
    //         );
    //         expect(logs).to.have.length(1);
    //         const args = logs[0].args;
    //         expect(args.maker).to.be.equal(differentMakerAddress);
    //     });
    // });
}); // tslint:disable:max-file-line-count
