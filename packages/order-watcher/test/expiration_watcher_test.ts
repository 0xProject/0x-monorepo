import { BlockchainLifecycle, callbackErrorReporter, tokenUtils } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { DoneCallback } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';

import { ExpirationWatcher } from '../src/order_watcher/expiration_watcher';
import { utils } from '../src/utils/utils';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const MILISECONDS_IN_SECOND = 1000;

describe('ExpirationWatcher', () => {
    let userAddresses: string[];
    let fillScenarios: FillScenarios;
    let makerAssetData: string;
    let takerAssetData: string;
    let coinbase: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipient: string;
    const fillableAmount = new BigNumber(5);
    let currentUnixTimestampSec: BigNumber;
    let timer: Sinon.SinonFakeTimers;
    let expirationWatcher: ExpirationWatcher;
    before(async () => {
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            contractAddresses.zrxToken,
            contractAddresses.exchange,
            contractAddresses.erc20Proxy,
            contractAddresses.erc721Proxy,
        );
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        const [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
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
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
                expirationUnixTimestampSec,
            );
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationTimeSeconds.times(MILISECONDS_IN_SECOND));
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
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
                expirationUnixTimestampSec,
            );
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expirationWatcher.addOrder(orderHash, signedOrder.expirationTimeSeconds.times(MILISECONDS_IN_SECOND));
            const callbackAsync = callbackErrorReporter.reportNoErrorCallbackErrors(done)(async (_hash: string) => {
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
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
                order1ExpirationUnixTimestampSec,
            );
            const signedOrder2 = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
                order2ExpirationUnixTimestampSec,
            );
            const orderHash1 = orderHashUtils.getOrderHashHex(signedOrder1);
            const orderHash2 = orderHashUtils.getOrderHashHex(signedOrder2);
            expirationWatcher.addOrder(orderHash2, signedOrder2.expirationTimeSeconds.times(MILISECONDS_IN_SECOND));
            expirationWatcher.addOrder(orderHash1, signedOrder1.expirationTimeSeconds.times(MILISECONDS_IN_SECOND));
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
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
                order1ExpirationUnixTimestampSec,
            );
            const signedOrder2 = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
                order2ExpirationUnixTimestampSec,
            );
            const orderHash1 = orderHashUtils.getOrderHashHex(signedOrder1);
            const orderHash2 = orderHashUtils.getOrderHashHex(signedOrder2);
            expirationWatcher.addOrder(orderHash1, signedOrder1.expirationTimeSeconds.times(MILISECONDS_IN_SECOND));
            expirationWatcher.addOrder(orderHash2, signedOrder2.expirationTimeSeconds.times(MILISECONDS_IN_SECOND));
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
