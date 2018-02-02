import { ECSignature, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';

import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { crypto } from '../../util/crypto';
import { ExchangeWrapper } from '../../util/exchange_wrapper';
import { Order } from '../../util/order';
import { OrderFactory } from '../../util/order_factory';
import { BalancesByOwner, ContractName, ExchangeContractErrs } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';

chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const blockchainLifecycle = new BlockchainLifecycle();

describe.only('Arbitrage', () => {
    let coinbase: string;
    let maker: string;
    let edMaker: string;
    let edFrontRunner: string;
    const feeRecipient = ZeroEx.NULL_ADDRESS;
    const INITIAL_BALANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);
    const INITIAL_ALLOWANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);

    let weth: Web3.ContractInstance;
    let zrx: Web3.ContractInstance;
    let arbitrage: Web3.ContractInstance;
    let etherDelta: Web3.ContractInstance;

    let order: Order;
    let exWrapper: ExchangeWrapper;
    let orderFactory: OrderFactory;

    let zeroEx: ZeroEx;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [coinbase, maker, edMaker, edFrontRunner] = accounts;
        weth = await deployer.deployAsync(ContractName.DummyToken);
        zrx = await deployer.deployAsync(ContractName.DummyToken);
        const accountLevels = await deployer.deployAsync(ContractName.AccountLevels);
        const edAdminAddress = accounts[0];
        const edMakerFee = 0;
        const edTakerFee = 0;
        const edFeeRebate = 0;
        etherDelta = await deployer.deployAsync(ContractName.EtherDelta, [
            edAdminAddress,
            feeRecipient,
            accountLevels.address,
            edMakerFee,
            edTakerFee,
            edFeeRebate,
        ]);
        const tokenTransferProxy = await deployer.deployAsync(ContractName.TokenTransferProxy);
        const exchange = await deployer.deployAsync(ContractName.Exchange, [zrx.address, tokenTransferProxy.address]);
        await tokenTransferProxy.addAuthorizedAddress(exchange.address, { from: accounts[0] });
        zeroEx = new ZeroEx(web3.currentProvider, {
            exchangeContractAddress: exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        const defaultOrderParams = {
            exchangeContractAddress: exchange.address,
            maker,
            feeRecipient,
            makerToken: zrx.address,
            takerToken: weth.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
        };
        orderFactory = new OrderFactory(web3Wrapper, defaultOrderParams);
        arbitrage = await deployer.deployAsync(ContractName.Arbitrage, [
            exchange.address,
            etherDelta.address,
            tokenTransferProxy.address,
        ]);
        // Enable arbitrage and withdrawals of tokens
        await arbitrage.setAllowances(weth.address, { from: coinbase });
        await arbitrage.setAllowances(zrx.address, { from: coinbase });

        // Give some tokens to arbitrage contract
        await weth.setBalance(arbitrage.address, ZeroEx.toBaseUnitAmount(new BigNumber(1), 18), { from: coinbase });

        // Fund the maker on exchange side
        await zrx.setBalance(maker, ZeroEx.toBaseUnitAmount(new BigNumber(1), 18), { from: coinbase });
        // Set the allowance for the maker on Exchange side
        await zrx.approve(tokenTransferProxy.address, INITIAL_ALLOWANCE, { from: maker });

        const amountGive = ZeroEx.toBaseUnitAmount(new BigNumber(2), 18);
        // Fund the maker on EtherDelta side
        await weth.setBalance(edMaker, ZeroEx.toBaseUnitAmount(new BigNumber(2), 18), { from: coinbase });
        // Set the allowance for the maker on EtherDelta side
        await weth.approve(etherDelta.address, INITIAL_ALLOWANCE, { from: edMaker });
        // Deposit maker funds into EtherDelta
        await etherDelta.depositToken(weth.address, amountGive, { from: edMaker });

        const amountGet = ZeroEx.toBaseUnitAmount(new BigNumber(1), 18);
        // Fund the front runner on EtherDelta side
        await zrx.setBalance(edFrontRunner, amountGet, { from: coinbase });
        // Set the allowance for the maker on EtherDelta side
        await zrx.approve(etherDelta.address, INITIAL_ALLOWANCE, { from: edFrontRunner });
        // Deposit front runner funds into EtherDelta
        await etherDelta.depositToken(zrx.address, amountGet, { from: edFrontRunner });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('makeAtomicTrade', () => {
        let addresses: string[];
        let values: BigNumber[];
        let v: number[];
        let r: string[];
        let s: string[];
        let tokenGet: string;
        let tokenGive: string;
        let amountGet: BigNumber;
        let amountGive: BigNumber;
        let expires: BigNumber;
        let nonce: BigNumber;
        let edSignature: ECSignature;
        before(async () => {
            order = await orderFactory.newSignedOrderAsync();
            const shouldAddPersonalMessagePrefix = false;
            tokenGet = zrx.address;
            amountGet = ZeroEx.toBaseUnitAmount(new BigNumber(1), 18);
            tokenGive = weth.address;
            amountGive = ZeroEx.toBaseUnitAmount(new BigNumber(2), 18);
            const blockNumber = await web3Wrapper.getBlockNumberAsync();
            expires = new BigNumber(blockNumber + 10);
            nonce = new BigNumber(42);
            const edOrderHash = `0x${crypto
                .solSHA256([etherDelta.address, tokenGet, amountGet, tokenGive, amountGive, expires, nonce])
                .toString('hex')}`;
            edSignature = await zeroEx.signOrderHashAsync(edOrderHash, edMaker, shouldAddPersonalMessagePrefix);
            addresses = [
                order.params.maker,
                order.params.taker,
                order.params.makerToken,
                order.params.takerToken,
                order.params.feeRecipient,
                tokenGet,
                tokenGive,
                edMaker,
            ];
            const fillTakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), 18);
            const edFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), 18);
            values = [
                order.params.makerTokenAmount,
                order.params.takerTokenAmount,
                order.params.makerFee,
                order.params.takerFee,
                order.params.expirationTimestampInSec,
                order.params.salt,
                fillTakerTokenAmount,
                amountGet,
                amountGive,
                expires,
                nonce,
                edFillAmount,
            ];
            v = [order.params.v as number, edSignature.v];
            r = [order.params.r as string, edSignature.r];
            s = [order.params.s as string, edSignature.s];
        });
        it('1', async () => {
            const txHash = await arbitrage.makeAtomicTrade(addresses, values, v, r, s, { from: coinbase });
            const res = await zeroEx.awaitTransactionMinedAsync(txHash);
            const postBalance = await weth.balanceOf(arbitrage.address);
            expect(postBalance).to.be.bignumber.equal(ZeroEx.toBaseUnitAmount(new BigNumber(2), 18));
        });
        it('2', async () => {
            // Front-running transaction
            await etherDelta.trade(
                tokenGet,
                amountGet,
                tokenGive,
                amountGive,
                expires,
                nonce,
                edMaker,
                edSignature.v,
                edSignature.r,
                edSignature.s,
                ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
                { from: edFrontRunner },
            );
            return expect(arbitrage.makeAtomicTrade(addresses, values, v, r, s, { from: coinbase })).to.be.rejectedWith(
                constants.REVERT,
            );
        });
    });
});
