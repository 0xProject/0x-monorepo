import {
    artifacts as proxyArtifacts,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
} from '@0x/contracts-asset-proxy';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { artifacts as erc721Artifacts, DummyERC721TokenContract } from '@0x/contracts-erc721';
import { ExchangeContract, ExchangeRevertErrors, ExchangeWrapper } from '@0x/contracts-exchange';
import {
    chaiSetup,
    constants,
    ERC20BalancesByOwner,
    expectContractCreationFailedAsync,
    LogDecoder,
    OrderFactory,
    provider,
    sendTransactionResult,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, ExchangeFillEventArgs, OrderMatcherContract } from '../src';

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
chaiSetup.configure();
const expect = chai.expect;
// tslint:disable:no-unnecessary-type-assertion
describe('OrderMatcher', () => {
    let chainId: number;
    let makerAddressLeft: string;
    let makerAddressRight: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddressLeft: string;
    let feeRecipientAddressRight: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let orderMatcher: OrderMatcherContract;

    let erc20BalancesByOwner: ERC20BalancesByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let orderFactoryLeft: OrderFactory;
    let orderFactoryRight: OrderFactory;

    let leftMakerAssetData: string;
    let leftTakerAssetData: string;
    let defaultERC20MakerAssetAddress: string;
    let defaultERC20TakerAssetAddress: string;

    const devUtils = new DevUtilsContract(constants.NULL_ADDRESS, provider, txDefaults);
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        chainId = await providerUtils.getChainIdAsync(provider);
        // Create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        // Hack(albrow): Both Prettier and TSLint insert a trailing comma below
        // but that is invalid syntax as of TypeScript version >= 2.8. We don't
        // have the right fine-grained configuration options in TSLint,
        // Prettier, or TypeScript, to reconcile this, so we will just have to
        // wait for them to sort it out. We disable TSLint and Prettier for
        // this part of the code for now. This occurs several times in this
        // file. See https://github.com/prettier/prettier/issues/4624.
        // prettier-ignore
        const usedAddresses = ([
            owner,
            makerAddressLeft,
            makerAddressRight,
            takerAddress,
            feeRecipientAddressLeft,
            // tslint:disable-next-line:trailing-comma
            feeRecipientAddressRight
        ] = _.slice(accounts, 0, 6));
        // Create wrappers
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        // Deploy ERC20 token & ERC20 proxy
        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // Deploy ERC721 proxy
        erc721Proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.ERC721Proxy,
            provider,
            txDefaults,
            artifacts,
        );
        // Depoy exchange
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            artifacts,
            await devUtils.encodeERC20AssetData.callAsync(zrxToken.address),
            new BigNumber(chainId),
        );
        exchangeWrapper = new ExchangeWrapper(exchange);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);
        // Authorize ERC20 trades by exchange
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        // Deploy OrderMatcher
        orderMatcher = await OrderMatcherContract.deployFrom0xArtifactAsync(
            artifacts.OrderMatcher,
            provider,
            txDefaults,
            artifacts,
            exchange.address,
        );
        // Set default addresses
        defaultERC20MakerAssetAddress = erc20TokenA.address;
        defaultERC20TakerAssetAddress = erc20TokenB.address;
        leftMakerAssetData = await devUtils.encodeERC20AssetData.callAsync(defaultERC20MakerAssetAddress);
        leftTakerAssetData = await devUtils.encodeERC20AssetData.callAsync(defaultERC20TakerAssetAddress);
        // Set OrderMatcher balances and allowances
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20TokenA.setBalance.sendTransactionAsync(orderMatcher.address, constants.INITIAL_ERC20_BALANCE, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20TokenB.setBalance.sendTransactionAsync(orderMatcher.address, constants.INITIAL_ERC20_BALANCE, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await orderMatcher.approveAssetProxy.sendTransactionAsync(
                leftMakerAssetData,
                constants.INITIAL_ERC20_ALLOWANCE,
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await orderMatcher.approveAssetProxy.sendTransactionAsync(
                leftTakerAssetData,
                constants.INITIAL_ERC20_ALLOWANCE,
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Create default order parameters
        const defaultOrderParamsLeft = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressLeft,
            makerAssetData: leftMakerAssetData,
            takerAssetData: leftTakerAssetData,
            feeRecipientAddress: feeRecipientAddressLeft,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            exchangeAddress: exchange.address,
            chainId,
        };
        const defaultOrderParamsRight = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressRight,
            makerAssetData: leftTakerAssetData,
            takerAssetData: leftMakerAssetData,
            feeRecipientAddress: feeRecipientAddressRight,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            exchangeAddress: exchange.address,
            chainId,
        };
        const privateKeyLeft = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressLeft)];
        orderFactoryLeft = new OrderFactory(privateKeyLeft, defaultOrderParamsLeft);
        const privateKeyRight = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressRight)];
        orderFactoryRight = new OrderFactory(privateKeyRight, defaultOrderParamsRight);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('constructor', () => {
        it('should revert if assetProxy is unregistered', async () => {
            const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
                artifacts.Exchange,
                provider,
                txDefaults,
                artifacts,
                constants.NULL_BYTES,
                new BigNumber(chainId),
            );
            return expectContractCreationFailedAsync(
                (OrderMatcherContract.deployFrom0xArtifactAsync(
                    artifacts.OrderMatcher,
                    provider,
                    txDefaults,
                    artifacts,
                    exchangeInstance.address,
                ) as any) as sendTransactionResult,
                RevertReason.UnregisteredAssetProxy,
            );
        });
    });
    describe('matchOrders', () => {
        beforeEach(async () => {
            erc20BalancesByOwner = await erc20Wrapper.getBalancesAsync();
        });
        it('should revert if not called by owner', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            const tx = web3Wrapper.sendTransactionAsync({
                data,
                to: orderMatcher.address,
                from: takerAddress,
                gas: constants.MAX_MATCH_ORDERS_GAS,
            });
            return expect(tx).to.revertWith(RevertReason.OnlyContractOwner);
        });
        it('should transfer the correct amounts when orders completely fill each other', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: signedOrderLeft.makerAssetAmount,
                amountBoughtByLeftMaker: signedOrderLeft.takerAssetAmount,
                // Right Maker
                amountSoldByRightMaker: signedOrderRight.makerAssetAmount,
                amountBoughtByRightMaker: signedOrderRight.takerAssetAmount,
                // Taker
                leftMakerAssetSpreadAmount: signedOrderLeft.makerAssetAmount.minus(signedOrderRight.takerAssetAmount),
            };
            const initialLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await web3Wrapper.sendTransactionAsync({
                    data,
                    to: orderMatcher.address,
                    from: owner,
                    gas: constants.MAX_MATCH_ORDERS_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const newLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const newErc20Balances = await erc20Wrapper.getBalancesAsync();
            expect(newErc20Balances[makerAddressLeft][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20MakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20TakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByRightMaker,
                ),
            );
            expect(newErc20Balances[makerAddressLeft][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20TakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20MakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByRightMaker,
                ),
            );
            expect(newLeftMakerAssetTakerBalance).to.be.bignumber.equal(
                initialLeftMakerAssetTakerBalance.plus(expectedTransferAmounts.leftMakerAssetSpreadAmount),
            );
        });
        it('should transfer the correct amounts when orders completely fill each other and taker doesnt take a profit', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: signedOrderLeft.makerAssetAmount,
                amountBoughtByLeftMaker: signedOrderLeft.takerAssetAmount,
                // Right Maker
                amountSoldByRightMaker: signedOrderRight.makerAssetAmount,
                amountBoughtByRightMaker: signedOrderRight.takerAssetAmount,
            };
            const initialLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await web3Wrapper.sendTransactionAsync({
                    data,
                    to: orderMatcher.address,
                    from: owner,
                    gas: constants.MAX_MATCH_ORDERS_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const newLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const newErc20Balances = await erc20Wrapper.getBalancesAsync();
            expect(newErc20Balances[makerAddressLeft][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20MakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20TakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByRightMaker,
                ),
            );
            expect(newErc20Balances[makerAddressLeft][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20TakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20MakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByRightMaker,
                ),
            );
            expect(newLeftMakerAssetTakerBalance).to.be.bignumber.equal(initialLeftMakerAssetTakerBalance);
        });
        it('should transfer the correct amounts when left order is completely filled and right order would be partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(20), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: signedOrderLeft.makerAssetAmount,
                amountBoughtByLeftMaker: signedOrderLeft.takerAssetAmount,
                // Right Maker
                amountSoldByRightMaker: signedOrderRight.makerAssetAmount,
                amountBoughtByRightMaker: signedOrderRight.takerAssetAmount,
                // Taker
                leftMakerAssetSpreadAmount: signedOrderLeft.makerAssetAmount.minus(signedOrderRight.takerAssetAmount),
                leftTakerAssetSpreadAmount: signedOrderRight.makerAssetAmount.minus(signedOrderLeft.takerAssetAmount),
            };
            const initialLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const initialLeftTakerAssetTakerBalance = await erc20TokenB.balanceOf.callAsync(orderMatcher.address);
            // Match signedOrderLeft with signedOrderRight
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await web3Wrapper.sendTransactionAsync({
                    data,
                    to: orderMatcher.address,
                    from: owner,
                    gas: constants.MAX_MATCH_ORDERS_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const newLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const newLeftTakerAssetTakerBalance = await erc20TokenB.balanceOf.callAsync(orderMatcher.address);
            const newErc20Balances = await erc20Wrapper.getBalancesAsync();
            expect(newErc20Balances[makerAddressLeft][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20MakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20TakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByRightMaker,
                ),
            );
            expect(newErc20Balances[makerAddressLeft][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20TakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20MakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByRightMaker,
                ),
            );
            expect(newLeftMakerAssetTakerBalance).to.be.bignumber.equal(
                initialLeftMakerAssetTakerBalance.plus(expectedTransferAmounts.leftMakerAssetSpreadAmount),
            );
            expect(newLeftTakerAssetTakerBalance).to.be.bignumber.equal(
                initialLeftTakerAssetTakerBalance.plus(expectedTransferAmounts.leftTakerAssetSpreadAmount),
            );
        });
        it('should not call fillOrder when rightOrder is completely filled after matchOrders call and orders were never partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            const logDecoder = new LogDecoder(web3Wrapper, artifacts);
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await web3Wrapper.sendTransactionAsync({
                    data,
                    to: orderMatcher.address,
                    from: owner,
                    gas: constants.MAX_MATCH_ORDERS_GAS,
                }),
            );
            const fillLogs = _.filter(
                txReceipt.logs,
                log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
            );
            // Only 2 Fill logs should exist for `matchOrders` call. `fillOrder` should not have been called and should not have emitted a Fill event.
            expect(fillLogs.length).to.be.equal(2);
        });
        it('should not call fillOrder when rightOrder is completely filled after matchOrders call and orders were initially partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            await exchangeWrapper.fillOrderAsync(signedOrderLeft, takerAddress, {
                takerAssetFillAmount: signedOrderLeft.takerAssetAmount.dividedToIntegerBy(5),
            });
            await exchangeWrapper.fillOrderAsync(signedOrderRight, takerAddress, {
                takerAssetFillAmount: signedOrderRight.takerAssetAmount.dividedToIntegerBy(5),
            });
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            const logDecoder = new LogDecoder(web3Wrapper, artifacts);
            const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                await web3Wrapper.sendTransactionAsync({
                    data,
                    to: orderMatcher.address,
                    from: owner,
                    gas: constants.MAX_MATCH_ORDERS_GAS,
                }),
            );
            const fillLogs = _.filter(
                txReceipt.logs,
                log => (log as LogWithDecodedArgs<ExchangeFillEventArgs>).event === 'Fill',
            );
            // Only 2 Fill logs should exist for `matchOrders` call. `fillOrder` should not have been called and should not have emitted a Fill event.
            expect(fillLogs.length).to.be.equal(2);
        });
        it('should only take a spread in rightMakerAsset if entire leftMakerAssetSpread amount can be used to fill rightOrder after matchOrders call', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(0.9), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(990), 18),
            });
            const initialLeftMakerAssetSpreadAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1.09), 18);
            const leftTakerAssetSpreadAmount = initialLeftMakerAssetSpreadAmount
                .times(signedOrderRight.makerAssetAmount)
                .dividedToIntegerBy(signedOrderRight.takerAssetAmount);
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: signedOrderLeft.makerAssetAmount,
                amountBoughtByLeftMaker: signedOrderLeft.takerAssetAmount,
                // Right Maker
                amountSoldByRightMaker: signedOrderLeft.takerAssetAmount.plus(leftTakerAssetSpreadAmount),
                amountBoughtByRightMaker: signedOrderLeft.makerAssetAmount,
                // Taker
                leftMakerAssetSpreadAmount: constants.ZERO_AMOUNT,
                leftTakerAssetSpreadAmount,
            };
            const initialLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const initialLeftTakerAssetTakerBalance = await erc20TokenB.balanceOf.callAsync(orderMatcher.address);
            // Match signedOrderLeft with signedOrderRight
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await web3Wrapper.sendTransactionAsync({
                    data,
                    to: orderMatcher.address,
                    from: owner,
                    gas: constants.MAX_MATCH_ORDERS_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const newLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const newLeftTakerAssetTakerBalance = await erc20TokenB.balanceOf.callAsync(orderMatcher.address);
            const newErc20Balances = await erc20Wrapper.getBalancesAsync();
            expect(newErc20Balances[makerAddressLeft][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20MakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20TakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByRightMaker,
                ),
            );
            expect(newErc20Balances[makerAddressLeft][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20TakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20MakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByRightMaker,
                ),
            );
            expect(newLeftMakerAssetTakerBalance).to.be.bignumber.equal(
                initialLeftMakerAssetTakerBalance.plus(expectedTransferAmounts.leftMakerAssetSpreadAmount),
            );
            expect(newLeftTakerAssetTakerBalance).to.be.bignumber.equal(
                initialLeftTakerAssetTakerBalance.plus(expectedTransferAmounts.leftTakerAssetSpreadAmount),
            );
        });
        it("should succeed if rightOrder's makerAssetData and takerAssetData are not provided", async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(20), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: signedOrderLeft.makerAssetAmount,
                amountBoughtByLeftMaker: signedOrderLeft.takerAssetAmount,
                // Right Maker
                amountSoldByRightMaker: signedOrderRight.makerAssetAmount,
                amountBoughtByRightMaker: signedOrderRight.takerAssetAmount,
                // Taker
                leftMakerAssetSpreadAmount: signedOrderLeft.makerAssetAmount.minus(signedOrderRight.takerAssetAmount),
                leftTakerAssetSpreadAmount: signedOrderRight.makerAssetAmount.minus(signedOrderLeft.takerAssetAmount),
            };
            const initialLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const initialLeftTakerAssetTakerBalance = await erc20TokenB.balanceOf.callAsync(orderMatcher.address);
            // Match signedOrderLeft with signedOrderRight
            signedOrderRight.makerAssetData = constants.NULL_BYTES;
            signedOrderRight.takerAssetData = constants.NULL_BYTES;
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await web3Wrapper.sendTransactionAsync({
                    data,
                    to: orderMatcher.address,
                    from: owner,
                    gas: constants.MAX_MATCH_ORDERS_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const newLeftMakerAssetTakerBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            const newLeftTakerAssetTakerBalance = await erc20TokenB.balanceOf.callAsync(orderMatcher.address);
            const newErc20Balances = await erc20Wrapper.getBalancesAsync();
            expect(newErc20Balances[makerAddressLeft][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20MakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20TakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByRightMaker,
                ),
            );
            expect(newErc20Balances[makerAddressLeft][defaultERC20TakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressLeft][defaultERC20TakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByLeftMaker,
                ),
            );
            expect(newErc20Balances[makerAddressRight][defaultERC20MakerAssetAddress]).to.be.bignumber.equal(
                erc20BalancesByOwner[makerAddressRight][defaultERC20MakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByRightMaker,
                ),
            );
            expect(newLeftMakerAssetTakerBalance).to.be.bignumber.equal(
                initialLeftMakerAssetTakerBalance.plus(expectedTransferAmounts.leftMakerAssetSpreadAmount),
            );
            expect(newLeftTakerAssetTakerBalance).to.be.bignumber.equal(
                initialLeftTakerAssetTakerBalance.plus(expectedTransferAmounts.leftTakerAssetSpreadAmount),
            );
        });
        it('should revert with the correct reason if matchOrders call reverts', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
            });
            signedOrderRight.signature = `0xff${signedOrderRight.signature.slice(4)}`;
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            const expectedError = new ExchangeRevertErrors.SignatureError();
            const tx = web3Wrapper.sendTransactionAsync({
                data,
                to: orderMatcher.address,
                from: owner,
                gas: constants.MAX_MATCH_ORDERS_GAS,
            });
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert with the correct reason if fillOrder call reverts', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(20), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 18),
            });
            // Matcher will not have enough allowance to fill rightOrder
            await web3Wrapper.awaitTransactionSuccessAsync(
                await orderMatcher.approveAssetProxy.sendTransactionAsync(leftMakerAssetData, constants.ZERO_AMOUNT, {
                    from: owner,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const data = exchange.matchOrders.getABIEncodedTransactionData(
                signedOrderLeft,
                signedOrderRight,
                signedOrderLeft.signature,
                signedOrderRight.signature,
            );
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError();
            const tx = web3Wrapper.sendTransactionAsync({
                data,
                to: orderMatcher.address,
                from: owner,
                gas: constants.MAX_MATCH_ORDERS_GAS,
            });
            return expect(tx).to.revertWith(expectedError);
        });
    });
    describe('withdrawAsset', () => {
        it('should allow owner to withdraw ERC20 tokens', async () => {
            const erc20AWithdrawAmount = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            expect(erc20AWithdrawAmount).to.be.bignumber.gt(constants.ZERO_AMOUNT);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await orderMatcher.withdrawAsset.sendTransactionAsync(leftMakerAssetData, erc20AWithdrawAmount, {
                    from: owner,
                }),
            );
            const newBalance = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            expect(newBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should allow owner to withdraw ERC721 tokens', async () => {
            const erc721Token = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
                erc721Artifacts.DummyERC721Token,
                provider,
                txDefaults,
                artifacts,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
            );
            const tokenId = new BigNumber(1);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc721Token.mint.sendTransactionAsync(orderMatcher.address, tokenId, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const assetData = await devUtils.encodeERC721AssetData.callAsync(erc721Token.address, tokenId);
            const withdrawAmount = new BigNumber(1);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await orderMatcher.withdrawAsset.sendTransactionAsync(assetData, withdrawAmount, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const erc721Owner = await erc721Token.ownerOf.callAsync(tokenId);
            expect(erc721Owner).to.be.equal(owner);
        });
        it('should revert if not called by owner', async () => {
            const erc20AWithdrawAmount = await erc20TokenA.balanceOf.callAsync(orderMatcher.address);
            expect(erc20AWithdrawAmount).to.be.bignumber.gt(constants.ZERO_AMOUNT);
            const tx = orderMatcher.withdrawAsset.sendTransactionAsync(leftMakerAssetData, erc20AWithdrawAmount, {
                from: takerAddress,
            });
            return expect(tx).to.revertWith(RevertReason.OnlyContractOwner);
        });
    });
    describe('approveAssetProxy', () => {
        it('should be able to set an allowance for ERC20 tokens', async () => {
            const allowance = new BigNumber(55465465426546);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await orderMatcher.approveAssetProxy.sendTransactionAsync(leftMakerAssetData, allowance, {
                    from: owner,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const newAllowance = await erc20TokenA.allowance.callAsync(orderMatcher.address, erc20Proxy.address);
            expect(newAllowance).to.be.bignumber.equal(allowance);
        });
        it('should be able to approve an ERC721 token by passing in allowance = 1', async () => {
            const erc721Token = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
                erc721Artifacts.DummyERC721Token,
                provider,
                txDefaults,
                artifacts,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
            );
            const assetData = await devUtils.encodeERC721AssetData.callAsync(
                erc721Token.address,
                constants.ZERO_AMOUNT,
            );
            const allowance = new BigNumber(1);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await orderMatcher.approveAssetProxy.sendTransactionAsync(assetData, allowance, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isApproved = await erc721Token.isApprovedForAll.callAsync(orderMatcher.address, erc721Proxy.address);
            expect(isApproved).to.be.equal(true);
        });
        it('should be able to approve an ERC721 token by passing in allowance > 1', async () => {
            const erc721Token = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
                erc721Artifacts.DummyERC721Token,
                provider,
                txDefaults,
                artifacts,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
            );
            const assetData = await devUtils.encodeERC721AssetData.callAsync(
                erc721Token.address,
                constants.ZERO_AMOUNT,
            );
            const allowance = new BigNumber(2);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await orderMatcher.approveAssetProxy.sendTransactionAsync(assetData, allowance, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isApproved = await erc721Token.isApprovedForAll.callAsync(orderMatcher.address, erc721Proxy.address);
            expect(isApproved).to.be.equal(true);
        });
        it('should revert if not called by owner', async () => {
            const approval = new BigNumber(1);
            const tx = orderMatcher.approveAssetProxy.sendTransactionAsync(leftMakerAssetData, approval, {
                from: takerAddress,
            });
            return expect(tx).to.revertWith(RevertReason.OnlyContractOwner);
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
