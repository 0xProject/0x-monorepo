import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { TokenRegistryContract } from '../../src/contract_wrappers/generated/token_registry';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { ExchangeWrapper } from '../../util/exchange_wrapper';
import { Order } from '../../util/order';
import { OrderFactory } from '../../util/order_factory';
import { BalancesByOwner, ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';

chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const blockchainLifecycle = new BlockchainLifecycle();

describe('Exchange', () => {
    let maker: string;
    let tokenOwner: string;
    let taker: string;
    let feeRecipient: string;

    const INIT_BAL = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);
    const INIT_ALLOW = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);

    let rep: DummyTokenContract;
    let dgd: DummyTokenContract;
    let zrx: DummyTokenContract;
    let exchange: ExchangeContract;
    let tokenRegistry: TokenRegistryContract;
    let tokenTransferProxy: TokenTransferProxyContract;

    let balances: BalancesByOwner;

    let exWrapper: ExchangeWrapper;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        tokenOwner = accounts[0];
        [maker, taker, feeRecipient] = accounts;
        const [repInstance, dgdInstance, zrxInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken),
            deployer.deployAsync(ContractName.DummyToken),
            deployer.deployAsync(ContractName.DummyToken),
        ]);
        rep = new DummyTokenContract(repInstance);
        dgd = new DummyTokenContract(dgdInstance);
        zrx = new DummyTokenContract(zrxInstance);
        const tokenRegistryInstance = await deployer.deployAsync(ContractName.TokenRegistry);
        tokenRegistry = new TokenRegistryContract(tokenRegistryInstance);
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(tokenTransferProxyInstance);
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            zrx.address,
            tokenTransferProxy.address,
        ]);
        exchange = new ExchangeContract(exchangeInstance);
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: accounts[0] });
        const zeroEx = new ZeroEx(web3.currentProvider, { networkId: constants.TESTRPC_NETWORK_ID });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        const defaultOrderParams = {
            exchangeContractAddress: exchange.address,
            maker,
            feeRecipient,
            makerToken: rep.address,
            takerToken: dgd.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        };

        orderFactory = new OrderFactory(web3Wrapper, defaultOrderParams);
        dmyBalances = new Balances([rep, dgd, zrx], [maker, taker, feeRecipient]);
        await Promise.all([
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, { from: maker }),
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, { from: taker }),
            rep.setBalance.sendTransactionAsync(maker, INIT_BAL, { from: tokenOwner }),
            rep.setBalance.sendTransactionAsync(taker, INIT_BAL, { from: tokenOwner }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, { from: maker }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, { from: taker }),
            dgd.setBalance.sendTransactionAsync(maker, INIT_BAL, { from: tokenOwner }),
            dgd.setBalance.sendTransactionAsync(taker, INIT_BAL, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, { from: maker }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, { from: taker }),
            zrx.setBalance.sendTransactionAsync(maker, INIT_BAL, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(taker, INIT_BAL, { from: tokenOwner }),
        ]);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrKillOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
        });

        it('should transfer the correct amounts', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerTokenFillAmount = order.params.takerTokenAmount.div(2);
            await exWrapper.fillOrKillOrderAsync(order, taker, {
                takerTokenFillAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = takerTokenFillAmount
                .times(order.params.makerTokenAmount)
                .dividedToIntegerBy(order.params.takerTokenAmount);
            const makerFee = order.params.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            const takerFee = order.params.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(order.params.makerTokenAmount);
            expect(newBalances[maker][order.params.makerToken]).to.be.bignumber.equal(
                balances[maker][order.params.makerToken].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][order.params.takerToken]).to.be.bignumber.equal(
                balances[maker][order.params.takerToken].add(takerTokenFillAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(balances[maker][zrx.address].minus(makerFee));
            expect(newBalances[taker][order.params.takerToken]).to.be.bignumber.equal(
                balances[taker][order.params.takerToken].minus(takerTokenFillAmount),
            );
            expect(newBalances[taker][order.params.makerToken]).to.be.bignumber.equal(
                balances[taker][order.params.makerToken].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(balances[taker][zrx.address].minus(takerFee));
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(makerFee.add(takerFee)),
            );
        });

        it('should throw if an order is expired', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                expirationTimestampInSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            return expect(exWrapper.fillOrKillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if entire takerTokenFillAmount not filled', async () => {
            const order = await orderFactory.newSignedOrderAsync();

            const from = taker;
            await exWrapper.fillOrderAsync(order, from, {
                takerTokenFillAmount: order.params.takerTokenAmount.div(2),
            });

            return expect(exWrapper.fillOrKillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('batch functions', () => {
        let orders: Order[];
        beforeEach(async () => {
            orders = await Promise.all([
                orderFactory.newSignedOrderAsync(),
                orderFactory.newSignedOrderAsync(),
                orderFactory.newSignedOrderAsync(),
            ]);
            balances = await dmyBalances.getAsync();
        });

        describe('batchFillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const fillTakerTokenAmounts: BigNumber[] = [];
                const makerToken = rep.address;
                const takerToken = dgd.address;
                orders.forEach(order => {
                    const takerTokenFillAmount = order.params.takerTokenAmount.div(2);
                    const fillMakerTokenAmount = takerTokenFillAmount
                        .times(order.params.makerTokenAmount)
                        .dividedToIntegerBy(order.params.takerTokenAmount);
                    const makerFee = order.params.makerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.params.makerTokenAmount);
                    const takerFee = order.params.takerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.params.makerTokenAmount);
                    fillTakerTokenAmounts.push(takerTokenFillAmount);
                    balances[maker][makerToken] = balances[maker][makerToken].minus(fillMakerTokenAmount);
                    balances[maker][takerToken] = balances[maker][takerToken].add(takerTokenFillAmount);
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(makerFee);
                    balances[taker][makerToken] = balances[taker][makerToken].add(fillMakerTokenAmount);
                    balances[taker][takerToken] = balances[taker][takerToken].minus(takerTokenFillAmount);
                    balances[taker][zrx.address] = balances[taker][zrx.address].minus(takerFee);
                    balances[feeRecipient][zrx.address] = balances[feeRecipient][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersAsync(orders, taker, {
                    fillTakerTokenAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });
        });

        describe('batchFillOrKillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const fillTakerTokenAmounts: BigNumber[] = [];
                const makerToken = rep.address;
                const takerToken = dgd.address;
                orders.forEach(order => {
                    const takerTokenFillAmount = order.params.takerTokenAmount.div(2);
                    const fillMakerTokenAmount = takerTokenFillAmount
                        .times(order.params.makerTokenAmount)
                        .dividedToIntegerBy(order.params.takerTokenAmount);
                    const makerFee = order.params.makerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.params.makerTokenAmount);
                    const takerFee = order.params.takerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.params.makerTokenAmount);
                    fillTakerTokenAmounts.push(takerTokenFillAmount);
                    balances[maker][makerToken] = balances[maker][makerToken].minus(fillMakerTokenAmount);
                    balances[maker][takerToken] = balances[maker][takerToken].add(takerTokenFillAmount);
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(makerFee);
                    balances[taker][makerToken] = balances[taker][makerToken].add(fillMakerTokenAmount);
                    balances[taker][takerToken] = balances[taker][takerToken].minus(takerTokenFillAmount);
                    balances[taker][zrx.address] = balances[taker][zrx.address].minus(takerFee);
                    balances[feeRecipient][zrx.address] = balances[feeRecipient][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrKillOrdersAsync(orders, taker, {
                    fillTakerTokenAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw if a single order does not fill the expected amount', async () => {
                const fillTakerTokenAmounts: BigNumber[] = [];
                orders.forEach(order => {
                    const takerTokenFillAmount = order.params.takerTokenAmount.div(2);
                    fillTakerTokenAmounts.push(takerTokenFillAmount);
                });

                await exWrapper.fillOrKillOrderAsync(orders[0], taker);

                return expect(
                    exWrapper.batchFillOrKillOrdersAsync(orders, taker, {
                        fillTakerTokenAmounts,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('fillOrdersUpTo', () => {
            it('should stop when the entire takerTokenFillAmount is filled', async () => {
                const takerTokenFillAmount = orders[0].params.takerTokenAmount.plus(
                    orders[1].params.takerTokenAmount.div(2),
                );
                await exWrapper.marketFillOrdersAsync(orders, taker, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const fillMakerTokenAmount = orders[0].params.makerTokenAmount.add(
                    orders[1].params.makerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = orders[0].params.makerFee.add(orders[1].params.makerFee.dividedToIntegerBy(2));
                const takerFee = orders[0].params.takerFee.add(orders[1].params.takerFee.dividedToIntegerBy(2));
                expect(newBalances[maker][orders[0].params.makerToken]).to.be.bignumber.equal(
                    balances[maker][orders[0].params.makerToken].minus(fillMakerTokenAmount),
                );
                expect(newBalances[maker][orders[0].params.takerToken]).to.be.bignumber.equal(
                    balances[maker][orders[0].params.takerToken].add(takerTokenFillAmount),
                );
                expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                    balances[maker][zrx.address].minus(makerFee),
                );
                expect(newBalances[taker][orders[0].params.takerToken]).to.be.bignumber.equal(
                    balances[taker][orders[0].params.takerToken].minus(takerTokenFillAmount),
                );
                expect(newBalances[taker][orders[0].params.makerToken]).to.be.bignumber.equal(
                    balances[taker][orders[0].params.makerToken].add(fillMakerTokenAmount),
                );
                expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                    balances[taker][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipient][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all orders if cannot fill entire takerTokenFillAmount', async () => {
                const takerTokenFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                orders.forEach(order => {
                    balances[maker][order.params.makerToken] = balances[maker][order.params.makerToken].minus(
                        order.params.makerTokenAmount,
                    );
                    balances[maker][order.params.takerToken] = balances[maker][order.params.takerToken].add(
                        order.params.takerTokenAmount,
                    );
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(order.params.makerFee);
                    balances[taker][order.params.makerToken] = balances[taker][order.params.makerToken].add(
                        order.params.makerTokenAmount,
                    );
                    balances[taker][order.params.takerToken] = balances[taker][order.params.takerToken].minus(
                        order.params.takerTokenAmount,
                    );
                    balances[taker][zrx.address] = balances[taker][zrx.address].minus(order.params.takerFee);
                    balances[feeRecipient][zrx.address] = balances[feeRecipient][zrx.address].add(
                        order.params.makerFee.add(order.params.takerFee),
                    );
                });
                await exWrapper.marketFillOrdersAsync(orders, taker, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an order does not use the same takerToken', async () => {
                orders = await Promise.all([
                    orderFactory.newSignedOrderAsync(),
                    orderFactory.newSignedOrderAsync({ takerToken: zrx.address }),
                    orderFactory.newSignedOrderAsync(),
                ]);

                return expect(
                    exWrapper.marketFillOrdersAsync(orders, taker, {
                        takerTokenFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple orders', async () => {
                const cancelTakerTokenAmounts = _.map(orders, order => order.params.takerTokenAmount);
                await exWrapper.batchCancelOrdersAsync(orders, maker, {
                    cancelTakerTokenAmounts,
                });

                await exWrapper.batchFillOrdersAsync(orders, taker, {
                    fillTakerTokenAmounts: cancelTakerTokenAmounts,
                });
                const newBalances = await dmyBalances.getAsync();
                expect(balances).to.be.deep.equal(newBalances);
            });
        });
    });
});
