import { ContractWrappers } from '@0xproject/contract-wrappers';
import { BlockchainLifecycle, callbackErrorReporter } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { getOrderHashHex } from '@0xproject/order-utils';
import { DoneCallback, Token } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'make-promises-safe';
import 'mocha';
import * as Sinon from 'sinon';

import { ExpirationWatcher } from '../src/order_watcher/expiration_watcher';
import { utils } from '../src/utils/utils';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { TokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const MILISECONDS_IN_SECOND = 1000;

describe('ExpirationWatcher', () => {
    let contractWrappers: ContractWrappers;
    let tokenUtils: TokenUtils;
    let tokens: Token[];
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
    const fillableAmount = new BigNumber(5);
    let currentUnixTimestampSec: BigNumber;
    let timer: Sinon.SinonFakeTimers;
    let expirationWatcher: ExpirationWatcher;
    before(async () => {
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(provider, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        const [makerToken, takerToken] = tokenUtils.getDummyTokens();
        makerTokenAddress = makerToken.address;
        takerTokenAddress = takerToken.address;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        const sinonTimerConfig = { shouldAdvanceTime: true } as any;
        // This constructor has incorrect types
        timer = Sinon.useFakeTimers(sinonTimerConfig);
        currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        expirationWatcher = new ExpirationWatcher();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
        timer.restore();
        expirationWatcher.unsubscribe();
    });
    it('correctly emits events when order expires', (done: DoneCallback) => {
        (async () => {
            const orderLifetimeSec = 60;
            const expirationUnixTimestampSec = currentUnixTimestampSec.plus(orderLifetimeSec);
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                expirationUnixTimestampSec,
            );
            const orderHash = getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationUnixTimestampSec.times(MILISECONDS_IN_SECOND));
            const callbackAsync = callbackErrorReporter.reportNoErrorCallbackErrors(done)((hash: string) => {
                expect(hash).to.be.equal(orderHash);
                expect(utils.getCurrentUnixTimestampSec()).to.be.bignumber.gte(expirationUnixTimestampSec);
            });
            expirationWatcher.subscribe(callbackAsync);
            timer.tick(orderLifetimeSec * MILISECONDS_IN_SECOND);
        })().catch(done);
    });
    it("doesn't emit events before order expires", (done: DoneCallback) => {
        (async () => {
            const orderLifetimeSec = 60;
            const expirationUnixTimestampSec = currentUnixTimestampSec.plus(orderLifetimeSec);
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                expirationUnixTimestampSec,
            );
            const orderHash = getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationUnixTimestampSec.times(MILISECONDS_IN_SECOND));
            const callbackAsync = callbackErrorReporter.reportNoErrorCallbackErrors(done)(async (hash: string) => {
                done(new Error('Emitted expiration went before the order actually expired'));
            });
            expirationWatcher.subscribe(callbackAsync);
            const notEnoughTime = orderLifetimeSec - 1;
            timer.tick(notEnoughTime * MILISECONDS_IN_SECOND);
            done();
        })().catch(done);
    });
    it('emits events in correct order', (done: DoneCallback) => {
        (async () => {
            const order1Lifetime = 60;
            const order2Lifetime = 120;
            const order1ExpirationUnixTimestampSec = currentUnixTimestampSec.plus(order1Lifetime);
            const order2ExpirationUnixTimestampSec = currentUnixTimestampSec.plus(order2Lifetime);
            const signedOrder1 = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                order1ExpirationUnixTimestampSec,
            );
            const signedOrder2 = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                order2ExpirationUnixTimestampSec,
            );
            const orderHash1 = getOrderHashHex(signedOrder1);
            const orderHash2 = getOrderHashHex(signedOrder2);
            expirationWatcher.addOrder(
                orderHash2,
                signedOrder2.expirationUnixTimestampSec.times(MILISECONDS_IN_SECOND),
            );
            expirationWatcher.addOrder(
                orderHash1,
                signedOrder1.expirationUnixTimestampSec.times(MILISECONDS_IN_SECOND),
            );
            const expirationOrder = [orderHash1, orderHash2];
            const expectToBeCalledOnce = false;
            const callbackAsync = callbackErrorReporter.reportNoErrorCallbackErrors(done, expectToBeCalledOnce)(
                (hash: string) => {
                    const orderHash = expirationOrder.shift();
                    expect(hash).to.be.equal(orderHash);
                    if (_.isEmpty(expirationOrder)) {
                        done();
                    }
                },
            );
            expirationWatcher.subscribe(callbackAsync);
            timer.tick(order2Lifetime * MILISECONDS_IN_SECOND);
        })().catch(done);
    });
    it('emits events in correct order when expirations are equal', (done: DoneCallback) => {
        (async () => {
            const order1Lifetime = 60;
            const order2Lifetime = 60;
            const order1ExpirationUnixTimestampSec = currentUnixTimestampSec.plus(order1Lifetime);
            const order2ExpirationUnixTimestampSec = currentUnixTimestampSec.plus(order2Lifetime);
            const signedOrder1 = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                order1ExpirationUnixTimestampSec,
            );
            const signedOrder2 = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                order2ExpirationUnixTimestampSec,
            );
            const orderHash1 = getOrderHashHex(signedOrder1);
            const orderHash2 = getOrderHashHex(signedOrder2);
            expirationWatcher.addOrder(
                orderHash1,
                signedOrder1.expirationUnixTimestampSec.times(MILISECONDS_IN_SECOND),
            );
            expirationWatcher.addOrder(
                orderHash2,
                signedOrder2.expirationUnixTimestampSec.times(MILISECONDS_IN_SECOND),
            );
            const expirationOrder = orderHash1 < orderHash2 ? [orderHash1, orderHash2] : [orderHash2, orderHash1];
            const expectToBeCalledOnce = false;
            const callbackAsync = callbackErrorReporter.reportNoErrorCallbackErrors(done, expectToBeCalledOnce)(
                (hash: string) => {
                    const orderHash = expirationOrder.shift();
                    expect(hash).to.be.equal(orderHash);
                    if (_.isEmpty(expirationOrder)) {
                        done();
                    }
                },
            );
            expirationWatcher.subscribe(callbackAsync);
            timer.tick(order2Lifetime * MILISECONDS_IN_SECOND);
        })().catch(done);
    });
});
