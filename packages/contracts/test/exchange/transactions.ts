import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import * as Web3 from 'web3';

import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { WhitelistContract } from '../../src/contract_wrappers/generated/whitelist';
import { artifacts } from '../../src/utils/artifacts';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import { TransactionFactory } from '../../src/utils/transaction_factory';
import {
    AssetProxyId,
    ERC20BalancesByOwner,
    ExchangeStatus,
    SignatureType,
    SignedTransaction,
} from '../../src/utils/types';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange transactions', () => {
    let senderAddress: string;
    let owner: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;

    let erc20Balances: ERC20BalancesByOwner;
    let signedOrder: SignedOrder;
    let signedTx: SignedTransaction;
    let order: Order;
    let orderFactory: OrderFactory;
    let makerTransactionFactory: TransactionFactory;
    let takerTransactionFactory: TransactionFactory;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;

    let defaultMakerTokenAddress: string;
    let defaultTakerTokenAddress: string;
    let makerPrivateKey: Buffer;
    let takerPrivateKey: Buffer;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, senderAddress, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync();
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetProxyUtils.encodeERC20ProxyData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC20, erc20Proxy.address, owner);

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        defaultMakerTokenAddress = erc20TokenA.address;
        defaultTakerTokenAddress = erc20TokenB.address;

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            senderAddress,
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultMakerTokenAddress),
            takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultTakerTokenAddress),
        };
        makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        makerTransactionFactory = new TransactionFactory(makerPrivateKey, exchange.address);
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchange.address);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('executeTransaction', () => {
        describe('fillOrder', () => {
            let takerAssetFillAmount: BigNumber;
            beforeEach(async () => {
                erc20Balances = await erc20Wrapper.getBalancesAsync();
                signedOrder = orderFactory.newSignedOrder();
                order = orderUtils.getOrderStruct(signedOrder);

                takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                const data = exchange.fillOrder.getABIEncodedTransactionData(
                    order,
                    takerAssetFillAmount,
                    signedOrder.signature,
                );
                signedTx = takerTransactionFactory.newSignedTransaction(data);
            });

            it('should throw if not called by specified sender', async () => {
                return expect(exchangeWrapper.executeTransactionAsync(signedTx, takerAddress)).to.be.rejectedWith(
                    constants.REVERT,
                );
            });

            it('should transfer the correct amounts when signed by taker and called by sender', async () => {
                await exchangeWrapper.executeTransactionAsync(signedTx, senderAddress);
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const makerAssetFillAmount = takerAssetFillAmount
                    .times(signedOrder.makerAssetAmount)
                    .dividedToIntegerBy(signedOrder.takerAssetAmount);
                const makerFeePaid = signedOrder.makerFee
                    .times(makerAssetFillAmount)
                    .dividedToIntegerBy(signedOrder.makerAssetAmount);
                const takerFeePaid = signedOrder.takerFee
                    .times(makerAssetFillAmount)
                    .dividedToIntegerBy(signedOrder.makerAssetAmount);
                expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultMakerTokenAddress].minus(makerAssetFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultTakerTokenAddress].add(takerAssetFillAmount),
                );
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(makerFeePaid),
                );
                expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultTakerTokenAddress].minus(takerAssetFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultMakerTokenAddress].add(makerAssetFillAmount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].minus(takerFeePaid),
                );
                expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
                );
            });

            it('should throw if the a 0x transaction with the same transactionHash has already been executed', async () => {
                await exchangeWrapper.executeTransactionAsync(signedTx, senderAddress);
                return expect(exchangeWrapper.executeTransactionAsync(signedTx, senderAddress)).to.be.rejectedWith(
                    constants.REVERT,
                );
            });

            it('should reset the currentContextAddress', async () => {
                await exchangeWrapper.executeTransactionAsync(signedTx, senderAddress);
                const currentContextAddress = await exchange.currentContextAddress.callAsync();
                expect(currentContextAddress).to.equal(constants.NULL_ADDRESS);
            });
        });

        describe('cancelOrder', () => {
            beforeEach(async () => {
                const data = exchange.cancelOrder.getABIEncodedTransactionData(order);
                signedTx = makerTransactionFactory.newSignedTransaction(data);
            });

            it('should throw if not called by specified sender', async () => {
                return expect(exchangeWrapper.executeTransactionAsync(signedTx, makerAddress)).to.be.rejectedWith(
                    constants.REVERT,
                );
            });

            it('should cancel the order when signed by maker and called by sender', async () => {
                await exchangeWrapper.executeTransactionAsync(signedTx, senderAddress);
                const res = await exchangeWrapper.fillOrderAsync(signedOrder, senderAddress);
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.deep.equal(erc20Balances);
            });
        });
    });

    describe('Whitelist', () => {
        let whitelist: WhitelistContract;
        let whitelistOrderFactory: OrderFactory;

        before(async () => {
            whitelist = await WhitelistContract.deployFrom0xArtifactAsync(
                artifacts.Whitelist,
                provider,
                txDefaults,
                exchange.address,
            );
            const isApproved = true;
            await exchange.approveSignatureValidator.sendTransactionAsync(whitelist.address, isApproved, {
                from: takerAddress,
            });
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                senderAddress: whitelist.address,
                exchangeAddress: exchange.address,
                makerAddress,
                feeRecipientAddress,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultMakerTokenAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultTakerTokenAddress),
            };
            whitelistOrderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        });

        beforeEach(async () => {
            signedOrder = whitelistOrderFactory.newSignedOrder();
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });

        it('should revert if maker has not been whitelisted', async () => {
            const isApproved = true;
            await whitelist.updateWhitelistStatus.sendTransactionAsync(takerAddress, isApproved, { from: owner });

            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const salt = ZeroEx.generatePseudoRandomSalt();
            return expect(
                whitelist.fillOrderIfWhitelisted.sendTransactionAsync(
                    orderStruct,
                    takerAssetFillAmount,
                    salt,
                    signedOrder.signature,
                    { from: takerAddress },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should revert if taker has not been whitelisted', async () => {
            const isApproved = true;
            await whitelist.updateWhitelistStatus.sendTransactionAsync(makerAddress, isApproved, { from: owner });

            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const salt = ZeroEx.generatePseudoRandomSalt();
            return expect(
                whitelist.fillOrderIfWhitelisted.sendTransactionAsync(
                    orderStruct,
                    takerAssetFillAmount,
                    salt,
                    signedOrder.signature,
                    { from: takerAddress },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should fill the order if maker and taker have been whitelisted', async () => {
            const isApproved = true;
            await whitelist.updateWhitelistStatus.sendTransactionAsync(makerAddress, isApproved, { from: owner });
            await whitelist.updateWhitelistStatus.sendTransactionAsync(takerAddress, isApproved, { from: owner });

            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const salt = ZeroEx.generatePseudoRandomSalt();
            await whitelist.fillOrderIfWhitelisted.sendTransactionAsync(
                orderStruct,
                takerAssetFillAmount,
                salt,
                signedOrder.signature,
                { from: takerAddress },
            );
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFillAmount = signedOrder.makerAssetAmount;
            const makerFeePaid = signedOrder.makerFee;
            const takerFeePaid = signedOrder.takerFee;

            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerTokenAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerTokenAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerTokenAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerTokenAddress].add(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });
    });
});
