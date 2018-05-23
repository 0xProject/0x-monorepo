import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { LogWithDecodedArgs } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import {
    CancelContractEventArgs,
    ExchangeContract,
    ExchangeStatusContractEventArgs,
    FillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';
import { artifacts } from '../../src/utils/artifacts';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { crypto } from '../../src/utils/crypto';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import {
    AssetProxyId,
    ContractName,
    ERC20BalancesByOwner,
    ERC721TokenIdsByOwner,
    ExchangeStatus,
    OrderInfo,
    SignedOrder,
} from '../../src/utils/types';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

import { MatchOrderTester } from '../../src/utils/match_order_tester';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('matchOrders', () => {
    let makerAddressLeft: string;
    let makerAddressRight: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddressLeft: string;
    let feeRecipientAddressRight: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let erc20BalancesByOwner: ERC20BalancesByOwner;
    let erc721TokenIdsByOwner: ERC721TokenIdsByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let orderFactoryLeft: OrderFactory;
    let orderFactoryRight: OrderFactory;

    let erc721LeftMakerAssetIds: BigNumber[];
    let erc721RightMakerAssetIds: BigNumber[];
    let erc721TakerAssetIds: BigNumber[];

    let defaultERC20MakerAssetAddress: string;
    let defaultERC20TakerAssetAddress: string;
    let defaultERC721AssetAddress: string;

    let matchOrderTester: MatchOrderTester;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // Create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([
            owner,
            makerAddressLeft,
            makerAddressRight,
            takerAddress,
            feeRecipientAddressLeft,
            feeRecipientAddressRight,
        ] = accounts);
        // Create wrappers
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        // Deploy ERC20 token & ERC20 proxy
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync();
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // Deploy ERC721 token and proxy
        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721LeftMakerAssetIds = erc721Balances[makerAddressLeft][erc721Token.address];
        erc721RightMakerAssetIds = erc721Balances[makerAddressRight][erc721Token.address];
        erc721TakerAssetIds = erc721Balances[takerAddress][erc721Token.address];
        // Depoy exchange
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetProxyUtils.encodeERC20ProxyData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC20, erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC721, erc721Proxy.address, owner);
        // Authorize ERC20 and ERC721 trades by exchange
        await web3Wrapper.awaitTransactionMinedAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionMinedAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        // Set default addresses
        defaultERC20MakerAssetAddress = erc20TokenA.address;
        defaultERC20TakerAssetAddress = erc20TokenB.address;
        defaultERC721AssetAddress = erc721Token.address;
        // Create default order parameters
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: exchange.address,
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
            takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
        };
        const privateKeyLeft = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressLeft)];
        orderFactoryLeft = new OrderFactory(privateKeyLeft, defaultOrderParams);
        const privateKeyRight = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressRight)];
        orderFactoryRight = new OrderFactory(privateKeyRight, defaultOrderParams);
        // Set match order tester
        matchOrderTester = new MatchOrderTester(exchangeWrapper, erc20Wrapper, erc721Wrapper, zrxToken.address);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('matchOrders', () => {
        beforeEach(async () => {
            erc20BalancesByOwner = await erc20Wrapper.getBalancesAsync();
            erc721TokenIdsByOwner = await erc721Wrapper.getBalancesAsync();
        });

        it('should transfer the correct amounts when orders completely fill each other', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was fully filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify right order was fully filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
        });

        it('should transfer the correct amounts when orders completely fill each other and taker doesnt take a profit', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Store original taker balance
            const takerInitialBalances = _.cloneDeep(erc20BalancesByOwner[takerAddress][defaultERC20MakerAssetAddress]);
            // Match signedOrderLeft with signedOrderRight
            let newERC20BalancesByOwner: ERC20BalancesByOwner;
            let newERC721TokenIdsByOwner: ERC721TokenIdsByOwner;
            [
                newERC20BalancesByOwner,
                newERC721TokenIdsByOwner,
            ] = await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was fully filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify right order was fully filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify taker did not take a profit
            expect(takerInitialBalances).to.be.deep.equal(
                newERC20BalancesByOwner[takerAddress][defaultERC20MakerAssetAddress],
            );
        });

        it('should transfer the correct amounts when left order is completely filled and right order is partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(20), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was fully filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify right order was partially filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FILLABLE);
        });

        it('should transfer the correct amounts when right order is completely filled and left order is partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was partially filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FILLABLE);
            // Verify right order was fully filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the left order', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            let newERC20BalancesByOwner: ERC20BalancesByOwner;
            let newERC721TokenIdsByOwner: ERC721TokenIdsByOwner;
            [
                newERC20BalancesByOwner,
                newERC721TokenIdsByOwner,
            ] = await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was partially filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FILLABLE);
            // Verify right order was fully filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Construct second right order
            // Note: This order needs makerAssetAmount=90/takerAssetAmount=[anything <= 45] to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "left fill"
            //       branch in the contract twice for this test.
            const signedOrderRight2 = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match signedOrderLeft with signedOrderRight2
            const leftTakerAssetFilledAmount = signedOrderRight.makerAssetAmount;
            const rightTakerAssetFilledAmount = new BigNumber(0);
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight2,
                takerAddress,
                newERC20BalancesByOwner,
                erc721TokenIdsByOwner,
                leftTakerAssetFilledAmount,
                rightTakerAssetFilledAmount,
            );
            // Verify left order was fully filled
            const leftOrderInfo2: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo2.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify second right order was partially filled
            const rightOrderInfo2: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight2);
            expect(rightOrderInfo2.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FILLABLE);
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the right order', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });

            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            let newERC20BalancesByOwner: ERC20BalancesByOwner;
            let newERC721TokenIdsByOwner: ERC721TokenIdsByOwner;
            [
                newERC20BalancesByOwner,
                newERC721TokenIdsByOwner,
            ] = await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was partially filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify right order was fully filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FILLABLE);
            // Create second left order
            // Note: This order needs makerAssetAmount=96/takerAssetAmount=48 to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "right fill"
            //       branch in the contract twice for this test.
            const signedOrderLeft2 = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            // Match signedOrderLeft2 with signedOrderRight
            const leftTakerAssetFilledAmount = new BigNumber(0);
            const takerAmountReceived = newERC20BalancesByOwner[takerAddress][defaultERC20MakerAssetAddress].minus(
                erc20BalancesByOwner[takerAddress][defaultERC20MakerAssetAddress],
            );
            const rightTakerAssetFilledAmount = signedOrderLeft.makerAssetAmount.minus(takerAmountReceived);
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft2,
                signedOrderRight,
                takerAddress,
                newERC20BalancesByOwner,
                erc721TokenIdsByOwner,
                leftTakerAssetFilledAmount,
                rightTakerAssetFilledAmount,
            );
            // Verify second left order was partially filled
            const leftOrderInfo2: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft2);
            expect(leftOrderInfo2.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FILLABLE);
            // Verify right order was fully filled
            const rightOrderInfo2: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo2.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
        });

        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            const feeRecipientAddress = feeRecipientAddressLeft;
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress,
            });
            // Match orders
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
        });

        it('should transfer the correct amounts if taker is also the left order maker', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            takerAddress = signedOrderLeft.makerAddress;
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
        });

        it('should transfer the correct amounts if taker is also the right order maker', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            takerAddress = signedOrderRight.makerAddress;
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
        });

        it('should transfer the correct amounts if taker is also the left fee recipient', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            takerAddress = feeRecipientAddressLeft;
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
        });

        it('should transfer the correct amounts if taker is also the right fee recipient', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            takerAddress = feeRecipientAddressRight;
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
        });

        it('should transfer the correct amounts if left maker is the left fee recipient and right maker is the right fee recipient', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: makerAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: makerAddressRight,
            });
            // Match orders
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
        });

        it('Should throw if left order is not fillable', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Cancel left order
            await exchangeWrapper.cancelOrderAsync(signedOrderLeft, signedOrderLeft.makerAddress);
            // Match orders
            return expect(
                exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('Should throw if right order is not fillable', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Cancel right order
            await exchangeWrapper.cancelOrderAsync(signedOrderRight, signedOrderRight.makerAddress);
            // Match orders
            return expect(
                exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if there is not a positive spread', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            return expect(
                matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                    signedOrderLeft,
                    signedOrderRight,
                    takerAddress,
                    erc20BalancesByOwner,
                    erc721TokenIdsByOwner,
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if the left maker asset is not equal to the right taker asset ', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            return expect(
                matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                    signedOrderLeft,
                    signedOrderRight,
                    takerAddress,
                    erc20BalancesByOwner,
                    erc721TokenIdsByOwner,
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if the right maker asset is not equal to the left taker asset', async () => {
            // Create orders to match
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            return expect(
                matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                    signedOrderLeft,
                    signedOrderRight,
                    takerAddress,
                    erc20BalancesByOwner,
                    erc721TokenIdsByOwner,
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should transfer correct amounts when left order maker asset is an ERC721 token', async () => {
            // Create orders to match
            const erc721TokenToTransfer = erc721LeftMakerAssetIds[0];
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(defaultERC721AssetAddress, erc721TokenToTransfer),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20TakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(defaultERC721AssetAddress, erc721TokenToTransfer),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: new BigNumber(1),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was fully filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify right order was fully filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
        });

        it('should transfer correct amounts when right order maker asset is an ERC721 token', async () => {
            // Create orders to match
            const erc721TokenToTransfer = erc721RightMakerAssetIds[0];
            const signedOrderLeft = orderFactoryLeft.newSignedOrder({
                makerAddress: makerAddressLeft,
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(defaultERC721AssetAddress, erc721TokenToTransfer),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: new BigNumber(1),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = orderFactoryRight.newSignedOrder({
                makerAddress: makerAddressRight,
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(defaultERC721AssetAddress, erc721TokenToTransfer),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultERC20MakerAssetAddress),
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Match orders
            await matchOrderTester.matchOrdersAndVerifyBalancesAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
            );
            // Verify left order was fully filled
            const leftOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
            expect(leftOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
            // Verify right order was fully filled
            const rightOrderInfo: OrderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrderRight);
            expect(rightOrderInfo.orderStatus as ExchangeStatus).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
        });
    });
}); // tslint:disable-line:max-file-line-count
