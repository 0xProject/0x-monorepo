import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import {
    ExchangeContract,
    LogCancelContractEventArgs,
    LogErrorContractEventArgs,
    LogFillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';
import { TokenRegistryContract } from '../../src/contract_wrappers/generated/token_registry';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { BalancesByOwner, ContractName, SignedOrder } from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { web3, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange', () => {
    let makerAddress: string;
    let tokenOwner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    const INITIAL_BALANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);
    const INITIAL_ALLOWANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);

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
        [makerAddress, takerAddress, feeRecipientAddress] = accounts;
        const [repInstance, dgdInstance, zrxInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
        ]);
        rep = new DummyTokenContract(web3Wrapper, repInstance.abi, repInstance.address);
        dgd = new DummyTokenContract(web3Wrapper, dgdInstance.abi, dgdInstance.address);
        zrx = new DummyTokenContract(web3Wrapper, zrxInstance.abi, zrxInstance.address);
        const tokenRegistryInstance = await deployer.deployAsync(ContractName.TokenRegistry);
        tokenRegistry = new TokenRegistryContract(
            web3Wrapper,
            tokenRegistryInstance.abi,
            tokenRegistryInstance.address,
        );
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(
            web3Wrapper,
            tokenTransferProxyInstance.abi,
            tokenTransferProxyInstance.address,
        );
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            zrx.address,
            tokenTransferProxy.address,
        ]);
        exchange = new ExchangeContract(web3Wrapper, exchangeInstance.abi, exchangeInstance.address);
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: accounts[0] });
        const zeroEx = new ZeroEx(web3.currentProvider, { networkId: constants.TESTRPC_NETWORK_ID });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        const defaultOrderParams = {
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerTokenAddress: rep.address,
            takerTokenAddress: dgd.address,
            makerSellAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            makerBuyAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        };

        const privateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        dmyBalances = new Balances([rep, dgd, zrx], [makerAddress, takerAddress, feeRecipientAddress]);
        await Promise.all([
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, { from: makerAddress }),
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, { from: takerAddress }),
            rep.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            rep.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, { from: makerAddress }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, { from: takerAddress }),
            dgd.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, { from: makerAddress }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, { from: takerAddress }),
            zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
        ]);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        balances = await dmyBalances.getAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrKillOrder', () => {
        it('should transfer the correct amounts', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                makerSellAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                makerBuyAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerSellAmount = signedOrder.makerBuyAmount.div(2);
            await exWrapper.fillOrKillOrderAsync(signedOrder, takerAddress, {
                takerSellAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const makerAmountSold = takerSellAmount
                .times(signedOrder.makerSellAmount)
                .dividedToIntegerBy(signedOrder.makerBuyAmount);
            const makerFee = signedOrder.makerFee
                .times(makerAmountSold)
                .dividedToIntegerBy(signedOrder.makerSellAmount);
            const takerFee = signedOrder.takerFee
                .times(makerAmountSold)
                .dividedToIntegerBy(signedOrder.makerSellAmount);
            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(makerAmountSold),
            );
            expect(newBalances[makerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.takerTokenAddress].add(takerSellAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.takerTokenAddress].minus(takerSellAmount),
            );
            expect(newBalances[takerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.makerTokenAddress].add(makerAmountSold),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
            );
        });

        it('should throw if an signedOrder is expired', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            return expect(exWrapper.fillOrKillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if entire takerSellAmount not filled', async () => {
            const signedOrder = orderFactory.newSignedOrder();

            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerSellAmount: signedOrder.makerBuyAmount.div(2),
            });

            return expect(exWrapper.fillOrKillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });
    });

    describe('fillOrderNoThrow', () => {
        it('should transfer the correct amounts', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                makerSellAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                makerBuyAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerSellAmount = signedOrder.makerBuyAmount.div(2);
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, {
                takerSellAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const makerAmountSold = takerSellAmount
                .times(signedOrder.makerSellAmount)
                .dividedToIntegerBy(signedOrder.makerBuyAmount);
            const makerFee = signedOrder.makerFee
                .times(makerAmountSold)
                .dividedToIntegerBy(signedOrder.makerSellAmount);
            const takerFee = signedOrder.takerFee
                .times(makerAmountSold)
                .dividedToIntegerBy(signedOrder.makerSellAmount);
            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(makerAmountSold),
            );
            expect(newBalances[makerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.takerTokenAddress].add(takerSellAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.takerTokenAddress].minus(takerSellAmount),
            );
            expect(newBalances[takerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.makerTokenAddress].add(makerAmountSold),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
            );
        });

        it('should not change balances if maker balances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                makerSellAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if taker balances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                makerBuyAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if maker allowances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder();
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), {
                from: makerAddress,
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if taker allowances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder();
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), {
                from: takerAddress,
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if makerTokenAddress is ZRX, makerSellAmount + makerFee > maker balance', async () => {
            const makerZRXBalance = new BigNumber(balances[makerAddress][zrx.address]);
            const signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: zrx.address,
                makerSellAmount: makerZRXBalance,
                makerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if makerTokenAddress is ZRX, makerSellAmount + makerFee > maker allowance', async () => {
            const makerZRXAllowance = await zrx.allowance.callAsync(makerAddress, tokenTransferProxy.address);
            const signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: zrx.address,
                makerSellAmount: new BigNumber(makerZRXAllowance),
                makerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerTokenAddress is ZRX, makerBuyAmount + takerFee > taker balance', async () => {
            const takerZRXBalance = new BigNumber(balances[takerAddress][zrx.address]);
            const signedOrder = orderFactory.newSignedOrder({
                takerTokenAddress: zrx.address,
                makerBuyAmount: takerZRXBalance,
                takerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerTokenAddress is ZRX, makerBuyAmount + takerFee > taker allowance', async () => {
            const takerZRXAllowance = await zrx.allowance.callAsync(takerAddress, tokenTransferProxy.address);
            const signedOrder = orderFactory.newSignedOrder({
                takerTokenAddress: zrx.address,
                makerBuyAmount: new BigNumber(takerZRXAllowance),
                takerFee: new BigNumber(1),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });
    });

    describe('batch functions', () => {
        let signedOrders: SignedOrder[];
        beforeEach(async () => {
            signedOrders = [
                orderFactory.newSignedOrder(),
                orderFactory.newSignedOrder(),
                orderFactory.newSignedOrder(),
            ];
        });

        describe('batchFillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const takerSellAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerSellAmount = signedOrder.makerBuyAmount.div(2);
                    const makerAmountSold = takerSellAmount
                        .times(signedOrder.makerSellAmount)
                        .dividedToIntegerBy(signedOrder.makerBuyAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    takerSellAmounts.push(takerSellAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerAmountSold,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerSellAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerAmountSold,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerSellAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersAsync(signedOrders, takerAddress, {
                    takerSellAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });
        });

        describe('batchFillOrKillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const takerSellAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerSellAmount = signedOrder.makerBuyAmount.div(2);
                    const makerAmountSold = takerSellAmount
                        .times(signedOrder.makerSellAmount)
                        .dividedToIntegerBy(signedOrder.makerBuyAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    takerSellAmounts.push(takerSellAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerAmountSold,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerSellAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerAmountSold,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerSellAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                    takerSellAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw if a single signedOrder does not fill the expected amount', async () => {
                const takerSellAmounts: BigNumber[] = [];
                _.forEach(signedOrders, signedOrder => {
                    const takerSellAmount = signedOrder.makerBuyAmount.div(2);
                    takerSellAmounts.push(takerSellAmount);
                });

                await exWrapper.fillOrKillOrderAsync(signedOrders[0], takerAddress);

                return expect(
                    exWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                        takerSellAmounts,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchFillOrdersNoThrow', async () => {
            it('should transfer the correct amounts', async () => {
                const takerSellAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerSellAmount = signedOrder.makerBuyAmount.div(2);
                    const makerAmountSold = takerSellAmount
                        .times(signedOrder.makerSellAmount)
                        .dividedToIntegerBy(signedOrder.makerBuyAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    takerSellAmounts.push(takerSellAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerAmountSold,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerSellAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerAmountSold,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerSellAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerSellAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should not throw if an order is invalid and fill the remaining orders', async () => {
                const takerSellAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;

                const invalidOrder = {
                    ...signedOrders[0],
                    signature: '0x00',
                };
                const validOrders = signedOrders.slice(1);

                takerSellAmounts.push(invalidOrder.makerBuyAmount.div(2));
                _.forEach(validOrders, signedOrder => {
                    const takerSellAmount = signedOrder.makerBuyAmount.div(2);
                    const makerAmountSold = takerSellAmount
                        .times(signedOrder.makerSellAmount)
                        .dividedToIntegerBy(signedOrder.makerBuyAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAmountSold)
                        .dividedToIntegerBy(signedOrder.makerSellAmount);
                    takerSellAmounts.push(takerSellAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerAmountSold,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerSellAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerAmountSold,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerSellAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                const newOrders = [invalidOrder, ...validOrders];
                await exWrapper.batchFillOrdersNoThrowAsync(newOrders, takerAddress, {
                    takerSellAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });
        });

        describe('marketSellOrders', () => {
            it('should stop when the entire takerSellAmount is filled', async () => {
                const takerSellAmount = signedOrders[0].makerBuyAmount.plus(signedOrders[1].makerBuyAmount.div(2));
                await exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerSellAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountSold = signedOrders[0].makerSellAmount.add(
                    signedOrders[1].makerSellAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].makerTokenAddress].minus(makerAmountSold),
                );
                expect(newBalances[makerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].takerTokenAddress].add(takerSellAmount),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].takerTokenAddress].minus(takerSellAmount),
                );
                expect(newBalances[takerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].makerTokenAddress].add(makerAmountSold),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerSellAmount', async () => {
                const takerSellAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][signedOrder.makerTokenAddress] = balances[makerAddress][
                        signedOrder.makerTokenAddress
                    ].minus(signedOrder.makerSellAmount);
                    balances[makerAddress][signedOrder.takerTokenAddress] = balances[makerAddress][
                        signedOrder.takerTokenAddress
                    ].add(signedOrder.makerBuyAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][signedOrder.makerTokenAddress] = balances[takerAddress][
                        signedOrder.makerTokenAddress
                    ].add(signedOrder.makerSellAmount);
                    balances[takerAddress][signedOrder.takerTokenAddress] = balances[takerAddress][
                        signedOrder.takerTokenAddress
                    ].minus(signedOrder.makerBuyAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerSellAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an signedOrder does not use the same takerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ takerTokenAddress: zrx.address }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                        takerSellAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            it('should stop when the entire takerSellAmount is filled', async () => {
                const takerSellAmount = signedOrders[0].makerBuyAmount.plus(signedOrders[1].makerBuyAmount.div(2));
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerSellAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountSold = signedOrders[0].makerSellAmount.add(
                    signedOrders[1].makerSellAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].makerTokenAddress].minus(makerAmountSold),
                );
                expect(newBalances[makerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].takerTokenAddress].add(takerSellAmount),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].takerTokenAddress].minus(takerSellAmount),
                );
                expect(newBalances[takerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].makerTokenAddress].add(makerAmountSold),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerSellAmount', async () => {
                const takerSellAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][signedOrder.makerTokenAddress] = balances[makerAddress][
                        signedOrder.makerTokenAddress
                    ].minus(signedOrder.makerSellAmount);
                    balances[makerAddress][signedOrder.takerTokenAddress] = balances[makerAddress][
                        signedOrder.takerTokenAddress
                    ].add(signedOrder.makerBuyAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][signedOrder.makerTokenAddress] = balances[takerAddress][
                        signedOrder.makerTokenAddress
                    ].add(signedOrder.makerSellAmount);
                    balances[takerAddress][signedOrder.takerTokenAddress] = balances[takerAddress][
                        signedOrder.takerTokenAddress
                    ].minus(signedOrder.makerBuyAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerSellAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when a signedOrder does not use the same takerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ takerTokenAddress: zrx.address }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                        takerSellAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketBuyOrders', () => {
            it('should stop when the entire takerBuyAmount is filled', async () => {
                const takerBuyAmount = signedOrders[0].makerSellAmount.plus(signedOrders[1].makerSellAmount.div(2));
                await exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    takerBuyAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountBought = signedOrders[0].makerBuyAmount.add(
                    signedOrders[1].makerBuyAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].makerTokenAddress].minus(takerBuyAmount),
                );
                expect(newBalances[makerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].takerTokenAddress].add(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].takerTokenAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].makerTokenAddress].add(takerBuyAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerBuyAmount', async () => {
                const takerBuyAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][signedOrder.makerTokenAddress] = balances[makerAddress][
                        signedOrder.makerTokenAddress
                    ].minus(signedOrder.makerSellAmount);
                    balances[makerAddress][signedOrder.takerTokenAddress] = balances[makerAddress][
                        signedOrder.takerTokenAddress
                    ].add(signedOrder.makerBuyAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][signedOrder.makerTokenAddress] = balances[takerAddress][
                        signedOrder.makerTokenAddress
                    ].add(signedOrder.makerSellAmount);
                    balances[takerAddress][signedOrder.takerTokenAddress] = balances[takerAddress][
                        signedOrder.takerTokenAddress
                    ].minus(signedOrder.makerBuyAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    takerBuyAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an signedOrder does not use the same makerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ makerTokenAddress: zrx.address }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                        takerBuyAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            it('should stop when the entire takerBuyAmount is filled', async () => {
                const takerBuyAmount = signedOrders[0].makerSellAmount.plus(signedOrders[1].makerSellAmount.div(2));
                await exWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerBuyAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountBought = signedOrders[0].makerBuyAmount.add(
                    signedOrders[1].makerBuyAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].makerTokenAddress].minus(takerBuyAmount),
                );
                expect(newBalances[makerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrders[0].takerTokenAddress].add(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].takerTokenAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrders[0].makerTokenAddress].add(takerBuyAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerSellAmount', async () => {
                const takerSellAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][signedOrder.makerTokenAddress] = balances[makerAddress][
                        signedOrder.makerTokenAddress
                    ].minus(signedOrder.makerSellAmount);
                    balances[makerAddress][signedOrder.takerTokenAddress] = balances[makerAddress][
                        signedOrder.takerTokenAddress
                    ].add(signedOrder.makerBuyAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][signedOrder.makerTokenAddress] = balances[takerAddress][
                        signedOrder.makerTokenAddress
                    ].add(signedOrder.makerSellAmount);
                    balances[takerAddress][signedOrder.takerTokenAddress] = balances[takerAddress][
                        signedOrder.takerTokenAddress
                    ].minus(signedOrder.makerBuyAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerSellAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when a signedOrder does not use the same makerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ makerTokenAddress: zrx.address }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                        takerBuyAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const takerTokenCancelAmounts = _.map(signedOrders, signedOrder => signedOrder.makerBuyAmount);
                await exWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);

                await exWrapper.batchFillOrdersAsync(signedOrders, takerAddress, {
                    takerSellAmounts: takerTokenCancelAmounts,
                });
                const newBalances = await dmyBalances.getAsync();
                expect(balances).to.be.deep.equal(newBalances);
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
