import { SignedOrder, ZeroEx } from '0x.js';
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
import { artifacts } from '../../util/artifacts';
import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { ExchangeWrapper } from '../../util/exchange_wrapper';
import { OrderFactory } from '../../util/order_factory';
import { BalancesByOwner, ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';

import { defaults, provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

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
        [rep, dgd, zrx] = await Promise.all([
            DummyTokenContract.deploy0xArtifactAsync(
                artifacts.DummyToken,
                provider,
                defaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            ),
            DummyTokenContract.deploy0xArtifactAsync(
                artifacts.DummyToken,
                provider,
                defaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            ),
            DummyTokenContract.deploy0xArtifactAsync(
                artifacts.DummyToken,
                provider,
                defaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            ),
        ]);
        tokenRegistry = await TokenRegistryContract.deploy0xArtifactAsync(artifacts.TokenRegistry, provider, defaults);
        tokenTransferProxy = await TokenTransferProxyContract.deploy0xArtifactAsync(
            artifacts.TokenTransferProxy,
            provider,
            defaults,
        );
        exchange = await ExchangeContract.deploy0xArtifactAsync(
            artifacts.Exchange,
            provider,
            defaults,
            zrx.address,
            tokenTransferProxy.address,
        );
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: accounts[0] });
        const zeroEx = new ZeroEx(provider, { networkId: constants.TESTRPC_NETWORK_ID });
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
            const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrKillOrderAsync(signedOrder, taker, {
                fillTakerTokenAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const fillMakerTokenAmount = fillTakerTokenAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFee = signedOrder.makerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFee = signedOrder.takerFee
                .times(fillMakerTokenAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[maker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.makerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[maker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[maker][signedOrder.takerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(balances[maker][zrx.address].minus(makerFee));
            expect(newBalances[taker][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.takerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[taker][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[taker][signedOrder.makerTokenAddress].add(fillMakerTokenAmount),
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

        it('should throw if entire fillTakerTokenAmount not filled', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync();

            const from = taker;
            await exWrapper.fillOrderAsync(signedOrder, from, {
                fillTakerTokenAmount: signedOrder.takerTokenAmount.div(2),
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
                const fillTakerTokenAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                signedOrders.forEach(signedOrder => {
                    const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
                    const fillMakerTokenAmount = fillTakerTokenAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
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

                await exWrapper.batchFillOrdersAsync(signedOrders, taker, {
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
                signedOrders.forEach(signedOrder => {
                    const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
                    const fillMakerTokenAmount = fillTakerTokenAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(fillMakerTokenAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
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

                await exWrapper.batchFillOrKillOrdersAsync(signedOrders, taker, {
                    fillTakerTokenAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw if a single signedOrder does not fill the expected amount', async () => {
                const fillTakerTokenAmounts: BigNumber[] = [];
                signedOrders.forEach(signedOrder => {
                    const fillTakerTokenAmount = signedOrder.takerTokenAmount.div(2);
                    fillTakerTokenAmounts.push(fillTakerTokenAmount);
                });

                await exWrapper.fillOrKillOrderAsync(signedOrders[0], taker);

                return expect(
                    exWrapper.batchFillOrKillOrdersAsync(signedOrders, taker, {
                        fillTakerTokenAmounts,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('fillOrdersUpTo', () => {
            it('should stop when the entire fillTakerTokenAmount is filled', async () => {
                const fillTakerTokenAmount = signedOrders[0].takerTokenAmount.plus(
                    signedOrders[1].takerTokenAmount.div(2),
                );
                await exWrapper.fillOrdersUpToAsync(signedOrders, taker, {
                    fillTakerTokenAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const fillMakerTokenAmount = signedOrders[0].makerTokenAmount.add(
                    signedOrders[1].makerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[maker][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[maker][signedOrders[0].makerTokenAddress].minus(fillMakerTokenAmount),
                );
                expect(newBalances[maker][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[maker][signedOrders[0].takerTokenAddress].add(fillTakerTokenAmount),
                );
                expect(newBalances[maker][zrx.address]).to.be.bignumber.equal(
                    balances[maker][zrx.address].minus(makerFee),
                );
                expect(newBalances[taker][signedOrders[0].takerTokenAddress]).to.be.bignumber.equal(
                    balances[taker][signedOrders[0].takerTokenAddress].minus(fillTakerTokenAmount),
                );
                expect(newBalances[taker][signedOrders[0].makerTokenAddress]).to.be.bignumber.equal(
                    balances[taker][signedOrders[0].makerTokenAddress].add(fillMakerTokenAmount),
                );
                expect(newBalances[taker][zrx.address]).to.be.bignumber.equal(
                    balances[taker][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipient][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipient][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire fillTakerTokenAmount', async () => {
                const fillTakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
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
                await exWrapper.fillOrdersUpToAsync(signedOrders, taker, {
                    fillTakerTokenAmount,
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
                    exWrapper.fillOrdersUpToAsync(signedOrders, taker, {
                        fillTakerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const cancelTakerTokenAmounts = _.map(signedOrders, signedOrder => signedOrder.takerTokenAmount);
                await exWrapper.batchCancelOrdersAsync(signedOrders, maker, {
                    cancelTakerTokenAmounts,
                });

                await exWrapper.batchFillOrdersAsync(signedOrders, taker, {
                    fillTakerTokenAmounts: cancelTakerTokenAmounts,
                });
                const newBalances = await dmyBalances.getAsync();
                expect(balances).to.be.deep.equal(newBalances);
            });
        });
    });
});
