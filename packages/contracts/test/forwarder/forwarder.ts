import { TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { ForwarderContract } from '../../src/contract_wrappers/generated/forwarder';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { encodeERC20ProxyData, encodeERC721ProxyData } from '../../src/utils/asset_proxy_utils';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { ForwarderWrapper } from '../../src/utils/forwarder_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import {
    AssetProxyId,
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

function debugLogs(tx: TransactionReceiptWithDecodedLogs) {
    _.each(tx.logs, log => {
        // tslint:disable-next-line:no-console
        console.log((log as any).event, (log as any).args);
        _.each((log as any).args, arg => {
            // tslint:disable-next-line:no-console
            console.log(arg.toString());
        });
    });
}

describe.only('Forwarder', () => {
    let makerAddress: string;
    let tokenOwner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let defaultTakerTokenAddress: string;
    let defaultMakerTokenAddress: string;
    const INITIAL_BALANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), DECIMALS_DEFAULT);
    const INITIAL_ALLOWANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), DECIMALS_DEFAULT);

    let rep: DummyTokenContract;
    let zrx: DummyTokenContract;
    let weth: DummyTokenContract;
    let erc721Token: DummyERC721TokenContract;
    let forwarderContract: ForwarderContract;
    let forwarderWrapper: ForwarderWrapper;
    let assetProxyDispatcher: AssetProxyDispatcherContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let signedOrder: SignedOrder;
    let orderWithFees: SignedOrder;
    let feeOrder: SignedOrder;
    let balances: BalancesByOwner;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    let zeroEx: ZeroEx;

    const erc721MakerTokenIds = [
        new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010'),
        new BigNumber('0x2020202020202020202020202020202020202020202020202020202020202020'),
    ];

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        makerAddress = accounts[0];
        [tokenOwner, takerAddress, feeRecipientAddress] = accounts;
        const owner = tokenOwner;
        const [repInstance, zrxInstance, erc721TokenInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721TOKEN_ARGS),
        ]);

        const etherTokenInstance = await deployer.deployAsync(ContractName.EtherToken);
        weth = new DummyTokenContract(etherTokenInstance.abi, etherTokenInstance.address, provider);
        rep = new DummyTokenContract(repInstance.abi, repInstance.address, provider);
        zrx = new DummyTokenContract(zrxInstance.abi, zrxInstance.address, provider);
        erc721Token = new DummyERC721TokenContract(erc721TokenInstance.abi, erc721TokenInstance.address, provider);

        // Deploy Asset Proxy Dispatcher
        const assetProxyDispatcherInstance = await deployer.deployAsync(ContractName.AssetProxyDispatcher);
        assetProxyDispatcher = new AssetProxyDispatcherContract(
            assetProxyDispatcherInstance.abi,
            assetProxyDispatcherInstance.address,
            provider,
        );
        // Deploy ERC20 Proxy
        const erc20ProxyInstance = await deployer.deployAsync(ContractName.ERC20Proxy);
        erc20Proxy = new ERC20ProxyContract(erc20ProxyInstance.abi, erc20ProxyInstance.address, provider);
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        const prevERC20ProxyAddress = ZeroEx.NULL_ADDRESS;
        await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
            AssetProxyId.ERC20,
            erc20Proxy.address,
            prevERC20ProxyAddress,
            { from: owner },
        );
        // Deploy ERC721 Proxy
        const erc721ProxyInstance = await deployer.deployAsync(ContractName.ERC721Proxy);
        erc721Proxy = new ERC721ProxyContract(erc721ProxyInstance.abi, erc721ProxyInstance.address, provider);
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        const prevERC721ProxyAddress = ZeroEx.NULL_ADDRESS;
        await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
            AssetProxyId.ERC721,
            erc721Proxy.address,
            prevERC721ProxyAddress,
            { from: owner },
        );
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            zrx.address,
            encodeERC20ProxyData(zrx.address),
            assetProxyDispatcher.address,
        ]);
        await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, { from: owner });
        zeroEx = new ZeroEx(provider, {
            exchangeContractAddress: exchangeInstance.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        defaultMakerTokenAddress = rep.address;
        defaultTakerTokenAddress = etherTokenInstance.address;
        const defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: encodeERC20ProxyData(defaultMakerTokenAddress),
            takerAssetData: encodeERC20ProxyData(defaultTakerTokenAddress),
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        await Promise.all([
            rep.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            rep.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
                from: makerAddress,
            }),
            erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
                from: takerAddress,
            }),
            erc721Token.mint.sendTransactionAsync(makerAddress, erc721MakerTokenIds[0], { from: tokenOwner }),
            erc721Token.mint.sendTransactionAsync(makerAddress, erc721MakerTokenIds[1], { from: tokenOwner }),
        ]);

        const forwarderArgs = [
            exchangeInstance.address,
            assetProxyDispatcher.address,
            etherTokenInstance.address,
            zrx.address,
            AssetProxyId.ERC20,
        ];
        const forwarderInstance = await deployer.deployAndSaveAsync('Forwarder', forwarderArgs);
        forwarderContract = new ForwarderContract(forwarderInstance.abi, forwarderInstance.address, provider);
        // await forwarderContract.setERC20ProxyApproval.sendTransactionAsync(AssetProxyId.ERC20, { from: tokenOwner });
        forwarderWrapper = new ForwarderWrapper(forwarderContract, web3Wrapper);

        const wethDmmy = new DummyTokenContract(etherTokenInstance.abi, etherTokenInstance.address, provider);
        dmyBalances = new Balances(
            [rep, zrx, wethDmmy],
            [makerAddress, takerAddress, feeRecipientAddress, forwarderContract.address],
        );
        web3Wrapper.abiDecoder.addABI(forwarderContract.abi);
        web3Wrapper.abiDecoder.addABI(exchangeInstance.abi);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        balances = await dmyBalances.getAsync();
        signedOrder = orderFactory.newSignedOrder();
        feeOrder = orderFactory.newSignedOrder({
            makerAssetData: encodeERC20ProxyData(zrx.address),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        });
        orderWithFees = orderFactory.newSignedOrder({
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('buyTokens', () => {
        it('should fill the order', async () => {
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            const tx = await forwarderWrapper.buyTokensAsync([signedOrder], [], fillAmount, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            const makerBalanceBefore = balances[makerAddress][defaultMakerTokenAddress];
            const makerBalanceAfter = newBalances[makerAddress][defaultMakerTokenAddress];
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerTokenAddress];
            const makerTokenFillAmount = fillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);

            expect(makerBalanceAfter).to.be.bignumber.equal(makerBalanceBefore.minus(makerTokenFillAmount));
            expect(takerBalanceAfter).to.be.bignumber.equal(makerTokenFillAmount);
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });

        it('should fill the order and perform fee abstraction', async () => {
            const fillAmount = signedOrder.takerTokenAmount.div(4);
            await forwarderWrapper.buyTokensAsync([orderWithFees], [feeOrder], fillAmount, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerTokenAddress];

            const acceptPerc = 98;
            const acceptableThreshold = fillAmount.times(acceptPerc).dividedBy(100);
            const withinThreshold = takerBalanceAfter.greaterThanOrEqualTo(acceptableThreshold);
            expect(withinThreshold).to.be.true();
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
            const tx = await forwarderWrapper.buyTokensAsync([orderWithFees], [feeOrder], fillAmount, takerAddress);
        });
    });
    describe('buyTokensFee', () => {
        it('should fill the order and send fee to fee recipient', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            const feeProportion = 150; // 1.5%
            const txHash = await forwarderWrapper.buyTokensFeeAsync(
                [signedOrder],
                [],
                fillAmount,
                feeProportion,
                feeRecipientAddress,
                takerAddress,
            );
            const newBalances = await dmyBalances.getAsync();
            const makerBalanceBefore = balances[makerAddress][defaultMakerTokenAddress];
            const makerBalanceAfter = newBalances[makerAddress][defaultMakerTokenAddress];
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerTokenAddress];
            const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const takerBoughtAmount = takerBalanceAfter.minus(balances[takerAddress][defaultMakerTokenAddress]);

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
                const txHash = await forwarderWrapper.buyTokensFeeAsync(
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
    describe('withdraw', () => {
        it('attributes any left over zrx from fee abstraction to the caller', async () => {
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            await forwarderWrapper.buyTokensAsync([orderWithFees], [feeOrder], fillAmount, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            const forwarderBalanceAfter = newBalances[forwarderContract.address][zrx.address];
            const takerForwarderBalance = await forwarderContract.balanceOf.callAsync(takerAddress);
            expect(forwarderBalanceAfter).to.be.bignumber.greaterThan(new BigNumber(0));
            expect(takerForwarderBalance).to.be.bignumber.equal(forwarderBalanceAfter);
        });
        it('allows the user to withdraw left over fees', async () => {
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            await forwarderWrapper.buyTokensAsync([orderWithFees], [feeOrder], fillAmount, takerAddress);
            const afterBuyBalances = await dmyBalances.getAsync();
            const takerZRXBalanceBeforeWithdraw = afterBuyBalances[takerAddress][zrx.address];
            const takerForwarderBalance = await forwarderContract.balanceOf.callAsync(takerAddress);
            const txHash = await forwarderContract.withdraw.sendTransactionAsync(takerForwarderBalance, {
                from: takerAddress,
            });
            const newBalances = await dmyBalances.getAsync();
            const takerZRXBalanceAfterWithdraw = newBalances[takerAddress][zrx.address];
            expect(takerZRXBalanceAfterWithdraw).to.be.bignumber.eq(
                takerZRXBalanceBeforeWithdraw.plus(takerForwarderBalance),
            );
            const takerForwarderBalanceAfterWidthdraw = await forwarderContract.balanceOf.callAsync(takerAddress);
            expect(takerForwarderBalanceAfterWidthdraw).to.be.bignumber.eq(new BigNumber(0));
        });
    });
    describe('quote', () => {
        it('buyTokensQuote - no fees', async () => {
            const fillAmount = signedOrder.takerTokenAmount.div(4);
            const sellQuote = await forwarderWrapper.buyTokensQuoteAsync([signedOrder], [], fillAmount);
            const tx = await forwarderWrapper.buyTokensAsync([signedOrder], [], fillAmount, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerTokenAddress];
            expect(takerBalanceAfter).to.be.bignumber.eq(sellQuote.makerTokenFilledAmount);
        });
        it('buyTokensQuote - fee abstraction', async () => {
            const fillAmount = signedOrder.takerTokenAmount.div(2);
            const buyTokensQuote = await forwarderWrapper.buyTokensQuoteAsync([orderWithFees], [feeOrder], fillAmount);
            const tx = await forwarderWrapper.buyTokensAsync([orderWithFees], [feeOrder], fillAmount, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerTokenAddress];
            expect(takerBalanceAfter).to.be.bignumber.eq(buyTokensQuote.makerTokenFilledAmount);
        });
    });
    describe('Non fungible tokens', async () => {
        it('buys non fungible tokens', async () => {
            const makerTokenId = erc721MakerTokenIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: new BigNumber(1),
                makerAssetData: encodeERC721ProxyData(erc721Token.address, makerTokenId),
            });
            const tx = await forwarderWrapper.buyNFTTokensAsync([signedOrder], [feeOrder], takerAddress);
        });
        it('buys non fungible tokens with fee abstraction', async () => {
            const makerTokenId = erc721MakerTokenIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: new BigNumber(1),
                takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
                makerAssetData: encodeERC721ProxyData(erc721Token.address, makerTokenId),
            });
            const tx = await forwarderWrapper.buyNFTTokensAsync([signedOrder], [feeOrder], takerAddress);
        });
    });
});
