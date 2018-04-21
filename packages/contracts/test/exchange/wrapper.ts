import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { TokenRegistryContract } from '../../src/contract_wrappers/generated/token_registry';
import { encodeERC20ProxyData, encodeERC721ProxyData } from '../../src/utils/asset_proxy_utils';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { AssetProxyId, BalancesByOwner, ContractName, SignedOrder } from '../../src/utils/types';
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
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let tokenRegistry: TokenRegistryContract;
    let assetProxyDispatcher: AssetProxyDispatcherContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let balances: BalancesByOwner;

    let exWrapper: ExchangeWrapper;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    const erc721MakerTokenId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
    const erc721TakerTokenId = new BigNumber('0x3030303030303030303030303030303030303030303030303030303030303030');

    let defaultMakerTokenAddress: string;
    let defaultTakerTokenAddress: string;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        tokenOwner = accounts[0];
        [makerAddress, takerAddress, feeRecipientAddress] = accounts;
        const owner = tokenOwner;
        const [repInstance, dgdInstance, zrxInstance, erc721TokenInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyToken, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721TOKEN_ARGS),
        ]);
        rep = new DummyTokenContract(repInstance.abi, repInstance.address, provider);
        dgd = new DummyTokenContract(dgdInstance.abi, dgdInstance.address, provider);
        zrx = new DummyTokenContract(zrxInstance.abi, zrxInstance.address, provider);
        erc721Token = new DummyERC721TokenContract(erc721TokenInstance.abi, erc721TokenInstance.address, provider);
        const tokenRegistryInstance = await deployer.deployAsync(ContractName.TokenRegistry);
        tokenRegistry = new TokenRegistryContract(tokenRegistryInstance.abi, tokenRegistryInstance.address, provider);
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
        // Deploy and configure Exchange
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            assetProxyDispatcher.address,
            encodeERC20ProxyData(zrx.address),
        ]);
        exchange = new ExchangeContract(exchangeInstance.abi, exchangeInstance.address, provider);
        await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });

        const zeroEx = new ZeroEx(provider, { networkId: constants.TESTRPC_NETWORK_ID });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        defaultMakerTokenAddress = rep.address;
        defaultTakerTokenAddress = dgd.address;
        const defaultOrderParams = {
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            makerAssetData: encodeERC20ProxyData(defaultMakerTokenAddress),
            takerAssetData: encodeERC20ProxyData(defaultTakerTokenAddress),
        };

        const privateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        dmyBalances = new Balances([rep, dgd, zrx], [makerAddress, takerAddress, feeRecipientAddress]);
        await Promise.all([
            rep.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, { from: makerAddress }),
            rep.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, { from: takerAddress }),
            rep.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            rep.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, { from: makerAddress }),
            dgd.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, { from: takerAddress }),
            dgd.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, { from: makerAddress }),
            zrx.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, { from: takerAddress }),
            zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
                from: makerAddress,
            }),
            erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
                from: takerAddress,
            }),
            erc721Token.mint.sendTransactionAsync(makerAddress, erc721MakerTokenId, { from: tokenOwner }),
            erc721Token.mint.sendTransactionAsync(takerAddress, erc721TakerTokenId, { from: tokenOwner }),
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
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrKillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const makerTokenFilledAmount = takerTokenFillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFee = signedOrder.makerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFee = signedOrder.takerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(makerTokenFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(takerTokenFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(takerTokenFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(makerTokenFilledAmount),
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

        it('should throw if entire takerTokenFillAmount not filled', async () => {
            const signedOrder = orderFactory.newSignedOrder();

            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerTokenFillAmount: signedOrder.takerTokenAmount.div(2),
            });

            return expect(exWrapper.fillOrKillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });
    });

    describe('fillOrderNoThrow', () => {
        it('should transfer the correct amounts', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, {
                takerTokenFillAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const makerTokenFilledAmount = takerTokenFillAmount
                .times(signedOrder.makerTokenAmount)
                .dividedToIntegerBy(signedOrder.takerTokenAmount);
            const makerFee = signedOrder.makerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            const takerFee = signedOrder.takerFee
                .times(makerTokenFilledAmount)
                .dividedToIntegerBy(signedOrder.makerTokenAmount);
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(makerTokenFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(takerTokenFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(takerTokenFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(makerTokenFilledAmount),
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
                makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if taker balances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if maker allowances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder();
            await rep.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                from: makerAddress,
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            await rep.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if taker allowances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder();
            await dgd.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                from: takerAddress,
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            await dgd.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if makerTokenAddress is ZRX, makerTokenAmount + makerFee > maker balance', async () => {
            const makerZRXBalance = new BigNumber(balances[makerAddress][zrx.address]);
            const signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: makerZRXBalance,
                makerFee: new BigNumber(1),
                makerAssetData: encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if makerTokenAddress is ZRX, makerTokenAmount + makerFee > maker allowance', async () => {
            const makerZRXAllowance = await zrx.allowance.callAsync(makerAddress, erc20Proxy.address);
            const signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: new BigNumber(makerZRXAllowance),
                makerFee: new BigNumber(1),
                makerAssetData: encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerTokenAddress is ZRX, takerTokenAmount + takerFee > taker balance', async () => {
            const takerZRXBalance = new BigNumber(balances[takerAddress][zrx.address]);
            const signedOrder = orderFactory.newSignedOrder({
                takerTokenAmount: takerZRXBalance,
                takerFee: new BigNumber(1),
                takerAssetData: encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerTokenAddress is ZRX, takerTokenAmount + takerFee > taker allowance', async () => {
            const takerZRXAllowance = await zrx.allowance.callAsync(takerAddress, erc20Proxy.address);
            const signedOrder = orderFactory.newSignedOrder({
                takerTokenAmount: new BigNumber(takerZRXAllowance),
                takerFee: new BigNumber(1),
                takerAssetData: encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should successfully exchange ERC721 tokens', async () => {
            // Construct Exchange parameters
            const makerTokenId = erc721MakerTokenId;
            const takerTokenId = erc721TakerTokenId;
            const signedOrder = orderFactory.newSignedOrder({
                makerTokenAmount: new BigNumber(1),
                takerTokenAmount: new BigNumber(1),
                makerAssetData: encodeERC721ProxyData(erc721Token.address, makerTokenId),
                takerAssetData: encodeERC721ProxyData(erc721Token.address, takerTokenId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerTokenId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerTokenId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerTokenFillAmount = signedOrder.takerTokenAmount;
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, { takerTokenFillAmount });
            // Verify post-conditions
            const newOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerTokenId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
            const newOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerTokenId);
            expect(newOwnerTakerToken).to.be.bignumber.equal(makerAddress);
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
                const takerTokenFillAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    const makerTokenFilledAmount = takerTokenFillAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerTokenFilledAmount,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerTokenFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerTokenFilledAmount,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerTokenFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersAsync(signedOrders, takerAddress, {
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
                _.forEach(signedOrders, signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    const makerTokenFilledAmount = takerTokenFillAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerTokenFilledAmount,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerTokenFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerTokenFilledAmount,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerTokenFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                    takerTokenFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw if a single signedOrder does not fill the expected amount', async () => {
                const takerTokenFillAmounts: BigNumber[] = [];
                _.forEach(signedOrders, signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                });

                await exWrapper.fillOrKillOrderAsync(signedOrders[0], takerAddress);

                return expect(
                    exWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                        takerTokenFillAmounts,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchFillOrdersNoThrow', async () => {
            it('should transfer the correct amounts', async () => {
                const takerTokenFillAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    const makerTokenFilledAmount = takerTokenFillAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerTokenFilledAmount,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerTokenFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerTokenFilledAmount,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerTokenFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerTokenFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should not throw if an order is invalid and fill the remaining orders', async () => {
                const takerTokenFillAmounts: BigNumber[] = [];
                const makerTokenAddress = rep.address;
                const takerTokenAddress = dgd.address;

                const invalidOrder = {
                    ...signedOrders[0],
                    signature: '0x00',
                };
                const validOrders = signedOrders.slice(1);

                takerTokenFillAmounts.push(invalidOrder.takerTokenAmount.div(2));
                _.forEach(validOrders, signedOrder => {
                    const takerTokenFillAmount = signedOrder.takerTokenAmount.div(2);
                    const makerTokenFilledAmount = takerTokenFillAmount
                        .times(signedOrder.makerTokenAmount)
                        .dividedToIntegerBy(signedOrder.takerTokenAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerTokenFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerTokenAmount);
                    takerTokenFillAmounts.push(takerTokenFillAmount);
                    balances[makerAddress][makerTokenAddress] = balances[makerAddress][makerTokenAddress].minus(
                        makerTokenFilledAmount,
                    );
                    balances[makerAddress][takerTokenAddress] = balances[makerAddress][takerTokenAddress].add(
                        takerTokenFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerTokenAddress] = balances[takerAddress][makerTokenAddress].add(
                        makerTokenFilledAmount,
                    );
                    balances[takerAddress][takerTokenAddress] = balances[takerAddress][takerTokenAddress].minus(
                        takerTokenFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                const newOrders = [invalidOrder, ...validOrders];
                await exWrapper.batchFillOrdersNoThrowAsync(newOrders, takerAddress, {
                    takerTokenFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });
        });

        describe('marketSellOrders', () => {
            it('should stop when the entire takerTokenFillAmount is filled', async () => {
                const takerTokenFillAmount = signedOrders[0].takerTokenAmount.plus(
                    signedOrders[1].takerTokenAmount.div(2),
                );
                await exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerTokenFilledAmount = signedOrders[0].makerTokenAmount.add(
                    signedOrders[1].makerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerTokenAddress].minus(makerTokenFilledAmount),
                );
                expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerTokenAddress].add(takerTokenFillAmount),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerTokenAddress].minus(takerTokenFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerTokenAddress].add(makerTokenFilledAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerTokenFillAmount', async () => {
                const takerTokenFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerTokenAddress] = balances[makerAddress][
                        defaultMakerTokenAddress
                    ].minus(signedOrder.makerTokenAmount);
                    balances[makerAddress][defaultTakerTokenAddress] = balances[makerAddress][
                        defaultTakerTokenAddress
                    ].add(signedOrder.takerTokenAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerTokenAddress] = balances[takerAddress][
                        defaultMakerTokenAddress
                    ].add(signedOrder.makerTokenAmount);
                    balances[takerAddress][defaultTakerTokenAddress] = balances[takerAddress][
                        defaultTakerTokenAddress
                    ].minus(signedOrder.takerTokenAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an signedOrder does not use the same takerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ takerAssetData: encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                        takerTokenFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            it('should stop when the entire takerTokenFillAmount is filled', async () => {
                const takerTokenFillAmount = signedOrders[0].takerTokenAmount.plus(
                    signedOrders[1].takerTokenAmount.div(2),
                );
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerTokenFilledAmount = signedOrders[0].makerTokenAmount.add(
                    signedOrders[1].makerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerTokenAddress].minus(makerTokenFilledAmount),
                );
                expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerTokenAddress].add(takerTokenFillAmount),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerTokenAddress].minus(takerTokenFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerTokenAddress].add(makerTokenFilledAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerTokenFillAmount', async () => {
                const takerTokenFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerTokenAddress] = balances[makerAddress][
                        defaultMakerTokenAddress
                    ].minus(signedOrder.makerTokenAmount);
                    balances[makerAddress][defaultTakerTokenAddress] = balances[makerAddress][
                        defaultTakerTokenAddress
                    ].add(signedOrder.takerTokenAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerTokenAddress] = balances[takerAddress][
                        defaultMakerTokenAddress
                    ].add(signedOrder.makerTokenAmount);
                    balances[takerAddress][defaultTakerTokenAddress] = balances[takerAddress][
                        defaultTakerTokenAddress
                    ].minus(signedOrder.takerTokenAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when a signedOrder does not use the same takerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ takerAssetData: encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                        takerTokenFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketBuyOrders', () => {
            it('should stop when the entire makerTokenFillAmount is filled', async () => {
                const makerTokenFillAmount = signedOrders[0].makerTokenAmount.plus(
                    signedOrders[1].makerTokenAmount.div(2),
                );
                await exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    makerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountBought = signedOrders[0].takerTokenAmount.add(
                    signedOrders[1].takerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerTokenAddress].minus(makerTokenFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerTokenAddress].add(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerTokenAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerTokenAddress].add(makerTokenFillAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire makerTokenFillAmount', async () => {
                const makerTokenFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerTokenAddress] = balances[makerAddress][
                        defaultMakerTokenAddress
                    ].minus(signedOrder.makerTokenAmount);
                    balances[makerAddress][defaultTakerTokenAddress] = balances[makerAddress][
                        defaultTakerTokenAddress
                    ].add(signedOrder.takerTokenAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerTokenAddress] = balances[takerAddress][
                        defaultMakerTokenAddress
                    ].add(signedOrder.makerTokenAmount);
                    balances[takerAddress][defaultTakerTokenAddress] = balances[takerAddress][
                        defaultTakerTokenAddress
                    ].minus(signedOrder.takerTokenAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    makerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an signedOrder does not use the same makerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ makerAssetData: encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                        makerTokenFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            it('should stop when the entire makerTokenFillAmount is filled', async () => {
                const makerTokenFillAmount = signedOrders[0].makerTokenAmount.plus(
                    signedOrders[1].makerTokenAmount.div(2),
                );
                await exWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountBought = signedOrders[0].takerTokenAmount.add(
                    signedOrders[1].takerTokenAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerTokenAddress].minus(makerTokenFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerTokenAddress].add(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerTokenAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerTokenAddress].add(makerTokenFillAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerTokenFillAmount', async () => {
                const takerTokenFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerTokenAddress] = balances[makerAddress][
                        defaultMakerTokenAddress
                    ].minus(signedOrder.makerTokenAmount);
                    balances[makerAddress][defaultTakerTokenAddress] = balances[makerAddress][
                        defaultTakerTokenAddress
                    ].add(signedOrder.takerTokenAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerTokenAddress] = balances[takerAddress][
                        defaultMakerTokenAddress
                    ].add(signedOrder.makerTokenAmount);
                    balances[takerAddress][defaultTakerTokenAddress] = balances[takerAddress][
                        defaultTakerTokenAddress
                    ].minus(signedOrder.takerTokenAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerTokenFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when a signedOrder does not use the same makerTokenAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ makerAssetData: encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                        makerTokenFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const takerTokenCancelAmounts = _.map(signedOrders, signedOrder => signedOrder.takerTokenAmount);
                await exWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);

                await exWrapper.batchFillOrdersAsync(signedOrders, takerAddress, {
                    takerTokenFillAmounts: takerTokenCancelAmounts,
                });
                const newBalances = await dmyBalances.getAsync();
                expect(balances).to.be.deep.equal(newBalances);
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
