import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { DummyERC721TokenContract } from '../../generated-wrappers/dummy_erc721_token';
import { ERC20ProxyContract } from '../../generated-wrappers/erc20_proxy';
import { ERC721ProxyContract } from '../../generated-wrappers/erc721_proxy';
import { ExchangeContract } from '../../generated-wrappers/exchange';
import { OrderValidatorContract } from '../../generated-wrappers/order_validator';
import { artifacts } from '../../src/artifacts';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { OrderStatus } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderValidator', () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let erc20AssetData: string;
    let erc721AssetData: string;

    let erc20Token: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let orderValidator: OrderValidatorContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let signedOrder: SignedOrder;
    let signedOrder2: SignedOrder;
    let orderFactory: OrderFactory;

    const tokenId = new BigNumber(123456789);
    const tokenId2 = new BigNumber(987654321);
    const ERC721_BALANCE = new BigNumber(1);
    const ERC721_ALLOWANCE = new BigNumber(1);

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress] = _.slice(accounts, 0, 3));

        const erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        const erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 2;
        [erc20Token, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();

        const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrxAssetData,
        );
        const exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);

        orderValidator = await OrderValidatorContract.deployFrom0xArtifactAsync(
            artifacts.OrderValidator,
            provider,
            txDefaults,
            exchange.address,
            zrxAssetData,
        );

        erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
        erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, tokenId);
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: erc20AssetData,
            takerAssetData: erc721AssetData,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('getBalanceAndAllowance', () => {
        describe('getERC721TokenOwner', async () => {
            it('should return the null address when tokenId is not owned', async () => {
                const tokenOwner = await orderValidator.getERC721TokenOwner.callAsync(makerAddress, tokenId);
                expect(tokenOwner).to.be.equal(constants.NULL_ADDRESS);
            });
            it('should return the owner address when tokenId is owned', async () => {
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Token.mint.sendTransactionAsync(makerAddress, tokenId),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const tokenOwner = await orderValidator.getERC721TokenOwner.callAsync(erc721Token.address, tokenId);
                expect(tokenOwner).to.be.equal(makerAddress);
            });
        });
        describe('ERC20 assetData', () => {
            it('should return the correct balances and allowances when both values are 0', async () => {
                const [newBalance, newAllowance] = await orderValidator.getBalanceAndAllowance.callAsync(
                    makerAddress,
                    erc20AssetData,
                );
                expect(constants.ZERO_AMOUNT).to.be.bignumber.equal(newBalance);
                expect(constants.ZERO_AMOUNT).to.be.bignumber.equal(newAllowance);
            });
            it('should return the correct balance and allowance when both values are non-zero', async () => {
                const balance = new BigNumber(123);
                const allowance = new BigNumber(456);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc20Token.setBalance.sendTransactionAsync(makerAddress, balance),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc20Token.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const [newBalance, newAllowance] = await orderValidator.getBalanceAndAllowance.callAsync(
                    makerAddress,
                    erc20AssetData,
                );
                expect(balance).to.be.bignumber.equal(newBalance);
                expect(allowance).to.be.bignumber.equal(newAllowance);
            });
        });
        describe('ERC721 assetData', () => {
            it('should return a balance of 0 when the tokenId is not owned by target', async () => {
                const [newBalance] = await orderValidator.getBalanceAndAllowance.callAsync(
                    makerAddress,
                    erc721AssetData,
                );
                expect(newBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('should return an allowance of 0 when no approval is set', async () => {
                const [, newAllowance] = await orderValidator.getBalanceAndAllowance.callAsync(
                    makerAddress,
                    erc721AssetData,
                );
                expect(newAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('should return a balance of 1 when the tokenId is owned by target', async () => {
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Token.mint.sendTransactionAsync(makerAddress, tokenId),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const [newBalance] = await orderValidator.getBalanceAndAllowance.callAsync(
                    makerAddress,
                    erc721AssetData,
                );
                expect(newBalance).to.be.bignumber.equal(ERC721_BALANCE);
            });
            it('should return an allowance of 1 when ERC721Proxy is approved for all', async () => {
                const isApproved = true;
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, isApproved, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const [, newAllowance] = await orderValidator.getBalanceAndAllowance.callAsync(
                    makerAddress,
                    erc721AssetData,
                );
                expect(newAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            });
            it('should return an allowance of 1 when ERC721Proxy is approved for specific tokenId', async () => {
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Token.mint.sendTransactionAsync(makerAddress, tokenId),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Token.approve.sendTransactionAsync(erc721Proxy.address, tokenId, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const [, newAllowance] = await orderValidator.getBalanceAndAllowance.callAsync(
                    makerAddress,
                    erc721AssetData,
                );
                expect(newAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            });
        });
    });
    describe('getBalancesAndAllowances', () => {
        it('should return the correct balances and allowances when all values are 0', async () => {
            const [
                [erc20Balance, erc721Balance],
                [erc20Allowance, erc721Allowance],
            ] = await orderValidator.getBalancesAndAllowances.callAsync(makerAddress, [
                erc20AssetData,
                erc721AssetData,
            ]);
            expect(erc20Balance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(erc721Balance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(erc20Allowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(erc721Allowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return the correct balances and allowances when balances and allowances are non-zero', async () => {
            const balance = new BigNumber(123);
            const allowance = new BigNumber(456);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.setBalance.sendTransactionAsync(makerAddress, balance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.mint.sendTransactionAsync(makerAddress, tokenId),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.approve.sendTransactionAsync(erc721Proxy.address, tokenId, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const [
                [erc20Balance, erc721Balance],
                [erc20Allowance, erc721Allowance],
            ] = await orderValidator.getBalancesAndAllowances.callAsync(makerAddress, [
                erc20AssetData,
                erc721AssetData,
            ]);
            expect(erc20Balance).to.be.bignumber.equal(balance);
            expect(erc721Balance).to.be.bignumber.equal(ERC721_BALANCE);
            expect(erc20Allowance).to.be.bignumber.equal(allowance);
            expect(erc721Allowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
        });
    });
    describe('getTraderInfo', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should return the correct info when no balances or allowances are set', async () => {
            const traderInfo = await orderValidator.getTraderInfo.callAsync(signedOrder, takerAddress);
            expect(traderInfo.makerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return the correct info when balances and allowances are set', async () => {
            const makerBalance = new BigNumber(123);
            const makerAllowance = new BigNumber(456);
            const makerZrxBalance = new BigNumber(789);
            const takerZrxAllowance = new BigNumber(987);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.setBalance.sendTransactionAsync(makerAddress, makerBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.approve.sendTransactionAsync(erc20Proxy.address, makerAllowance, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.setBalance.sendTransactionAsync(makerAddress, makerZrxBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve.sendTransactionAsync(erc20Proxy.address, takerZrxAllowance, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.mint.sendTransactionAsync(takerAddress, tokenId),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.approve.sendTransactionAsync(erc721Proxy.address, tokenId, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const traderInfo = await orderValidator.getTraderInfo.callAsync(signedOrder, takerAddress);
            expect(traderInfo.makerBalance).to.be.bignumber.equal(makerBalance);
            expect(traderInfo.makerAllowance).to.be.bignumber.equal(makerAllowance);
            expect(traderInfo.takerBalance).to.be.bignumber.equal(ERC721_BALANCE);
            expect(traderInfo.takerAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            expect(traderInfo.makerZrxBalance).to.be.bignumber.equal(makerZrxBalance);
            expect(traderInfo.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxAllowance).to.be.bignumber.equal(takerZrxAllowance);
        });
    });
    describe('getTradersInfo', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
            signedOrder2 = await orderFactory.newSignedOrderAsync({
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, tokenId2),
            });
        });
        it('should return the correct info when no balances or allowances have been set', async () => {
            const orders = [signedOrder, signedOrder2];
            const takers = [takerAddress, takerAddress];
            const [traderInfo1, traderInfo2] = await orderValidator.getTradersInfo.callAsync(orders, takers);
            expect(traderInfo1.makerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return the correct info when balances and allowances are set', async () => {
            const makerBalance = new BigNumber(123);
            const makerAllowance = new BigNumber(456);
            const makerZrxBalance = new BigNumber(789);
            const takerZrxAllowance = new BigNumber(987);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.setBalance.sendTransactionAsync(makerAddress, makerBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.approve.sendTransactionAsync(erc20Proxy.address, makerAllowance, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.setBalance.sendTransactionAsync(makerAddress, makerZrxBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve.sendTransactionAsync(erc20Proxy.address, takerZrxAllowance, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isApproved = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, isApproved, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.mint.sendTransactionAsync(takerAddress, tokenId2),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const orders = [signedOrder, signedOrder2];
            const takers = [takerAddress, takerAddress];
            const [traderInfo1, traderInfo2] = await orderValidator.getTradersInfo.callAsync(orders, takers);

            expect(traderInfo1.makerBalance).to.be.bignumber.equal(makerBalance);
            expect(traderInfo1.makerAllowance).to.be.bignumber.equal(makerAllowance);
            expect(traderInfo1.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            expect(traderInfo1.makerZrxBalance).to.be.bignumber.equal(makerZrxBalance);
            expect(traderInfo1.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxAllowance).to.be.bignumber.equal(takerZrxAllowance);
            expect(traderInfo2.makerBalance).to.be.bignumber.equal(makerBalance);
            expect(traderInfo2.makerAllowance).to.be.bignumber.equal(makerAllowance);
            expect(traderInfo2.takerBalance).to.be.bignumber.equal(ERC721_BALANCE);
            expect(traderInfo2.takerAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            expect(traderInfo2.makerZrxBalance).to.be.bignumber.equal(makerZrxBalance);
            expect(traderInfo2.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxAllowance).to.be.bignumber.equal(takerZrxAllowance);
        });
    });
    describe('getOrderAndTraderInfo', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should return the correct info when no balances or allowances are set', async () => {
            const [orderInfo, traderInfo] = await orderValidator.getOrderAndTraderInfo.callAsync(
                signedOrder,
                takerAddress,
            );
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return the correct info when balances and allowances are set', async () => {
            const makerBalance = new BigNumber(123);
            const makerAllowance = new BigNumber(456);
            const makerZrxBalance = new BigNumber(789);
            const takerZrxAllowance = new BigNumber(987);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.setBalance.sendTransactionAsync(makerAddress, makerBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.approve.sendTransactionAsync(erc20Proxy.address, makerAllowance, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.setBalance.sendTransactionAsync(makerAddress, makerZrxBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve.sendTransactionAsync(erc20Proxy.address, takerZrxAllowance, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.mint.sendTransactionAsync(takerAddress, tokenId),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.approve.sendTransactionAsync(erc721Proxy.address, tokenId, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const [orderInfo, traderInfo] = await orderValidator.getOrderAndTraderInfo.callAsync(
                signedOrder,
                takerAddress,
            );
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expect(orderInfo.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.makerBalance).to.be.bignumber.equal(makerBalance);
            expect(traderInfo.makerAllowance).to.be.bignumber.equal(makerAllowance);
            expect(traderInfo.takerBalance).to.be.bignumber.equal(ERC721_BALANCE);
            expect(traderInfo.takerAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            expect(traderInfo.makerZrxBalance).to.be.bignumber.equal(makerZrxBalance);
            expect(traderInfo.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo.takerZrxAllowance).to.be.bignumber.equal(takerZrxAllowance);
        });
    });
    describe('getOrdersAndTradersInfo', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
            signedOrder2 = await orderFactory.newSignedOrderAsync({
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, tokenId2),
            });
        });
        it('should return the correct info when no balances or allowances have been set', async () => {
            const orders = [signedOrder, signedOrder2];
            const takers = [takerAddress, takerAddress];
            const [
                [orderInfo1, orderInfo2],
                [traderInfo1, traderInfo2],
            ] = await orderValidator.getOrdersAndTradersInfo.callAsync(orders, takers);
            const expectedOrderHash1 = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedOrderHash2 = orderHashUtils.getOrderHashHex(signedOrder2);
            expect(orderInfo1.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(orderInfo1.orderHash).to.be.equal(expectedOrderHash1);
            expect(orderInfo1.orderTakerAssetFilledAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(orderInfo2.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(orderInfo2.orderHash).to.be.equal(expectedOrderHash2);
            expect(orderInfo2.orderTakerAssetFilledAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return the correct info when balances and allowances are set', async () => {
            const makerBalance = new BigNumber(123);
            const makerAllowance = new BigNumber(456);
            const makerZrxBalance = new BigNumber(789);
            const takerZrxAllowance = new BigNumber(987);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.setBalance.sendTransactionAsync(makerAddress, makerBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20Token.approve.sendTransactionAsync(erc20Proxy.address, makerAllowance, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.setBalance.sendTransactionAsync(makerAddress, makerZrxBalance),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve.sendTransactionAsync(erc20Proxy.address, takerZrxAllowance, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isApproved = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, isApproved, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.mint.sendTransactionAsync(takerAddress, tokenId2),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const orders = [signedOrder, signedOrder2];
            const takers = [takerAddress, takerAddress];
            const [
                [orderInfo1, orderInfo2],
                [traderInfo1, traderInfo2],
            ] = await orderValidator.getOrdersAndTradersInfo.callAsync(orders, takers);
            const expectedOrderHash1 = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedOrderHash2 = orderHashUtils.getOrderHashHex(signedOrder2);
            expect(orderInfo1.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(orderInfo1.orderHash).to.be.equal(expectedOrderHash1);
            expect(orderInfo1.orderTakerAssetFilledAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(orderInfo2.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(orderInfo2.orderHash).to.be.equal(expectedOrderHash2);
            expect(orderInfo2.orderTakerAssetFilledAmount).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.makerBalance).to.be.bignumber.equal(makerBalance);
            expect(traderInfo1.makerAllowance).to.be.bignumber.equal(makerAllowance);
            expect(traderInfo1.takerBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            expect(traderInfo1.makerZrxBalance).to.be.bignumber.equal(makerZrxBalance);
            expect(traderInfo1.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo1.takerZrxAllowance).to.be.bignumber.equal(takerZrxAllowance);
            expect(traderInfo2.makerBalance).to.be.bignumber.equal(makerBalance);
            expect(traderInfo2.makerAllowance).to.be.bignumber.equal(makerAllowance);
            expect(traderInfo2.takerBalance).to.be.bignumber.equal(ERC721_BALANCE);
            expect(traderInfo2.takerAllowance).to.be.bignumber.equal(ERC721_ALLOWANCE);
            expect(traderInfo2.makerZrxBalance).to.be.bignumber.equal(makerZrxBalance);
            expect(traderInfo2.makerZrxAllowance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(traderInfo2.takerZrxAllowance).to.be.bignumber.equal(takerZrxAllowance);
        });
    });
});
// tslint:disable:max-file-line-count
