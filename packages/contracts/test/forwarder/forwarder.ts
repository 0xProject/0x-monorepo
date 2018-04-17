import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ForwarderContract } from '../../src/contract_wrappers/generated/forwarder';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { ForwarderWrapper } from '../../src/utils/forwarder_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import {
    BalancesByOwner,
    ContractName,
    ExchangeContractErrs,
    SignatureType,
    SignedOrder,
    UnsignedOrder,
} from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

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
        weth = new DummyTokenContract(etherTokenInstance.abi, etherTokenInstance.address, provider);
        rep = new DummyTokenContract(repInstance.abi, repInstance.address, provider);
        zrx = new DummyTokenContract(zrxInstance.abi, zrxInstance.address, provider);
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(
            tokenTransferProxyInstance.abi,
            tokenTransferProxyInstance.address,
            provider,
        );
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            zrx.address,
            tokenTransferProxy.address,
        ]);
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: accounts[0],
        });
        zeroEx = new ZeroEx(provider, {
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
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
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
        forwarderContract = new ForwarderContract(forwarderInstance.abi, forwarderInstance.address, provider);
        await forwarderContract.initialize.sendTransactionAsync({ from: tokenOwner });
        forwarderWrapper = new ForwarderWrapper(forwarderContract);

        const wethDmmy = new DummyTokenContract(etherTokenInstance.abi, etherTokenInstance.address, provider);
        dmyBalances = new Balances(
            [rep, zrx, wethDmmy],
            [makerAddress, takerAddress, feeRecipientAddress, forwarderContract.address],
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        balances = await dmyBalances.getAsync();
        signedOrder = orderFactory.newSignedOrder();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrder', () => {
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

        it('should fill the order and perform fee abstraction', async () => {
            const orderWithFees = orderFactory.newSignedOrder({
                takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const feeOrder = orderFactory.newSignedOrder({
                makerTokenAddress: zrx.address,
                takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });

            const fillAmount = signedOrder.takerTokenAmount.div(2);
            const txHash = await forwarderWrapper.fillOrdersAsync(
                [orderWithFees],
                [feeOrder],
                fillAmount,
                takerAddress,
            );
            const newBalances = await dmyBalances.getAsync();
            const takerBalanceAfter = newBalances[takerAddress][signedOrder.makerTokenAddress];

            const acceptPerc = 98;
            const acceptableThreshold = fillAmount.times(acceptPerc).dividedBy(100);
            const withinThreshold = takerBalanceAfter.greaterThanOrEqualTo(acceptableThreshold);
            expect(withinThreshold).to.be.true();
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });
    });
    describe('fillOrderFee', () => {
        it('should fill the order and send fee to fee recipient', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            const feeProportion = 150; // 1.5%
            const txHash = await forwarderWrapper.fillOrdersFeeAsync(
                [signedOrder],
                [],
                fillAmount,
                feeProportion,
                feeRecipientAddress,
                takerAddress,
            );
            const newBalances = await dmyBalances.getAsync();
            const makerBalanceBefore = balances[makerAddress][signedOrder.makerTokenAddress];
            const makerBalanceAfter = newBalances[makerAddress][signedOrder.makerTokenAddress];
            const takerBalanceAfter = newBalances[takerAddress][signedOrder.makerTokenAddress];
            const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const takerBoughtAmount = takerBalanceAfter.minus(balances[takerAddress][signedOrder.makerTokenAddress]);

            expect(makerBalanceAfter).to.be.bignumber.equal(makerBalanceBefore.minus(takerBoughtAmount));
            expect(afterEthBalance).to.be.bignumber.equal(
                initEthBalance.plus(fillAmount.times(feeProportion).dividedBy(10000)),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should fail if the fee is set too high', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            const feeProportion = 1500; // 15.0%

            try {
                const txHash = await forwarderWrapper.fillOrdersFeeAsync(
                    [signedOrder],
                    [],
                    fillAmount,
                    feeProportion,
                    feeRecipientAddress,
                    takerAddress,
                );
                expect.fail(); // Never reached
            } catch (err) {
                const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
                expect(afterEthBalance).to.be.bignumber.equal(initEthBalance);
            }
        });
    });
});
