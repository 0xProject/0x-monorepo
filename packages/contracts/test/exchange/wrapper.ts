import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { TokenRegistryContract } from '../../src/contract_wrappers/generated/token_registry';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
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

    let rep: DummyERC20TokenContract;
    let dgd: DummyERC20TokenContract;
    let zrx: DummyERC20TokenContract;
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

    const erc721MakerAssetId = new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010');
    const erc721TakerAssetId = new BigNumber('0x3030303030303030303030303030303030303030303030303030303030303030');

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        tokenOwner = accounts[0];
        [makerAddress, takerAddress, feeRecipientAddress] = accounts;
        const owner = tokenOwner;
        const [repInstance, dgdInstance, zrxInstance, erc721TokenInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721TOKEN_ARGS),
        ]);
        rep = new DummyERC20TokenContract(repInstance.abi, repInstance.address, provider);
        dgd = new DummyERC20TokenContract(dgdInstance.abi, dgdInstance.address, provider);
        zrx = new DummyERC20TokenContract(zrxInstance.abi, zrxInstance.address, provider);
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
            assetProxyUtils.encodeERC20ProxyData(zrx.address),
        ]);
        exchange = new ExchangeContract(exchangeInstance.abi, exchangeInstance.address, provider);
        await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });

        const zeroEx = new ZeroEx(provider, { networkId: constants.TESTRPC_NETWORK_ID });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        defaultMakerAssetAddress = rep.address;
        defaultTakerAssetAddress = dgd.address;
        const defaultOrderParams = {
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultMakerAssetAddress),
            takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultTakerAssetAddress),
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
            erc721Token.mint.sendTransactionAsync(makerAddress, erc721MakerAssetId, { from: tokenOwner }),
            erc721Token.mint.sendTransactionAsync(takerAddress, erc721TakerAssetId, { from: tokenOwner }),
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
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exWrapper.fillOrKillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFee = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFee = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
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

        it('should throw if entire takerAssetFillAmount not filled', async () => {
            const signedOrder = orderFactory.newSignedOrder();

            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(2),
            });

            return expect(exWrapper.fillOrKillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });
    });

    describe('fillOrderNoThrow', () => {
        it('should transfer the correct amounts', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });

            const newBalances = await dmyBalances.getAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFee = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFee = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
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
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if taker balances are too low to fill order', async () => {
            const signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
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

        it('should not change balances if makerAssetAddress is ZRX, makerAssetAmount + makerFee > maker balance', async () => {
            const makerZRXBalance = new BigNumber(balances[makerAddress][zrx.address]);
            const signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: makerZRXBalance,
                makerFee: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if makerAssetAddress is ZRX, makerAssetAmount + makerFee > maker allowance', async () => {
            const makerZRXAllowance = await zrx.allowance.callAsync(makerAddress, erc20Proxy.address);
            const signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(makerZRXAllowance),
                makerFee: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerAssetAddress is ZRX, takerAssetAmount + takerFee > taker balance', async () => {
            const takerZRXBalance = new BigNumber(balances[takerAddress][zrx.address]);
            const signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: takerZRXBalance,
                takerFee: new BigNumber(1),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should not change balances if takerAssetAddress is ZRX, takerAssetAmount + takerFee > taker allowance', async () => {
            const takerZRXAllowance = await zrx.allowance.callAsync(takerAddress, erc20Proxy.address);
            const signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(takerZRXAllowance),
                takerFee: new BigNumber(1),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address),
            });
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should successfully exchange ERC721 tokens', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetId;
            const takerAssetId = erc721TakerAssetId;
            const signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            await exWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            // Verify post-conditions
            const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerMakerAsset).to.be.bignumber.equal(takerAddress);
            const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(newOwnerTakerAsset).to.be.bignumber.equal(makerAddress);
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
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = rep.address;
                const takerAssetAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    balances[makerAddress][makerAssetAddress] = balances[makerAddress][makerAssetAddress].minus(
                        makerAssetFilledAmount,
                    );
                    balances[makerAddress][takerAssetAddress] = balances[makerAddress][takerAssetAddress].add(
                        takerAssetFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerAssetAddress] = balances[takerAddress][makerAssetAddress].add(
                        makerAssetFilledAmount,
                    );
                    balances[takerAddress][takerAssetAddress] = balances[takerAddress][takerAssetAddress].minus(
                        takerAssetFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });
        });

        describe('batchFillOrKillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = rep.address;
                const takerAssetAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    balances[makerAddress][makerAssetAddress] = balances[makerAddress][makerAssetAddress].minus(
                        makerAssetFilledAmount,
                    );
                    balances[makerAddress][takerAssetAddress] = balances[makerAddress][takerAssetAddress].add(
                        takerAssetFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerAssetAddress] = balances[takerAddress][makerAssetAddress].add(
                        makerAssetFilledAmount,
                    );
                    balances[takerAddress][takerAssetAddress] = balances[takerAddress][takerAssetAddress].minus(
                        takerAssetFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw if a single signedOrder does not fill the expected amount', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                });

                await exWrapper.fillOrKillOrderAsync(signedOrders[0], takerAddress);

                return expect(
                    exWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                        takerAssetFillAmounts,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchFillOrdersNoThrow', async () => {
            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = rep.address;
                const takerAssetAddress = dgd.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    balances[makerAddress][makerAssetAddress] = balances[makerAddress][makerAssetAddress].minus(
                        makerAssetFilledAmount,
                    );
                    balances[makerAddress][takerAssetAddress] = balances[makerAddress][takerAssetAddress].add(
                        takerAssetFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerAssetAddress] = balances[takerAddress][makerAssetAddress].add(
                        makerAssetFilledAmount,
                    );
                    balances[takerAddress][takerAssetAddress] = balances[takerAddress][takerAssetAddress].minus(
                        takerAssetFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                await exWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should not throw if an order is invalid and fill the remaining orders', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = rep.address;
                const takerAssetAddress = dgd.address;

                const invalidOrder = {
                    ...signedOrders[0],
                    signature: '0x00',
                };
                const validOrders = signedOrders.slice(1);

                takerAssetFillAmounts.push(invalidOrder.takerAssetAmount.div(2));
                _.forEach(validOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    balances[makerAddress][makerAssetAddress] = balances[makerAddress][makerAssetAddress].minus(
                        makerAssetFilledAmount,
                    );
                    balances[makerAddress][takerAssetAddress] = balances[makerAddress][takerAssetAddress].add(
                        takerAssetFillAmount,
                    );
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(makerFee);
                    balances[takerAddress][makerAssetAddress] = balances[takerAddress][makerAssetAddress].add(
                        makerAssetFilledAmount,
                    );
                    balances[takerAddress][takerAssetAddress] = balances[takerAddress][takerAssetAddress].minus(
                        takerAssetFillAmount,
                    );
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(takerFee);
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        makerFee.add(takerFee),
                    );
                });

                const newOrders = [invalidOrder, ...validOrders];
                await exWrapper.batchFillOrdersNoThrowAsync(newOrders, takerAddress, {
                    takerAssetFillAmounts,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });
        });

        describe('marketSellOrders', () => {
            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );
                await exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAssetFilledAmount = signedOrders[0].makerAssetAmount.add(
                    signedOrders[1].makerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerAssetAddress] = balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    balances[makerAddress][defaultTakerAssetAddress] = balances[makerAddress][
                        defaultTakerAssetAddress
                    ].add(signedOrder.takerAssetAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerAssetAddress] = balances[takerAddress][
                        defaultMakerAssetAddress
                    ].add(signedOrder.makerAssetAmount);
                    balances[takerAddress][defaultTakerAssetAddress] = balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an signedOrder does not use the same takerAssetAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ takerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                        takerAssetFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAssetFilledAmount = signedOrders[0].makerAssetAmount.add(
                    signedOrders[1].makerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerAssetAddress] = balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    balances[makerAddress][defaultTakerAssetAddress] = balances[makerAddress][
                        defaultTakerAssetAddress
                    ].add(signedOrder.takerAssetAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerAssetAddress] = balances[takerAddress][
                        defaultMakerAssetAddress
                    ].add(signedOrder.makerAssetAmount);
                    balances[takerAddress][defaultTakerAssetAddress] = balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when a signedOrder does not use the same takerAssetAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ takerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                        takerAssetFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketBuyOrders', () => {
            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );
                await exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountBought = signedOrders[0].takerAssetAmount.add(
                    signedOrders[1].takerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerAssetAddress].add(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerAssetAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount', async () => {
                const makerAssetFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerAssetAddress] = balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    balances[makerAddress][defaultTakerAssetAddress] = balances[makerAddress][
                        defaultTakerAssetAddress
                    ].add(signedOrder.takerAssetAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerAssetAddress] = balances[takerAddress][
                        defaultMakerAssetAddress
                    ].add(signedOrder.makerAssetAmount);
                    balances[takerAddress][defaultTakerAssetAddress] = balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when an signedOrder does not use the same makerAssetAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ makerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                        makerAssetFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );
                await exWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();

                const makerAmountBought = signedOrders[0].takerAssetAmount.add(
                    signedOrders[1].takerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.add(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.add(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[makerAddress][defaultTakerAssetAddress].add(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[makerAddress][zrx.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultTakerAssetAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount),
                );
                expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                    balances[takerAddress][zrx.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                    balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    balances[makerAddress][defaultMakerAssetAddress] = balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    balances[makerAddress][defaultTakerAssetAddress] = balances[makerAddress][
                        defaultTakerAssetAddress
                    ].add(signedOrder.takerAssetAmount);
                    balances[makerAddress][zrx.address] = balances[makerAddress][zrx.address].minus(
                        signedOrder.makerFee,
                    );
                    balances[takerAddress][defaultMakerAssetAddress] = balances[takerAddress][
                        defaultMakerAssetAddress
                    ].add(signedOrder.makerAssetAmount);
                    balances[takerAddress][defaultTakerAssetAddress] = balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    balances[takerAddress][zrx.address] = balances[takerAddress][zrx.address].minus(
                        signedOrder.takerFee,
                    );
                    balances[feeRecipientAddress][zrx.address] = balances[feeRecipientAddress][zrx.address].add(
                        signedOrder.makerFee.add(signedOrder.takerFee),
                    );
                });
                await exWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });

                const newBalances = await dmyBalances.getAsync();
                expect(newBalances).to.be.deep.equal(balances);
            });

            it('should throw when a signedOrder does not use the same makerAssetAddress', async () => {
                signedOrders = [
                    orderFactory.newSignedOrder(),
                    orderFactory.newSignedOrder({ makerAssetData: assetProxyUtils.encodeERC20ProxyData(zrx.address) }),
                    orderFactory.newSignedOrder(),
                ];

                return expect(
                    exWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                        makerAssetFillAmount: ZeroEx.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const takerAssetCancelAmounts = _.map(signedOrders, signedOrder => signedOrder.takerAssetAmount);
                await exWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);

                await exWrapper.batchFillOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts: takerAssetCancelAmounts,
                });
                const newBalances = await dmyBalances.getAsync();
                expect(balances).to.be.deep.equal(newBalances);
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
