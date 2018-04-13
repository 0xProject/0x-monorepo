import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { ERC20Proxy_v1Contract } from '../../src/contract_wrappers/generated/erc20proxy_v1';
import {
    CancelContractEventArgs,
    ExchangeContract,
    ExchangeErrorContractEventArgs,
    FillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { encodeERC20ProxyData, encodeERC20V1ProxyData, encodeERC721ProxyData } from '../../src/utils/asset_proxy_utils';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { crypto } from '../../src/utils/crypto';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import {
    AssetProxyId,
    BalancesByOwner,
    ContractName,
    ExchangeContractErrs,
    SignatureType,
    SignedOrder,
} from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

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
    let ck: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let tokenTransferProxy: TokenTransferProxyContract;
    let assetProxyDispatcher: AssetProxyDispatcherContract;
    let erc20TransferProxyV1: ERC20Proxy_v1Contract;
    let erc20TransferProxy: ERC20ProxyContract;
    let erc721TransferProxy: ERC721ProxyContract;

    let signedOrder: SignedOrder;
    let balances: BalancesByOwner;
    let exWrapper: ExchangeWrapper;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    let zeroEx: ZeroEx;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        makerAddress = accounts[0];
        [tokenOwner, takerAddress, feeRecipientAddress] = accounts;
        const owner = tokenOwner;
        const [repInstance, dgdInstance, zrxInstance, ckInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721TOKEN_ARGS),
        ]);
        rep = new DummyTokenContract(repInstance.abi, repInstance.address, provider);
        dgd = new DummyTokenContract(dgdInstance.abi, dgdInstance.address, provider);
        zrx = new DummyTokenContract(zrxInstance.abi, zrxInstance.address, provider);
        ck = new DummyERC721TokenContract(ckInstance.abi, ckInstance.address, provider);
        // Deploy Asset Proxy Dispatcher
        const assetProxyDispatcherInstance = await deployer.deployAsync(ContractName.AssetProxyDispatcher);
        assetProxyDispatcher = new AssetProxyDispatcherContract(
            assetProxyDispatcherInstance.abi,
            assetProxyDispatcherInstance.address,
            provider,
        );
        // Deploy TokenTransferProxy
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(
            tokenTransferProxyInstance.abi,
            tokenTransferProxyInstance.address,
            provider,
        );
        // Deploy ERC20 V1 Proxy
        const erc20TransferProxyV1Instance = await deployer.deployAsync(ContractName.ERC20V1Proxy, [
            tokenTransferProxy.address,
        ]);
        erc20TransferProxyV1 = new ERC20Proxy_v1Contract(
            erc20TransferProxyV1Instance.abi,
            erc20TransferProxyV1Instance.address,
            provider,
        );
        await erc20TransferProxyV1.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(erc20TransferProxyV1.address, {
            from: owner,
        });
        await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
            AssetProxyId.ERC20V1,
            erc20TransferProxyV1.address,
            ZeroEx.NULL_ADDRESS,
            { from: owner },
        );
        // Deploy ERC20 Proxy
        const erc20TransferProxyInstance = await deployer.deployAsync(ContractName.ERC20Proxy);
        erc20TransferProxy = new ERC20ProxyContract(
            erc20TransferProxyInstance.abi,
            erc20TransferProxyInstance.address,
            provider,
        );
        await erc20TransferProxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
            AssetProxyId.ERC20,
            erc20TransferProxy.address,
            ZeroEx.NULL_ADDRESS,
            { from: owner },
        );
        // Deploy ERC721 Proxy
        const erc721TransferProxyInstance = await deployer.deployAsync(ContractName.ERC721Proxy);
        erc721TransferProxy = new ERC721ProxyContract(
            erc721TransferProxyInstance.abi,
            erc721TransferProxyInstance.address,
            provider,
        );
        await erc721TransferProxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        await assetProxyDispatcher.addAssetProxy.sendTransactionAsync(
            AssetProxyId.ERC721,
            erc721TransferProxy.address,
            ZeroEx.NULL_ADDRESS,
            { from: owner },
        );
        // Deploy and configure Exchange
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            zrx.address,
            encodeERC20ProxyData(zrx.address),
            assetProxyDispatcher.address,
        ]);
        exchange = new ExchangeContract(exchangeInstance.abi, exchangeInstance.address, provider);
        await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });
        zeroEx = new ZeroEx(provider, {
            exchangeContractAddress: exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        const defaultOrderParams = {
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerTokenAddress: rep.address,
            takerTokenAddress: dgd.address,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            makerAssetData: encodeERC20ProxyData(rep.address),
            takerAssetData: encodeERC20ProxyData(dgd.address),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        dmyBalances = new Balances([rep, dgd, zrx], [makerAddress, takerAddress, feeRecipientAddress]);
        await Promise.all([
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            rep.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            rep.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_ALLOWANCE, {
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
            dgd.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            dgd.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_ALLOWANCE, {
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
            zrx.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            zrx.approve.sendTransactionAsync(erc20TransferProxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            ck.setApprovalForAll.sendTransactionAsync(erc721TransferProxy.address, true, { from: makerAddress }),
            ck.setApprovalForAll.sendTransactionAsync(erc721TransferProxy.address, true, { from: takerAddress }),
            ck.mint.sendTransactionAsync(
                makerAddress,
                new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010'),
                { from: tokenOwner },
            ),
            ck.mint.sendTransactionAsync(
                makerAddress,
                new BigNumber('0x2020202020202020202020202020202020202020202020202020202020202020'),
                { from: tokenOwner },
            ),
            ck.mint.sendTransactionAsync(
                takerAddress,
                new BigNumber('0x3030303030303030303030303030303030303030303030303030303030303030'),
                { from: tokenOwner },
            ),
            ck.mint.sendTransactionAsync(
                takerAddress,
                new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040'),
                { from: tokenOwner },
            ),
        ]);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('internal functions', () => {
        it('should include transferViaTokenTransferProxy', () => {
            expect((exchange as any).transferViaTokenTransferProxy).to.be.undefined();
        });
    });

    describe('fillOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should create an unfillable order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: new BigNumber(1001),
                takerTokenAmount: new BigNumber(3),
            });

            const takerTokenFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerTokenFilledAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount1 = new BigNumber(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount: fillTakerTokenAmount1,
            });

            const takerTokenFilledAmountAfter1 = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerTokenFilledAmountAfter1).to.be.bignumber.equal(fillTakerTokenAmount1);

            const fillTakerTokenAmount2 = new BigNumber(1);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount: fillTakerTokenAmount2,
            });

            const takerTokenFilledAmountAfter2 = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerTokenFilledAmountAfter2).to.be.bignumber.equal(takerTokenFilledAmountAfter1);
        });

        it('should transfer the correct amounts when makerTokenAmount === takerTokenAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const takerTokenFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerTokenFilledAmountBefore).to.be.bignumber.equal(0);

            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerTokenFillAmount);

            const newBalances = await dmyBalances.getAsync();

            const makerTokenFilledAmount = takerTokenFillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(makerTokenFilledAmount),
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
                balances[takerAddress][signedOrder.makerTokenAddress].add(makerTokenFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when makerTokenAmount > takerTokenAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const takerTokenFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerTokenFilledAmountBefore).to.be.bignumber.equal(0);

            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerTokenFillAmount);

            const newBalances = await dmyBalances.getAsync();

            const makerTokenFilledAmount = takerTokenFillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(makerTokenFilledAmount),
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
                balances[takerAddress][signedOrder.makerTokenAddress].add(makerTokenFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when makerTokenAmount < takerTokenAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const takerTokenFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerTokenFilledAmountBefore).to.be.bignumber.equal(0);

            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerTokenFillAmount);

            const newBalances = await dmyBalances.getAsync();

            const makerTokenFilledAmount = takerTokenFillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(makerTokenFilledAmount),
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
                balances[takerAddress][signedOrder.makerTokenAddress].add(makerTokenFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAddress,
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const takerTokenFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerTokenFilledAmountBefore).to.be.bignumber.equal(0);

            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            const expectedMakerAmountBoughtAfter = takerTokenFillAmount.add(takerTokenFilledAmountBefore);
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(expectedMakerAmountBoughtAfter);

            const newBalances = await dmyBalances.getAsync();

            const makerTokenFilledAmount = takerTokenFillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(makerTokenFilledAmount),
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
                balances[takerAddress][signedOrder.makerTokenAddress].add(makerTokenFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should fill remaining value if takerTokenFillAmount > remaining takerTokenAmount', async () => {
            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });

            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount: signedOrder.takerTokenAmount,
            });
            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            expect(log.args.takerTokenFilledAmount).to.be.bignumber.equal(
                signedOrder.takerTokenAmount.minus(takerTokenFillAmount),
            );
            const newBalances = await dmyBalances.getAsync();

            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(signedOrder.makerTokenAmount),
            );
            expect(newBalances[makerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.takerTokenAddress].add(signedOrder.takerTokenAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.takerTokenAddress].minus(signedOrder.takerTokenAmount),
            );
            expect(newBalances[takerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.makerTokenAddress].add(signedOrder.makerTokenAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(signedOrder.makerFee.add(signedOrder.takerFee)),
            );
        });

        it('should log 1 event with the correct arguments when order has a feeRecipient', async () => {
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount: signedOrder.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            const logArgs = log.args;
            const expectedFilledMakerTokenAmount = signedOrder.makerTokenAmount.div(divisor);
            const expectedFilledTakerTokenAmount = signedOrder.takerTokenAmount.div(divisor);
            const expectedFeeMPaid = signedOrder.makerFee.div(divisor);
            const expectedFeeTPaid = signedOrder.takerFee.div(divisor);

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(takerAddress).to.be.equal(logArgs.takerAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerTokenAddress).to.be.equal(logArgs.makerTokenAddress);
            expect(signedOrder.takerTokenAddress).to.be.equal(logArgs.takerTokenAddress);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.makerTokenFilledAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.takerTokenFilledAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.makerFeePaid);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.takerFeePaid);
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should log 1 event with the correct arguments when order has no feeRecipient', async () => {
            signedOrder = orderFactory.newSignedOrder({
                feeRecipientAddress: ZeroEx.NULL_ADDRESS,
            });
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount: signedOrder.takerTokenAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            const logArgs = log.args;
            const expectedFilledMakerTokenAmount = signedOrder.makerTokenAmount.div(divisor);
            const expectedFilledTakerTokenAmount = signedOrder.takerTokenAmount.div(divisor);
            const expectedFeeMPaid = new BigNumber(0);
            const expectedFeeTPaid = new BigNumber(0);

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(takerAddress).to.be.equal(logArgs.takerAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerTokenAddress).to.be.equal(logArgs.makerTokenAddress);
            expect(signedOrder.takerTokenAddress).to.be.equal(logArgs.takerTokenAddress);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.makerTokenFilledAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.takerTokenFilledAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.makerFeePaid);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.takerFeePaid);
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should throw when taker is specified and order is claimed by other', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAddress: feeRecipientAddress,
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if signature is invalid', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(10), 18),
            });

            const invalidR = ethUtil.sha3('invalidR');
            const invalidS = ethUtil.sha3('invalidS');
            const signatureTypeAndV = signedOrder.signature.slice(0, 6);
            const invalidSigBuff = Buffer.concat([ethUtil.toBuffer(signatureTypeAndV), invalidR, invalidS]);
            const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
            signedOrder.signature = invalidSigHex;
            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerTokenAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerTokenAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerTokenFillAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder();

            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerTokenFillAmount: new BigNumber(0),
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if maker balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if taker balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if maker allowances are too low to fill order', async () => {
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), {
                from: makerAddress,
            });
            expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
            await rep.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            });
        });

        it('should throw if taker allowances are too low to fill order', async () => {
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, new BigNumber(0), {
                from: takerAddress,
            });
            expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
            await dgd.approve.sendTransactionAsync(tokenTransferProxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            });
        });

        it('should not change balances if an order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });
            await exWrapper.fillOrderAsync(signedOrder, takerAddress);

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should log an error event if an order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });

        it('should log an error event if no value is filled', async () => {
            signedOrder = orderFactory.newSignedOrder({});
            await exWrapper.fillOrderAsync(signedOrder, takerAddress);

            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_FULLY_FILLED);
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should throw if not sent by maker', async () => {
            return expect(exWrapper.cancelOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerTokenAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(signedOrder, makerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerTokenAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerTokenAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(signedOrder, makerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should be able to cancel a full order', async () => {
            await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount: signedOrder.takerTokenAmount.div(2),
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should log 1 event with correct arguments', async () => {
            const divisor = 2;
            const res = await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<CancelContractEventArgs>;
            const logArgs = log.args;

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerTokenAddress).to.be.equal(logArgs.makerTokenAddress);
            expect(signedOrder.takerTokenAddress).to.be.equal(logArgs.takerTokenAddress);
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should log an error if already cancelled', async () => {
            await exWrapper.cancelOrderAsync(signedOrder, makerAddress);

            const res = await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_CANCELLED);
        });

        it('should log error if order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });
    });

    describe('cancelOrdersUpTo', () => {
        it('should fail to set makerEpoch less than current makerEpoch', async () => {
            const makerEpoch = new BigNumber(1);
            await exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);
            const lesserMakerEpoch = new BigNumber(0);
            return expect(exWrapper.cancelOrdersUpToAsync(lesserMakerEpoch, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should fail to set makerEpoch equal to existing makerEpoch', async () => {
            const makerEpoch = new BigNumber(1);
            await exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);
            return expect(exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should cancel only orders with a makerEpoch less than existing makerEpoch', async () => {
            // Cancel all transactions with a makerEpoch less than 1
            const makerEpoch = new BigNumber(1);
            await exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);

            // Create 3 orders with makerEpoch values: 0,1,2,3
            // Since we cancelled with makerEpoch=1, orders with makerEpoch<=1 will not be processed
            balances = await dmyBalances.getAsync();
            const signedOrders = await Promise.all([
                orderFactory.newSignedOrder({
                    makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(9), 18),
                    takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(9), 18),
                    salt: new BigNumber(0),
                }),
                orderFactory.newSignedOrder({
                    makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(79), 18),
                    takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(79), 18),
                    salt: new BigNumber(1),
                }),
                orderFactory.newSignedOrder({
                    makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(979), 18),
                    takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(979), 18),
                    salt: new BigNumber(2),
                }),
                orderFactory.newSignedOrder({
                    makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(7979), 18),
                    takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(7979), 18),
                    salt: new BigNumber(3),
                }),
            ]);
            await exWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress);

            const newBalances = await dmyBalances.getAsync();
            const fillMakerTokenAmount = signedOrders[2].makerTokenAmount.add(signedOrders[3].makerTokenAmount);
            const fillTakerTokenAmount = signedOrders[2].takerTokenAmount.add(signedOrders[3].takerTokenAmount);
            const makerFee = signedOrders[2].makerFee.add(signedOrders[3].makerFee);
            const takerFee = signedOrders[2].takerFee.add(signedOrders[3].takerFee);
            expect(newBalances[makerAddress][signedOrders[3].makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrders[3].makerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[makerAddress][signedOrders[3].takerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrders[3].takerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][signedOrders[3].takerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrders[3].takerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[takerAddress][signedOrders[3].makerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrders[3].makerTokenAddress].add(fillMakerTokenAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
            );
        });
    });

    describe('Testing Exchange of ERC721 Tokens', () => {
        it('should successfully exchange a single token between the maker and taker (via fillOrder)', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
            const takerTokenId = new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: ck.address,
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: new BigNumber(1),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });
            // Verify post-conditions
            const newOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
            const newOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(newOwnerTakerToken).to.be.bignumber.equal(makerAddress);
        });

        it('should successfully exchange a single token between the maker and taker (via filleOrderNoThrow)', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
            const takerTokenId = new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: ck.address,
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: new BigNumber(1),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, { takerTokenFillAmount });
            // Verify post-conditions
            const newOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
            const newOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(newOwnerTakerToken).to.be.bignumber.equal(makerAddress);
        });

        it('should throw when maker does not own the token with id makerTokenId', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x3030303030303030303030303030303030303030303030303030303030303030');
            const takerTokenId = new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: ck.address,
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: new BigNumber(1),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.not.equal(makerAddress);
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when taker does not own the token with id takerTokenId', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
            const takerTokenId = new BigNumber('0x2020202020202020202020202020202020202020202020202020202020202020');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: ck.address,
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: new BigNumber(1),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.not.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when makerTokenAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
            const takerTokenId = new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: ck.address,
                makerTokenAmount: new BigNumber(2),
                takerTokenAmount: new BigNumber(1),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when takerTokenAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
            const takerTokenId = new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: ck.address,
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: new BigNumber(500),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw on partial fill', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
            const takerTokenId = new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: ck.address,
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: new BigNumber(0),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should successfully fill order when makerToken is ERC721 and takerToken is ERC20', async () => {
            // Construct Exchange parameters
            const makerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
            signedOrder = orderFactory.newSignedOrder({
                makerTokenAddress: ck.address,
                takerTokenAddress: dgd.address,
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                makerAssetData: encodeERC721ProxyData(ck.address, makerTokenId),
                takerAssetData: encodeERC20ProxyData(dgd.address),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            // Call Exchange
            balances = await dmyBalances.getAsync();
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });
            // Verify ERC721 token was transferred from Maker to Taker
            const newOwnerMakerToken = await ck.ownerOf.callAsync(makerTokenId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
            // Verify ERC20 tokens were transferred from Taker to Maker & fees were paid correctly
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[makerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.takerTokenAddress].add(takerTokenFillAmount),
            );
            expect(newBalances[takerAddress][signedOrder.takerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.takerTokenAddress].minus(takerTokenFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(signedOrder.makerFee.add(signedOrder.takerFee)),
            );
        });

        it('should successfully fill order when makerToken is ERC20 and takerToken is ERC721', async () => {
            // Construct Exchange parameters
            const takerTokenId = new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040');
            signedOrder = orderFactory.newSignedOrder({
                takerTokenAddress: ck.address,
                makerTokenAddress: dgd.address,
                takerTokenAmount: new BigNumber(1),
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetData: encodeERC721ProxyData(ck.address, takerTokenId),
                makerAssetData: encodeERC20ProxyData(dgd.address),
            });
            // Verify pre-conditions
            const initialOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            balances = await dmyBalances.getAsync();
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerTokenFillAmount });
            // Verify ERC721 token was transferred from Taker to Maker
            const newOwnerTakerToken = await ck.ownerOf.callAsync(takerTokenId);
            expect(newOwnerTakerToken).to.be.bignumber.equal(makerAddress);
            // Verify ERC20 tokens were transferred from Maker to Taker & fees were paid correctly
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[takerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][signedOrder.makerTokenAddress].add(signedOrder.makerTokenAmount),
            );
            expect(newBalances[makerAddress][signedOrder.makerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][signedOrder.makerTokenAddress].minus(signedOrder.makerTokenAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(signedOrder.makerFee.add(signedOrder.takerFee)),
            );
        });
    });
}); // tslint:disable-line:max-file-line-count
