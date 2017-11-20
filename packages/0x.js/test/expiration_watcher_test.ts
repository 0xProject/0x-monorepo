import 'mocha';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Sinon from 'sinon';
import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';
import {chaiSetup} from './utils/chai_setup';
import {web3Factory} from './utils/web3_factory';
import {utils} from '../src/utils/utils';
import {Web3Wrapper} from '../src/web3_wrapper';
import {TokenUtils} from './utils/token_utils';
import {ExpirationWatcher} from '../src/order_watcher/expiration_watcher';
import {Token, DoneCallback} from '../src/types';
import {ZeroEx} from '../src';
import {FillScenarios} from './utils/fill_scenarios';
import {reportCallbackErrors} from './utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;

describe('ExpirationWatcher', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
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
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        exchangeContractAddress = await zeroEx.exchange.getContractAddressAsync();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
        makerTokenAddress = makerToken.address;
        takerTokenAddress = takerToken.address;
    });
    beforeEach(() => {
        const sinonTimerConfig = {shouldAdvanceTime: true} as any;
        // This constructor has incorrect types
        timer = Sinon.useFakeTimers(sinonTimerConfig);
        currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        expirationWatcher = new ExpirationWatcher();
    });
    afterEach(() => {
        timer.restore();
        expirationWatcher.unsubscribe();
    });
    it('correctly emits events when order expires', (done: DoneCallback) => {
        (async () => {
            const orderLifetimeS = 60;
            const expirationUnixTimestampSec = currentUnixTimestampSec.plus(orderLifetimeS);
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                expirationUnixTimestampSec,
            );
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationUnixTimestampSec);
            const callbackAsync = reportCallbackErrors(done)(async (hash: string) => {
                expect(hash).to.be.equal(orderHash);
                expect(utils.getCurrentUnixTimestampSec()).to.be.bignumber.above(expirationUnixTimestampSec);
                done();
            });
            expirationWatcher.subscribe(callbackAsync);
            timer.tick(orderLifetimeS * 1000);
        })().catch(done);
    });
    it('doesn\'t emit events before order expires', (done: DoneCallback) => {
        (async () => {
            const orderLifetimeS = 60;
            const expirationUnixTimestampSec = currentUnixTimestampSec.plus(orderLifetimeS);
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                expirationUnixTimestampSec,
            );
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationUnixTimestampSec);
            const callbackAsync = reportCallbackErrors(done)(async (hash: string) => {
                done(new Error('Emitted expiration went before the order actually expired'));
            });
            expirationWatcher.subscribe(callbackAsync);
            const notEnoughTime = orderLifetimeS - 1;
            timer.tick(notEnoughTime * 1000);
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
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                order1ExpirationUnixTimestampSec,
            );
            const signedOrder2 = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                order2ExpirationUnixTimestampSec,
            );
            const orderHash1 = ZeroEx.getOrderHashHex(signedOrder1);
            const orderHash2 = ZeroEx.getOrderHashHex(signedOrder2);
            expirationWatcher.addOrder(orderHash2, signedOrder2.expirationUnixTimestampSec);
            expirationWatcher.addOrder(orderHash1, signedOrder1.expirationUnixTimestampSec);
            const expirationOrder = [orderHash1, orderHash2];
            const callbackAsync = reportCallbackErrors(done)(async (hash: string) => {
                const orderHash = expirationOrder.shift();
                expect(hash).to.be.equal(orderHash);
                if (_.isEmpty(expirationOrder)) {
                    done();
                }
            });
            expirationWatcher.subscribe(callbackAsync);
            timer.tick(order2Lifetime * 1000);
        })().catch(done);
    });
});
