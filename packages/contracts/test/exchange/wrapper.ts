import { SignedOrder, ZeroEx } from '0x.js';
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
            makerTokenAddress: rep.address,
            takerTokenAddress: dgd.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        };

        orderFactory = new OrderFactory(zeroEx, defaultOrderParams);
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
            const fillTakerTokenAmount = order.takerTokenAmount.div(2);
            await exWrapper.fillOrKillOrderAsync(order, taker, {
                fillTakerTokenAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(order.makerTokenAmount)
                .dividedToIntegerBy(order.takerTokenAmount);
            const makerFee = order.makerFee.times(fillMakerTokenAmount).dividedToIntegerBy(order.makerTokenAmount);
            const takerFee = order.takerFee.times(fillMakerTokenAmount).dividedToIntegerBy(order.makerTokenAmount);
            expect(newBalances[maker][order.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][order.makerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][order.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][order.takerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(balances[maker][zrx.address].minus(makerFee));
            expect(newBalances[taker][order.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][order.takerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][order.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][order.makerTokenAddress].add(fillMakerTokenAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(balances[taker][zrx.address].minus(takerFee));
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(makerFee.add(takerFee)),
            );
        });

        it('should throw if an order is expired', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                expirationUnixTimestampSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            return expect(exWrapper.fillOrKillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if entire fillTakerTokenAmount not filled', async () => {
            const order = await orderFactory.newSignedOrderAsync();

            const from = taker;
            await exWrapper.fillOrderAsync(order, from, {
                fillTakerTokenAmount: order.takerTokenAmount.div(2),
            });

            return expect(exWrapper.fillOrKillOrderAsync(order, taker)).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('batch functions', () => {
        let orders: SignedOrder[];
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
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                orders.forEach(order => {
                    const fillTakerTokenAmount = order.takerTokenAmount.div(2);
                    const fillMakerTokenAmount = fillTakerTokenAmount
                        .times(order.makerTokenAmount)
                        .dividedToIntegerBy(order.takerTokenAmount);
                    const makerFee = order.makerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.makerTokenAmount);
                    const takerFee = order.takerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.makerTokenAmount);
                    fillTakerTokenAmounts.push(fillTakerTokenAmount);
                    balances[maker][makerTokenAddress] = balances[maker][makerTokenAddress].minus(fillMakerTokenAmount);
                    balances[maker][takerTokenAddress] = balances[maker][takerTokenAddress].add(fillTakerTokenAmount);
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(makerFee);
                    balances[taker][makerTokenAddress] = balances[taker][makerTokenAddress].add(fillMakerTokenAmount);
                    balances[taker][takerTokenAddress] = balances[taker][takerTokenAddress].minus(fillTakerTokenAmount);
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
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                orders.forEach(order => {
                    const fillTakerTokenAmount = order.takerTokenAmount.div(2);
                    const fillMakerTokenAmount = fillTakerTokenAmount
                        .times(order.makerTokenAmount)
                        .dividedToIntegerBy(order.takerTokenAmount);
                    const makerFee = order.makerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.makerTokenAmount);
                    const takerFee = order.takerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(order.makerTokenAmount);
                    fillTakerTokenAmounts.push(fillTakerTokenAmount);
                    balances[maker][makerTokenAddress] = balances[maker][makerTokenAddress].minus(fillMakerTokenAmount);
                    balances[maker][takerTokenAddress] = balances[maker][takerTokenAddress].add(fillTakerTokenAmount);
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(makerFee);
                    balances[taker][makerTokenAddress] = balances[taker][makerTokenAddress].add(fillMakerTokenAmount);
                    balances[taker][takerTokenAddress] = balances[taker][takerTokenAddress].minus(fillTakerTokenAmount);
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
                    const fillTakerTokenAmount = order.takerTokenAmount.div(2);
                    fillTakerTokenAmounts.push(fillTakerTokenAmount);
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
            it('should stop when the entire fillTakerTokenAmount is filled', async () => {
                const fillTakerTokenAmount = orders[0].takerTokenAmount.plus(orders[1].takerTokenAmount.div(2));
                await exWrapper.fillOrdersUpToAsync(orders, taker, {
                    fillTakerTokenAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const fillMakerTokenAmount = orders[0].makerTokenAmount.add(
                    orders[1].makerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = orders[0].makerFee.add(orders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = orders[0].takerFee.add(orders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[maker][orders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[maker][orders[0].makerTokenAddress].minus(fillMakerTokenAmount),
                );
                expect(newBalances[maker][orders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[maker][orders[0].takerTokenAddress].add(fillTakerTokenAmount),
                );
                expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                    balances[maker][zrx.address].minus(makerFee),
                );
                expect(newBalances[taker][orders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[taker][orders[0].takerTokenAddress].minus(fillTakerTokenAmount),
                );
                expect(newBalances[taker][orders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[taker][orders[0].makerTokenAddress].add(fillMakerTokenAmount),
                );
                expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                    balances[taker][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipient][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all orders if cannot fill entire fillTakerTokenAmount', async () => {
                const fillTakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                orders.forEach(order => {
                    balances[maker][order.makerTokenAddress] = balances[maker][order.makerTokenAddress].minus(
                        order.makerTokenAmount,
                    );
                    balances[maker][order.takerTokenAddress] = balances[maker][order.takerTokenAddress].add(
                        order.takerTokenAmount,
                    );
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(order.makerFee);
                    balances[taker][order.makerTokenAddress] = balances[taker][order.makerTokenAddress].add(
                        order.makerTokenAmount,
                    );
                    balances[taker][order.takerTokenAddress] = balances[taker][order.takerTokenAddress].minus(
                        order.takerTokenAmount,
                    );
                    balances[taker][zrx.address] = balances[taker][zrx.address].minus(order.takerFee);
                    balances[feeRecipient][zrx.address] = balances[feeRecipient][zrx.address].add(
                        order.makerFee.add(order.takerFee),
                    );
                });
                await exWrapper.fillOrdersUpToAsync(orders, taker, {
                    fillTakerTokenAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an order does not use the same takerTokenAddress', async () => {
                orders = await Promise.all([
                    orderFactory.newSignedOrderAsync(),
                    orderFactory.newSignedOrderAsync({ takerTokenAddress: zrx.address }),
                    orderFactory.newSignedOrderAsync(),
                ]);

                return expect(
                    exWrapper.fillOrdersUpToAsync(orders, taker, {
                        fillTakerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple orders', async () => {
                const cancelTakerTokenAmounts = _.map(orders, order => order.takerTokenAmount);
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
