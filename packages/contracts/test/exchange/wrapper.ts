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
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrKillOrderAsync(signedOrder, taker, {
                takerTokenFillAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const makerTokenFillAmount = takerTokenFillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFee = signedOrder.makerFee
                .times(makerTokenFillAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFee = signedOrder.takerFee
                .times(makerTokenFillAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(makerTokenFillAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(takerTokenFillAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(balances[maker][zrx.address].minus(makerFee));
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(takerTokenFillAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(makerTokenFillAmount),
            );
            expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(balances[taker][zrx.address].minus(takerFee));
            expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipient][zrx.address].add(makerFee.add(takerFee)),
            );
        });

        it('should throw if an signedOrder is expired', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync({
                expirationUnixTimestampSec: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            return expect(exWrapper.fillOrKillOrderAsync(signedOrder, taker)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if entire takerTokenFillAmount not filled', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync();

            const from = taker;
            await exWrapper.fillOrderAsync(signedOrder, from, {
                takerTokenFillAmount: signedOrder.takerTokenAmount.div(2),
            });

            return expect(exWrapper.fillOrKillOrderAsync(signedOrder, taker)).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('batch functions', () => {
        let signedOrders: SignedOrder[];
        beforeEach(async () => {
            signedOrders = await Promise.all([
                orderFactory.newSignedOrderAsync(),
                orderFactory.newSignedOrderAsync(),
                orderFactory.newSignedOrderAsync(),
            ]);
            balances = await dmyBalances.getAsync();
        });

        describe('batchFillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const takerTokenFillAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                signedOrders.forEach(signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    const makerTokenFillAmount = takerTokenFillAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerTokenFillAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerTokenFillAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                    balances[maker][makerTokenAddress] = balances[maker][makerTokenAddress].minus(makerTokenFillAmount);
                    balances[maker][takerTokenAddress] = balances[maker][takerTokenAddress].add(takerTokenFillAmount);
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(makerFee);
                    balances[taker][makerTokenAddress] = balances[taker][makerTokenAddress].add(makerTokenFillAmount);
                    balances[taker][takerTokenAddress] = balances[taker][takerTokenAddress].minus(takerTokenFillAmount);
                    balances[taker][zrx.address] = balances[taker][zrx.address].minus(takerFee);
                    balances[feeRecipient][zrx.address] = balances[feeRecipient][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersAsync(signedOrders, taker, {
                    takerTokenFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });
        });

        describe('batchFillOrKillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const takerTokenFillAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                signedOrders.forEach(signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    const makerTokenFillAmount = takerTokenFillAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerTokenFillAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerTokenFillAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                    balances[maker][makerTokenAddress] = balances[maker][makerTokenAddress].minus(makerTokenFillAmount);
                    balances[maker][takerTokenAddress] = balances[maker][takerTokenAddress].add(takerTokenFillAmount);
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(makerFee);
                    balances[taker][makerTokenAddress] = balances[taker][makerTokenAddress].add(makerTokenFillAmount);
                    balances[taker][takerTokenAddress] = balances[taker][takerTokenAddress].minus(takerTokenFillAmount);
                    balances[taker][zrx.address] = balances[taker][zrx.address].minus(takerFee);
                    balances[feeRecipient][zrx.address] = balances[feeRecipient][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrKillOrdersAsync(signedOrders, taker, {
                    takerTokenFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw if a single signedOrder does not fill the expected amount', async () => {
                const takerTokenFillAmounts: BigNumber[] = [];
                signedOrders.forEach(signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                });

                await exWrapper.fillOrKillOrderAsync(signedOrders[0], taker);

                return expect(
                    exWrapper.batchFillOrKillOrdersAsync(signedOrders, taker, {
                        takerTokenFillAmounts,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('fillOrdersUpTo', () => {
            it('should stop when the entire takerTokenFillAmount is filled', async () => {
                const takerTokenFillAmount = signedOrders[0].takerTokenAmount.plus(
                    signedOrders[1].takerTokenAmount.div(2),
                );
                await exWrapper.marketFillOrdersAsync(signedOrders, taker, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerTokenFillAmount = signedOrders[0].makerTokenAmount.add(
                    signedOrders[1].makerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[maker][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[maker][signedOrders[0].makerTokenAddress].minus(makerTokenFillAmount),
                );
                expect(newBalances[maker][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[maker][signedOrders[0].takerTokenAddress].add(takerTokenFillAmount),
                );
                expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                    balances[maker][zrx.address].minus(makerFee),
                );
                expect(newBalances[taker][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[taker][signedOrders[0].takerTokenAddress].minus(takerTokenFillAmount),
                );
                expect(newBalances[taker][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[taker][signedOrders[0].makerTokenAddress].add(makerTokenFillAmount),
                );
                expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                    balances[taker][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipient][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerTokenFillAmount', async () => {
                const takerTokenFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                signedOrders.forEach(signedOrder => {
                    balances[maker][signedOrder.makerTokenAddress] = balances[maker][
                        signedOrder.makerTokenAddress
                    ].minus(signedOrder.makerTokenAmount);
                    balances[maker][signedOrder.takerTokenAddress] = balances[maker][signedOrder.takerTokenAddress].add(
                        signedOrder.takerTokenAmount,
                    );
                    balances[maker][zrx.address] = balances[maker][zrx.address].minus(signedOrder.makerFee);
                    balances[taker][signedOrder.makerTokenAddress] = balances[taker][signedOrder.makerTokenAddress].add(
                        signedOrder.makerTokenAmount,
                    );
                    balances[taker][signedOrder.takerTokenAddress] = balances[taker][
                        signedOrder.takerTokenAddress
                    ].minus(signedOrder.takerTokenAmount);
                    balances[taker][zrx.address] = balances[taker][zrx.address].minus(signedOrder.takerFee);
                    balances[feeRecipient][zrx.address] = balances[feeRecipient][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketFillOrdersAsync(signedOrders, taker, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an signedOrder does not use the same takerTokenAddress', async () => {
                signedOrders = await Promise.all([
                    orderFactory.newSignedOrderAsync(),
                    orderFactory.newSignedOrderAsync({ takerTokenAddress: zrx.address }),
                    orderFactory.newSignedOrderAsync(),
                ]);

                return expect(
                    exWrapper.marketFillOrdersAsync(signedOrders, taker, {
                        takerTokenFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const takerTokenCancelAmounts = _.map(signedOrders, signedOrder => signedOrder.takerTokenAmount);
                await exWrapper.batchCancelOrdersAsync(signedOrders, maker, {
                    takerTokenCancelAmounts,
                });

                await exWrapper.batchFillOrdersAsync(signedOrders, taker, {
                    takerTokenFillAmounts: takerTokenCancelAmounts,
                });
                const newBalances = await dmyBalances.getAsync();
                expect(balances).to.be.deep.equal(newBalances);
            });
        });
    });
});
