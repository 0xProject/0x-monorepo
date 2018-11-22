import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { OrderWithoutExchangeAddress, RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { ERC20ProxyContract } from '../../generated-wrappers/erc20_proxy';
import { ExchangeContract } from '../../generated-wrappers/exchange';
import { ExchangeWrapperContract } from '../../generated-wrappers/exchange_wrapper';
import { WhitelistContract } from '../../generated-wrappers/whitelist';
import { artifacts } from '../../src/artifacts';
import { expectTransactionFailedAsync } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { orderUtils } from '../utils/order_utils';
import { TransactionFactory } from '../utils/transaction_factory';
import { ERC20BalancesByOwner, SignedTransaction } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

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
    let orderWithoutExchangeAddress: OrderWithoutExchangeAddress;
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
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, senderAddress, makerAddress, takerAddress, feeRecipientAddress] = _.slice(
            accounts,
            0,
            5,
        ));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetDataUtils.encodeERC20AssetData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);

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
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerTokenAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerTokenAddress),
        };
        makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        makerTransactionFactory = new TransactionFactory(makerPrivateKey, exchange.address);
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchange.address);
    });
    describe('executeTransaction', () => {
        describe('fillOrder', () => {
            let takerAssetFillAmount: BigNumber;
            beforeEach(async () => {
                erc20Balances = await erc20Wrapper.getBalancesAsync();
                signedOrder = await orderFactory.newSignedOrderAsync();
                orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);

                takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                const data = exchange.fillOrder.getABIEncodedTransactionData(
                    orderWithoutExchangeAddress,
                    takerAssetFillAmount,
                    signedOrder.signature,
                );
                signedTx = takerTransactionFactory.newSignedTransaction(data);
            });

            it('should throw if not called by specified sender', async () => {
                return expectTransactionFailedAsync(
                    exchangeWrapper.executeTransactionAsync(signedTx, takerAddress),
                    RevertReason.FailedExecution,
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
                return expectTransactionFailedAsync(
                    exchangeWrapper.executeTransactionAsync(signedTx, senderAddress),
                    RevertReason.InvalidTxHash,
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
                const data = exchange.cancelOrder.getABIEncodedTransactionData(orderWithoutExchangeAddress);
                signedTx = makerTransactionFactory.newSignedTransaction(data);
            });

            it('should throw if not called by specified sender', async () => {
                return expectTransactionFailedAsync(
                    exchangeWrapper.executeTransactionAsync(signedTx, makerAddress),
                    RevertReason.FailedExecution,
                );
            });

            it('should cancel the order when signed by maker and called by sender', async () => {
                await exchangeWrapper.executeTransactionAsync(signedTx, senderAddress);
                return expectTransactionFailedAsync(
                    exchangeWrapper.fillOrderAsync(signedOrder, senderAddress),
                    RevertReason.OrderUnfillable,
                );
            });
        });

        describe('cancelOrdersUpTo', () => {
            let exchangeWrapperContract: ExchangeWrapperContract;

            before(async () => {
                exchangeWrapperContract = await ExchangeWrapperContract.deployFrom0xArtifactAsync(
                    artifacts.ExchangeWrapper,
                    provider,
                    txDefaults,
                    exchange.address,
                );
            });

            it("should cancel an order if called from the order's sender", async () => {
                const orderSalt = new BigNumber(0);
                signedOrder = await orderFactory.newSignedOrderAsync({
                    senderAddress: exchangeWrapperContract.address,
                    salt: orderSalt,
                });
                const targetOrderEpoch = orderSalt.add(1);
                const cancelData = exchange.cancelOrdersUpTo.getABIEncodedTransactionData(targetOrderEpoch);
                const signedCancelTx = makerTransactionFactory.newSignedTransaction(cancelData);
                await exchangeWrapperContract.cancelOrdersUpTo.sendTransactionAsync(
                    targetOrderEpoch,
                    signedCancelTx.salt,
                    signedCancelTx.signature,
                    {
                        from: makerAddress,
                    },
                );

                const takerAssetFillAmount = signedOrder.takerAssetAmount;
                orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
                const fillData = exchange.fillOrder.getABIEncodedTransactionData(
                    orderWithoutExchangeAddress,
                    takerAssetFillAmount,
                    signedOrder.signature,
                );
                const signedFillTx = takerTransactionFactory.newSignedTransaction(fillData);
                return expectTransactionFailedAsync(
                    exchangeWrapperContract.fillOrder.sendTransactionAsync(
                        orderWithoutExchangeAddress,
                        takerAssetFillAmount,
                        signedFillTx.salt,
                        signedOrder.signature,
                        signedFillTx.signature,
                        { from: takerAddress },
                    ),
                    RevertReason.FailedExecution,
                );
            });

            it("should not cancel an order if not called from the order's sender", async () => {
                const orderSalt = new BigNumber(0);
                signedOrder = await orderFactory.newSignedOrderAsync({
                    senderAddress: exchangeWrapperContract.address,
                    salt: orderSalt,
                });
                const targetOrderEpoch = orderSalt.add(1);
                await exchangeWrapper.cancelOrdersUpToAsync(targetOrderEpoch, makerAddress);

                erc20Balances = await erc20Wrapper.getBalancesAsync();
                const takerAssetFillAmount = signedOrder.takerAssetAmount;
                orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
                const data = exchange.fillOrder.getABIEncodedTransactionData(
                    orderWithoutExchangeAddress,
                    takerAssetFillAmount,
                    signedOrder.signature,
                );
                signedTx = takerTransactionFactory.newSignedTransaction(data);
                await exchangeWrapperContract.fillOrder.sendTransactionAsync(
                    orderWithoutExchangeAddress,
                    takerAssetFillAmount,
                    signedTx.salt,
                    signedOrder.signature,
                    signedTx.signature,
                    { from: takerAddress },
                );

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
            await web3Wrapper.awaitTransactionSuccessAsync(
                await exchange.setSignatureValidatorApproval.sendTransactionAsync(whitelist.address, isApproved, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                senderAddress: whitelist.address,
                exchangeAddress: exchange.address,
                makerAddress,
                feeRecipientAddress,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerTokenAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerTokenAddress),
            };
            whitelistOrderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        });

        beforeEach(async () => {
            signedOrder = await whitelistOrderFactory.newSignedOrderAsync();
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });

        it('should revert if maker has not been whitelisted', async () => {
            const isApproved = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await whitelist.updateWhitelistStatus.sendTransactionAsync(takerAddress, isApproved, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const salt = generatePseudoRandomSalt();
            return expectTransactionFailedAsync(
                whitelist.fillOrderIfWhitelisted.sendTransactionAsync(
                    orderWithoutExchangeAddress,
                    takerAssetFillAmount,
                    salt,
                    signedOrder.signature,
                    { from: takerAddress },
                ),
                RevertReason.MakerNotWhitelisted,
            );
        });

        it('should revert if taker has not been whitelisted', async () => {
            const isApproved = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await whitelist.updateWhitelistStatus.sendTransactionAsync(makerAddress, isApproved, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const salt = generatePseudoRandomSalt();
            return expectTransactionFailedAsync(
                whitelist.fillOrderIfWhitelisted.sendTransactionAsync(
                    orderWithoutExchangeAddress,
                    takerAssetFillAmount,
                    salt,
                    signedOrder.signature,
                    { from: takerAddress },
                ),
                RevertReason.TakerNotWhitelisted,
            );
        });

        it('should fill the order if maker and taker have been whitelisted', async () => {
            const isApproved = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await whitelist.updateWhitelistStatus.sendTransactionAsync(makerAddress, isApproved, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            await web3Wrapper.awaitTransactionSuccessAsync(
                await whitelist.updateWhitelistStatus.sendTransactionAsync(takerAddress, isApproved, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const salt = generatePseudoRandomSalt();
            await web3Wrapper.awaitTransactionSuccessAsync(
                await whitelist.fillOrderIfWhitelisted.sendTransactionAsync(
                    orderWithoutExchangeAddress,
                    takerAssetFillAmount,
                    salt,
                    signedOrder.signature,
                    { from: takerAddress },
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
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
