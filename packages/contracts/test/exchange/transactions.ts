import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';

import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import * as Web3 from 'web3';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import { TransactionFactory } from '../../src/utils/transaction_factory';
import {
    BalancesByOwner,
    ContractName,
    ExchangeContractErrs,
    OrderStruct,
    SignatureType,
    SignedOrder,
    SignedTransaction,
} from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { web3, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange transactions', () => {
    let senderAddress: string;
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
    let tokenTransferProxy: TokenTransferProxyContract;

    let signedOrder: SignedOrder;
    let order: OrderStruct;
    let balances: BalancesByOwner;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;
    let transactionFactory: TransactionFactory;
    let zeroEx: ZeroEx;
    let exWrapper: ExchangeWrapper;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        makerAddress = accounts[0];
        [tokenOwner, takerAddress, feeRecipientAddress, senderAddress] = accounts;
        const [repInstance, dgdInstance, zrxInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
        ]);
        rep = new DummyTokenContract(web3Wrapper, repInstance.abi, repInstance.address);
        dgd = new DummyTokenContract(web3Wrapper, dgdInstance.abi, dgdInstance.address);
        zrx = new DummyTokenContract(web3Wrapper, zrxInstance.abi, zrxInstance.address);
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
        zeroEx = new ZeroEx(web3.currentProvider, {
            exchangeContractAddress: exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        const defaultOrderParams = {
            senderAddress,
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerTokenAddress: rep.address,
            takerTokenAddress: dgd.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        };
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[1];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        transactionFactory = new TransactionFactory(takerPrivateKey);
        dmyBalances = new Balances([rep, dgd, zrx], [makerAddress, takerAddress, feeRecipientAddress]);
        await Promise.all([
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            rep.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            rep.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            dgd.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(feeRecipientAddress, INITIAL_BALANCE, { from: tokenOwner }),
        ]);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('executeTransaction', () => {
        describe('fillOrder', () => {
            beforeEach(async () => {
                balances = await dmyBalances.getAsync();
                signedOrder = orderFactory.newSignedOrder();
                order = orderUtils.getOrderStruct(signedOrder);
            });

            it('should transfer the correct amounts when signed by taker and called by sender', async () => {
                const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                const data = exchange.fillOrder.getABIEncodedTransactionData(
                    order,
                    takerTokenFillAmount,
                    signedOrder.signature,
                );
                const signedTx = transactionFactory.newSignedTransaction(data);
                await exWrapper.executeTransactionAsync(signedTx, senderAddress);
                const newBalances = await dmyBalances.getAsync();

                const makerTokenFillAmount = takerTokenFillAmount
                    .times(signedOrder.makerTokenAmount)
                    .dividedToIntegerBy(signedOrder.takerTokenAmount);
                const makerFeePaid = signedOrder.makerFeeAmount
                    .times(makerTokenFillAmount)
                    .dividedToIntegerBy(signedOrder.makerTokenAmount);
                const takerFeePaid = signedOrder.takerFeeAmount
                    .times(makerTokenFillAmount)
                    .dividedToIntegerBy(signedOrder.makerTokenAmount);
                expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrder.makerTokenAddress].minus(makerTokenFillAmount),
                );
                expect(newBalances[makerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][signedOrder.takerTokenAddress].add(takerTokenFillAmount),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFeePaid),
                );
                expect(newBalances[takerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrder.takerTokenAddress].minus(takerTokenFillAmount),
                );
                expect(newBalances[takerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][signedOrder.makerTokenAddress].add(makerTokenFillAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFeePaid),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
                );
            });
        });
    });
});
