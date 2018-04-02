import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';

import * as _ from 'lodash';

import { DummyTokenContract } from '../../../contracts/src/contract_wrappers/generated/dummy_token';
import { TokenTransferProxyContract } from '../../../contracts/src/contract_wrappers/generated/token_transfer_proxy';
import { Balances } from '../../../contracts/src/utils/balances';
import { constants } from '../../../contracts/src/utils/constants';
import { OrderFactory } from '../../../contracts/src/utils/order_factory';
import {
    BalancesByOwner,
    ContractName,
    ExchangeContractErrs,
    SignatureType,
    SignedOrder,
} from '../../../contracts/src/utils/types';
import { ForwarderWrapper } from '../../src/contract_wrappers/forwarder_wrapper';
import { ForwarderContract } from '../../src/contract_wrappers/generated/forwarder';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { web3, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;

describe('Forwarder', () => {
    let makerAddress: string;
    let tokenOwner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    const INITIAL_BALANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), DECIMALS_DEFAULT);
    const INITIAL_ALLOWANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), DECIMALS_DEFAULT);

    let rep: DummyTokenContract;
    let zrx: DummyTokenContract;
    let weth: DummyTokenContract;
    let forwarderContract: ForwarderContract;
    let forwarderWrapper: ForwarderWrapper;
    let tokenTransferProxy: TokenTransferProxyContract;

    let signedOrder: SignedOrder;
    let balances: BalancesByOwner;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    let zeroEx: ZeroEx;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        makerAddress = accounts[0];
        [tokenOwner, takerAddress, feeRecipientAddress] = accounts;
        const [repInstance, zrxInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
        ]);

        const etherTokenInstance = await deployer.deployAsync(ContractName.EtherToken);
        weth = new DummyTokenContract(web3Wrapper, etherTokenInstance.abi, etherTokenInstance.address);
        rep = new DummyTokenContract(web3Wrapper, repInstance.abi, repInstance.address);
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
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: accounts[0],
        });
        zeroEx = new ZeroEx(web3.currentProvider, {
            exchangeContractAddress: exchangeInstance.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        const defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            makerAddress,
            feeRecipientAddress,
            makerTokenAddress: rep.address,
            takerTokenAddress: etherTokenInstance.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), DECIMALS_DEFAULT),
            makerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            // takerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        await Promise.all([
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            rep.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
        ]);

        const forwarderArgs = [
            exchangeInstance.address,
            tokenTransferProxyInstance.address,
            etherTokenInstance.address,
            zrx.address,
        ];
        const forwarderInstance = await deployer.deployAndSaveAsync('Forwarder', forwarderArgs);
        forwarderContract = new ForwarderContract(web3Wrapper, forwarderInstance.abi, forwarderInstance.address);
        await forwarderContract.initialize.sendTransactionAsync({ from: tokenOwner });
        forwarderWrapper = new ForwarderWrapper(forwarderContract);

        const wethDmmy = new DummyTokenContract(web3Wrapper, etherTokenInstance.abi, etherTokenInstance.address);
        dmyBalances = new Balances(
            [rep, zrx, wethDmmy],
            [makerAddress, takerAddress, feeRecipientAddress, forwarderContract.address],
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should fill the order', async () => {
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            const txHash = await forwarderWrapper.fillOrdersAsync([signedOrder], [], fillAmount, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            const makerBalanceBefore = balances[makerAddress][signedOrder.makerTokenAddress];
            const makerBalanceAfter = newBalances[makerAddress][signedOrder.makerTokenAddress];
            const takerBalanceAfter = newBalances[takerAddress][signedOrder.makerTokenAddress];
            const makerTokenFillAmount = fillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);

            expect(makerBalanceAfter).to.be.bignumber.equal(makerBalanceBefore.minus(makerTokenFillAmount));
            expect(takerBalanceAfter).to.be.bignumber.equal(makerTokenFillAmount);
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });

        it.only('should fill the order and perform fee abstraction', async () => {
            const orderWithFees = orderFactory.newSignedOrder({
                takerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const feeOrder = orderFactory.newSignedOrder({
                makerTokenAddress: zrx.address,
                makerFeeAmount: ZeroEx.toBaseUnitAmount(new BigNumber(2000), DECIMALS_DEFAULT),
            });

            const fillAmount = signedOrder.takerTokenAmount.div(2);
            // tslint:disable:no-console
            console.log('filling amount', ZeroEx.toUnitAmount(fillAmount, 18).toString());
            const quote = await forwarderWrapper.marketSellOrdersQuoteAsync([orderWithFees], fillAmount);
            const feeAmount = quote[3];
            const feeQuote = await forwarderWrapper.marketBuyOrdersQuoteAsync([feeOrder], feeAmount);
            console.log(
                'sell quote',
                _.map(quote, q => ZeroEx.toUnitAmount(new BigNumber(q.toString()), DECIMALS_DEFAULT).toString()),
            );
            console.log(
                'buy zrx quote',
                _.map(feeQuote, q => ZeroEx.toUnitAmount(new BigNumber(q.toString()), DECIMALS_DEFAULT).toString()),
            );
            const txHash = await forwarderWrapper.fillOrdersAsync(
                [orderWithFees],
                [feeOrder],
                fillAmount,
                takerAddress,
            );
            console.log(txHash);
            const newBalances = await dmyBalances.getAsync();
            const makerBalanceBefore = balances[makerAddress][signedOrder.makerTokenAddress];
            const makerBalanceAfter = newBalances[makerAddress][signedOrder.makerTokenAddress];
            const takerBalanceAfter = newBalances[takerAddress][signedOrder.makerTokenAddress];
            const decimals = 18;
            console.log(
                'forwarder rep balance',
                ZeroEx.toUnitAmount(newBalances[forwarderContract.address][rep.address], decimals).toString(),
            );
            console.log(
                'forwarder weth balance',
                ZeroEx.toUnitAmount(newBalances[forwarderContract.address][weth.address], decimals).toString(),
            );
            console.log(
                'forwarder zrx balance',
                ZeroEx.toUnitAmount(newBalances[forwarderContract.address][zrx.address], decimals).toString(),
            );

            console.log(
                'taker rep balance',
                ZeroEx.toUnitAmount(newBalances[takerAddress][rep.address], decimals).toString(),
            );
            console.log(
                'taker weth balance',
                ZeroEx.toUnitAmount(newBalances[takerAddress][weth.address], decimals).toString(),
            );
            console.log(
                'taker zrx balance',
                ZeroEx.toUnitAmount(newBalances[takerAddress][zrx.address], decimals).toString(),
            );
            const makerTokenFillAmount = fillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);

            expect(makerBalanceAfter).to.be.bignumber.equal(makerBalanceBefore.minus(makerTokenFillAmount));
            expect(takerBalanceAfter).to.be.bignumber.equal(makerTokenFillAmount);
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });
    });
});
