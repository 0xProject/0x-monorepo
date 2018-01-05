import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';
import * as Web3 from 'web3';

import { ZeroEx } from '../src/0x';
import { ExpirationWatcher } from '../src/order_watcher/expiration_watcher';
import { DoneCallback, Token } from '../src/types';
import { constants } from '../src/utils/constants';
import { utils } from '../src/utils/utils';

import { chaiSetup } from './utils/chai_setup';
import { constants as testConstants } from './utils/constants';
import { FillScenarios } from './utils/fill_scenarios';
import { reportNoErrorCallbackErrors } from './utils/report_callback_errors';
import { TokenUtils } from './utils/token_utils';
import { web3Factory } from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(testConstants.RPC_URL);

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
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
        };
        zeroEx = new ZeroEx(web3.currentProvider, config);
        exchangeContractAddress = zeroEx.exchange.getContractAddress();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
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
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationUnixTimestampSec.times(1000));
            const callbackAsync = reportNoErrorCallbackErrors(done)((hash: string) => {
                expect(hash).to.be.equal(orderHash);
                expect(utils.getCurrentUnixTimestampSec()).to.be.bignumber.gte(expirationUnixTimestampSec);
            });
            expirationWatcher.subscribe(callbackAsync);
            timer.tick(orderLifetimeSec * 1000);
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
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationUnixTimestampSec.times(1000));
            const callbackAsync = reportNoErrorCallbackErrors(done)(async (hash: string) => {
                done(new Error('Emitted expiration went before the order actually expired'));
            });
            expirationWatcher.subscribe(callbackAsync);
            const notEnoughTime = orderLifetimeSec - 1;
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
            const orderHash1 = ZeroEx.getOrderHashHex(signedOrder1);
            const orderHash2 = ZeroEx.getOrderHashHex(signedOrder2);
            expirationWatcher.addOrder(orderHash2, signedOrder2.expirationUnixTimestampSec.times(1000));
            expirationWatcher.addOrder(orderHash1, signedOrder1.expirationUnixTimestampSec.times(1000));
            const expirationOrder = [orderHash1, orderHash2];
            const expectToBeCalledOnce = false;
            const callbackAsync = reportNoErrorCallbackErrors(done, expectToBeCalledOnce)((hash: string) => {
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
