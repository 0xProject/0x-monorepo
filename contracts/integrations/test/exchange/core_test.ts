import {
    artifacts as proxyArtifacts,
    encodeERC1155AssetData,
    encodeERC20AssetData,
    encodeERC721AssetData,
    encodeMultiAssetData,
    encodeStaticCallAssetData,
    ERC1155ProxyContract,
    ERC1155ProxyWrapper,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
    ERC721Wrapper,
    MultiAssetProxyContract,
    StaticCallProxyContract,
    TestStaticCallTargetContract,
} from '@0x/contracts-asset-proxy';
import { ERC1155MintableContract, Erc1155Wrapper } from '@0x/contracts-erc1155';
import {
    artifacts as erc20Artifacts,
    DummyERC20TokenContract,
    DummyNoReturnERC20TokenContract,
} from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts, ExchangeCancelEventArgs, ExchangeContract, ExchangeRevertErrors } from '@0x/contracts-exchange';
import { LibMathRevertErrors } from '@0x/contracts-exchange-libs';
import {
    blockchainTests,
    constants,
    describe,
    ERC20BalancesByOwner,
    expect,
    getLatestBlockTimestampAsync,
    increaseTimeAndMineBlockAsync,
    OrderFactory,
    orderHashUtils,
    OrderStatus,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils, StringRevertError } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { FillOrderWrapper } from './fill_order_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Exchange core', () => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let feeToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let noReturnErc20Token: DummyNoReturnERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let erc1155Proxy: ERC1155ProxyContract;
    let multiAssetProxy: MultiAssetProxyContract;
    let erc1155Contract: ERC1155MintableContract;
    let staticCallProxy: StaticCallProxyContract;
    let staticCallTarget: TestStaticCallTargetContract;

    let signedOrder: SignedOrder;
    let erc20Balances: ERC20BalancesByOwner;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc1155Wrapper: Erc1155Wrapper;
    let erc1155ProxyWrapper: ERC1155ProxyWrapper;
    let orderFactory: OrderFactory;

    let erc721MakerAssetIds: BigNumber[];
    let erc721TakerAssetIds: BigNumber[];
    let erc1155FungibleTokens: BigNumber[];
    let erc1155NonFungibleTokensOwnedByMaker: BigNumber[];
    let erc1155NonFungibleTokensOwnedByTaker: BigNumber[];

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;
    let defaultFeeAssetAddress: string;

    let fillOrderWrapper: FillOrderWrapper;

    before(async () => {
        chainId = await providerUtils.getChainIdAsync(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 0, 4));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        erc1155ProxyWrapper = new ERC1155ProxyWrapper(provider, usedAddresses, owner);

        // Deploy AssetProxies, Exchange, tokens, and malicious contracts
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.MultiAssetProxy,
            provider,
            txDefaults,
            {},
        );
        staticCallProxy = await StaticCallProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.StaticCallProxy,
            provider,
            txDefaults,
            {},
        );
        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, feeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        noReturnErc20Token = await DummyNoReturnERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyNoReturnERC20Token,
            provider,
            txDefaults,
            {},
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        erc20Wrapper.addDummyTokenContract((noReturnErc20Token as any) as DummyERC20TokenContract);
        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc1155Proxy = await erc1155ProxyWrapper.deployProxyAsync();
        [erc1155Wrapper] = await erc1155ProxyWrapper.deployDummyContractsAsync();
        erc1155Contract = erc1155Wrapper.getContract();
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            {},
            new BigNumber(chainId),
        );
        // Configure ERC20Proxy
        await erc20Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });
        await erc20Proxy.addAuthorizedAddress(multiAssetProxy.address).awaitTransactionSuccessAsync({ from: owner });

        // Configure ERC721Proxy
        await erc721Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });
        await erc721Proxy.addAuthorizedAddress(multiAssetProxy.address).awaitTransactionSuccessAsync({ from: owner });

        // Configure ERC1155Proxy
        await erc1155Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });
        await erc1155Proxy.addAuthorizedAddress(multiAssetProxy.address).awaitTransactionSuccessAsync({ from: owner });

        // Configure MultiAssetProxy
        await multiAssetProxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });
        await multiAssetProxy.registerAssetProxy(erc20Proxy.address).awaitTransactionSuccessAsync({ from: owner });
        await multiAssetProxy.registerAssetProxy(erc721Proxy.address).awaitTransactionSuccessAsync({ from: owner });
        await multiAssetProxy.registerAssetProxy(staticCallProxy.address).awaitTransactionSuccessAsync({ from: owner });

        // Configure Exchange
        for (const proxy of [erc20Proxy, erc721Proxy, erc1155Proxy, multiAssetProxy, staticCallProxy]) {
            await exchange.registerAssetProxy(proxy.address).awaitTransactionSuccessAsync({ from: owner });
        }

        // Configure ERC20 tokens
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        // Configure ERC721 tokens
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];
        erc721TakerAssetIds = erc721Balances[takerAddress][erc721Token.address];

        // Configure ERC1155 tokens
        await erc1155ProxyWrapper.setBalancesAndAllowancesAsync();
        erc1155FungibleTokens = erc1155ProxyWrapper.getFungibleTokenIds();
        const nonFungibleTokens = erc1155ProxyWrapper.getNonFungibleTokenIds();
        const tokenBalances = await erc1155ProxyWrapper.getBalancesAsync();
        erc1155NonFungibleTokensOwnedByMaker = [];
        erc1155NonFungibleTokensOwnedByTaker = [];
        _.each(nonFungibleTokens, (nonFungibleToken: BigNumber) => {
            const nonFungibleTokenAsString = nonFungibleToken.toString();
            const nonFungibleTokenHeldByMaker =
                tokenBalances.nonFungible[makerAddress][erc1155Contract.address][nonFungibleTokenAsString][0];
            erc1155NonFungibleTokensOwnedByMaker.push(nonFungibleTokenHeldByMaker);
            const nonFungibleTokenHeldByTaker =
                tokenBalances.nonFungible[takerAddress][erc1155Contract.address][nonFungibleTokenAsString][0];
            erc1155NonFungibleTokensOwnedByTaker.push(nonFungibleTokenHeldByTaker);
        });

        // Configure order defaults
        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;
        defaultFeeAssetAddress = feeToken.address;
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: encodeERC20AssetData(defaultTakerAssetAddress),
            makerFeeAssetData: encodeERC20AssetData(defaultFeeAssetAddress),
            takerFeeAssetData: encodeERC20AssetData(defaultFeeAssetAddress),
            exchangeAddress: exchange.address,
            chainId,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        const tokenContracts = {
            erc20: { erc20TokenA, erc20TokenB, feeToken, noReturnErc20Token },
            erc721: { erc721Token },
            erc1155: { erc1155Contract },
        };
        const tokenIds = {
            erc721: { [erc721Token.address]: [...erc721MakerAssetIds, ...erc721TakerAssetIds] },
            erc1155: {
                [erc1155Contract.address]: {
                    fungible: erc1155FungibleTokens,
                    nonFungible: [...erc1155NonFungibleTokensOwnedByMaker, ...erc1155NonFungibleTokensOwnedByTaker],
                },
            },
        };
        fillOrderWrapper = new FillOrderWrapper(
            exchange,
            { makerAddress, takerAddress, feeRecipientAddress },
            tokenContracts,
            tokenIds,
        );
    });
    describe('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should revert if fully filled', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            await exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.FullyFilled);
            const tx = exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should noop transfer but return nonzero FillResults for fills where from == to', async () => {
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, makerAddress);
        });

        it('should revert if order is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHash, OrderStatus.Expired);
            const tx = exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should throw if rounding error is greater than 0.1%', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1001),
                takerAssetAmount: new BigNumber(3),
            });

            const fillTakerAssetAmount1 = new BigNumber(2);
            await exchange
                .fillOrder(signedOrder, fillTakerAssetAmount1, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });

            const fillTakerAssetAmount2 = new BigNumber(1);
            const expectedError = new LibMathRevertErrors.RoundingError(
                fillTakerAssetAmount2,
                new BigNumber(3),
                new BigNumber(1001),
            );
            const tx = exchange
                .fillOrder(signedOrder, fillTakerAssetAmount2, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('Fill transfer ordering', () => {
        it('should allow the maker to exchange assets received by the taker', async () => {
            // Set maker/taker assetData to the same asset
            const takerAssetData = encodeERC20AssetData(erc20TokenA.address);
            const takerAssetAmount = new BigNumber(1);
            const makerAssetData = encodeMultiAssetData([takerAssetAmount], [takerAssetData]);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount: takerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            // Set maker balance to 0 so that the asset must be received by the taker in order for the fill to succeed
            await erc20TokenA.setBalance(makerAddress, constants.ZERO_AMOUNT).awaitTransactionSuccessAsync({
                from: owner,
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should allow the taker to pay fees with an asset that received by the maker', async () => {
            const makerAssetData = encodeERC20AssetData(erc20TokenA.address);
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerFeeAssetData: makerAssetData,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: new BigNumber(1),
            });
            // Set taker balance to 0 so that the asset must be received by the maker in order for the fill to succeed
            await erc20TokenA.setBalance(takerAddress, constants.ZERO_AMOUNT).awaitTransactionSuccessAsync({
                from: owner,
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should allow the maker to pay fees with an asset that received by the taker', async () => {
            const takerAssetData = encodeERC20AssetData(erc20TokenB.address);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerFeeAssetData: takerAssetData,
                makerFee: new BigNumber(1),
                takerFee: constants.ZERO_AMOUNT,
            });
            // Set maker balance to 0 so that the asset must be received by the taker in order for the fill to succeed
            await erc20TokenB.setBalance(makerAddress, constants.ZERO_AMOUNT).awaitTransactionSuccessAsync({
                from: owner,
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
    });
    describe('Testing exchange of ERC20 tokens with no return values', () => {
        before(async () => {
            await noReturnErc20Token
                .setBalance(makerAddress, constants.INITIAL_ERC20_BALANCE)
                .awaitTransactionSuccessAsync();
            await noReturnErc20Token
                .approve(erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE)
                .awaitTransactionSuccessAsync({ from: makerAddress });
        });
        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should revert if not sent by maker', async () => {
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.ExchangeInvalidContextError(
                ExchangeRevertErrors.ExchangeContextErrorCodes.InvalidMaker,
                orderHash,
                takerAddress,
            );
            const tx = exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should noop if makerAssetAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(0),
            });
            const tx = await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            expect(tx.logs.length).to.equal(0);
        });

        it('should noop if takerAssetAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: new BigNumber(0),
            });
            const tx = await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            expect(tx.logs.length).to.equal(0);
        });

        it('should be able to cancel an order', async () => {
            await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHash, OrderStatus.Cancelled);
            const tx = exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount.div(2), signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should log 1 event with correct arguments if cancelled successfully', async () => {
            const res = await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<ExchangeCancelEventArgs>;
            const logArgs = log.args;

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(signedOrder.makerAddress).to.be.equal(logArgs.senderAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should noop if already cancelled', async () => {
            await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            const tx = await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            expect(tx.logs.length).to.equal(0);
        });

        it('should noop if order is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const tx = await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            expect(tx.logs.length).to.equal(0);
        });
    });

    describe('cancelOrdersUpTo', () => {
        it('should fail to set orderEpoch less than current orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchange.cancelOrdersUpTo(orderEpoch).awaitTransactionSuccessAsync({ from: makerAddress });
            const lesserOrderEpoch = new BigNumber(0);
            const expectedError = new ExchangeRevertErrors.OrderEpochError(
                makerAddress,
                constants.NULL_ADDRESS,
                orderEpoch.plus(1),
            );
            const tx = exchange.cancelOrdersUpTo(lesserOrderEpoch).awaitTransactionSuccessAsync({ from: makerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should fail to set orderEpoch equal to existing orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchange.cancelOrdersUpTo(orderEpoch).awaitTransactionSuccessAsync({ from: makerAddress });
            const expectedError = new ExchangeRevertErrors.OrderEpochError(
                makerAddress,
                constants.NULL_ADDRESS,
                orderEpoch.plus(1),
            );
            const tx = exchange.cancelOrdersUpTo(orderEpoch).awaitTransactionSuccessAsync({ from: makerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should cancel only orders with a orderEpoch less than existing orderEpoch', async () => {
            // Cancel all transactions with a orderEpoch less than 2
            const orderEpoch = new BigNumber(1);
            await exchange.cancelOrdersUpTo(orderEpoch).awaitTransactionSuccessAsync({ from: makerAddress });

            // Create 4 orders with orderEpoch values: 0,1,2,3
            // Since we cancelled with orderEpoch=1, orders with orderEpoch<=1 will not be processed
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            const signedOrders = [
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    salt: new BigNumber(0),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    salt: new BigNumber(1),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    salt: new BigNumber(2),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    salt: new BigNumber(3),
                }),
            ];
            await exchange
                .batchFillOrdersNoThrow(
                    signedOrders,
                    signedOrders.map(order => order.takerAssetAmount),
                    signedOrders.map(order => order.signature),
                )
                .awaitTransactionSuccessAsync({ from: takerAddress });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const fillMakerAssetAmount = signedOrders[2].makerAssetAmount.plus(signedOrders[3].makerAssetAmount);
            const fillTakerAssetAmount = signedOrders[2].takerAssetAmount.plus(signedOrders[3].takerAssetAmount);
            const makerFee = signedOrders[2].makerFee.plus(signedOrders[3].makerFee);
            const takerFee = signedOrders[2].takerFee.plus(signedOrders[3].takerFee);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(fillMakerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].plus(fillTakerAssetAmount),
            );
            expect(newBalances[makerAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][feeToken.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(fillTakerAssetAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(fillMakerAssetAmount),
            );
            expect(newBalances[takerAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][feeToken.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][feeToken.address].plus(makerFee.plus(takerFee)),
            );
        });
    });

    describe('Testing Exchange of ERC721 Tokens', () => {
        it('should revert when maker does not own the token with id makerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721TakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[1];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf(makerAssetId).callAsync();
            expect(initialOwnerMakerAsset).to.be.bignumber.not.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf(takerAssetId).callAsync();
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.makerAssetData,
                new StringRevertError(RevertReason.TransferFailed).encode(),
            );
            const tx = exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when taker does not own the token with id takerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721MakerAssetIds[1];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf(makerAssetId).callAsync();
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf(takerAssetId).callAsync();
            expect(initialOwnerTakerAsset).to.be.bignumber.not.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.takerAssetData,
                new StringRevertError(RevertReason.TransferFailed).encode(),
            );
            const tx = exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when makerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(2),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf(makerAssetId).callAsync();
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf(takerAssetId).callAsync();
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.makerAssetData,
                new StringRevertError(RevertReason.InvalidAmount).encode(),
            );
            const tx = exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when takerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(500),
                makerAssetData: encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf(makerAssetId).callAsync();
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf(takerAssetId).callAsync();
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                signedOrder.takerAssetData,
                new StringRevertError(RevertReason.InvalidAmount).encode(),
            );
            const tx = exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert on partial fill', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                makerAssetData: encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: encodeERC20AssetData(defaultTakerAssetAddress),
            });
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const expectedError = new LibMathRevertErrors.RoundingError(
                takerAssetFillAmount,
                signedOrder.takerAssetAmount,
                signedOrder.makerAssetAmount,
            );
            const tx = exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('Testing exchange of multiple assets', () => {
        it('should allow multiple assets to be exchanged for a single asset', async () => {
            const makerAmounts = [new BigNumber(10), new BigNumber(20)];
            const makerNestedAssetData = [
                encodeERC20AssetData(erc20TokenA.address),
                encodeERC20AssetData(erc20TokenB.address),
            ];
            const makerAssetData = encodeMultiAssetData(makerAmounts, makerNestedAssetData);
            const makerAssetAmount = new BigNumber(1);
            const takerAssetData = encodeERC20AssetData(feeToken.address);
            const takerAssetAmount = new BigNumber(10);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should allow multiple assets to be exchanged for multiple assets', async () => {
            const makerAmounts = [new BigNumber(10), new BigNumber(20)];
            const makerNestedAssetData = [
                encodeERC20AssetData(erc20TokenA.address),
                encodeERC20AssetData(erc20TokenB.address),
            ];
            const makerAssetData = encodeMultiAssetData(makerAmounts, makerNestedAssetData);
            const makerAssetAmount = new BigNumber(1);
            const takerAmounts = [new BigNumber(10), new BigNumber(1)];
            const takerAssetId = erc721TakerAssetIds[0];
            const takerNestedAssetData = [
                encodeERC20AssetData(feeToken.address),
                encodeERC721AssetData(erc721Token.address, takerAssetId),
            ];
            const takerAssetData = encodeMultiAssetData(takerAmounts, takerNestedAssetData);
            const takerAssetAmount = new BigNumber(1);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should allow an order selling multiple assets to be partially filled', async () => {
            const makerAmounts = [new BigNumber(10), new BigNumber(20)];
            const makerNestedAssetData = [
                encodeERC20AssetData(erc20TokenA.address),
                encodeERC20AssetData(erc20TokenB.address),
            ];
            const makerAssetData = encodeMultiAssetData(makerAmounts, makerNestedAssetData);
            const makerAssetAmount = new BigNumber(30);
            const takerAssetData = encodeERC20AssetData(feeToken.address);
            const takerAssetAmount = new BigNumber(10);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });

            const takerAssetFillAmount = takerAssetAmount.dividedToIntegerBy(2);
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, { takerAssetFillAmount });
        });
        it('should allow an order buying multiple assets to be partially filled', async () => {
            const takerAmounts = [new BigNumber(10), new BigNumber(20)];
            const takerNestedAssetData = [
                encodeERC20AssetData(erc20TokenA.address),
                encodeERC20AssetData(erc20TokenB.address),
            ];
            const takerAssetData = encodeMultiAssetData(takerAmounts, takerNestedAssetData);
            const takerAssetAmount = new BigNumber(30);
            const makerAssetData = encodeERC20AssetData(feeToken.address);
            const makerAssetAmount = new BigNumber(10);
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = takerAssetAmount.dividedToIntegerBy(2);
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
        });
    });
    describe('Testing exchange of erc1155 assets', () => {
        it('should allow a single fungible erc1155 asset to be exchanged for another', async () => {
            // setup test parameters
            const makerAssetsToTransfer = erc1155FungibleTokens.slice(0, 1);
            const takerAssetsToTransfer = erc1155FungibleTokens.slice(1, 2);
            const makerValuesToTransfer = [new BigNumber(500)];
            const takerValuesToTransfer = [new BigNumber(200)];
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const receiverCallbackData = '0x';
            const makerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            // execute transfer
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
        });
        it('should allow a single non-fungible erc1155 asset to be exchanged for another', async () => {
            // setup test parameters
            const makerAssetsToTransfer = erc1155NonFungibleTokensOwnedByMaker.slice(0, 1);
            const takerAssetsToTransfer = erc1155NonFungibleTokensOwnedByTaker.slice(0, 1);
            const makerValuesToTransfer = [new BigNumber(1)];
            const takerValuesToTransfer = [new BigNumber(1)];
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const receiverCallbackData = '0x';
            const makerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
        });
        it('should allow multiple erc1155 assets to be exchanged for a single asset', async () => {
            // setup test parameters
            const makerAssetsToTransfer = erc1155FungibleTokens.slice(0, 3);
            const takerAssetsToTransfer = erc1155NonFungibleTokensOwnedByTaker.slice(0, 1);
            const makerValuesToTransfer = [new BigNumber(500), new BigNumber(700), new BigNumber(900)];
            const takerValuesToTransfer = [new BigNumber(1)];
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const receiverCallbackData = '0x';
            const makerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
        });
        it('should allow multiple erc1155 assets to be exchanged for multiple erc1155 assets, mixed fungible/non-fungible', async () => {
            // setup test parameters
            // the maker is trading two fungibles & one non-fungible
            // the taker is trading one fungible & two non-fungibles
            const makerFungibleAssetsToTransfer = erc1155FungibleTokens.slice(0, 2);
            const makerNonFungibleAssetsToTransfer = erc1155NonFungibleTokensOwnedByMaker.slice(0, 1);
            const makerAssetsToTransfer = makerFungibleAssetsToTransfer.concat(makerNonFungibleAssetsToTransfer);
            const takerFungibleAssetsToTransfer = erc1155FungibleTokens.slice(2, 3);
            const takerNonFungibleAssetsToTransfer = erc1155NonFungibleTokensOwnedByTaker.slice(0, 2);
            const takerAssetsToTransfer = takerFungibleAssetsToTransfer.concat(takerNonFungibleAssetsToTransfer);
            const makerValuesToTransfer = [new BigNumber(500), new BigNumber(700), new BigNumber(1)];
            const takerValuesToTransfer = [new BigNumber(900), new BigNumber(1), new BigNumber(1)];
            const makerAssetAmount = new BigNumber(1);
            const takerAssetAmount = new BigNumber(1);
            const receiverCallbackData = '0x';
            const makerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const takerAssetFillAmount = new BigNumber(1);
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
        });
        it('should allow an order exchanging erc1155 assets to be partially filled', async () => {
            // NOTICE:
            // As-per the eip1155 standard, there is no way to distinguish between a fungible or non-fungible erc1155 assets.
            // Hence we cannot force partial fills to fail if there is a non-fungible asset (which should be fill or kill).
            // We considered encoding whether an asset is fungible/non-fungible in erc1155 assetData, but
            // this is no more robust than a simple check by the client. Enforcing this at the smart contract level
            // is something that could be done with the upcoming static call proxy.
            //
            // setup test parameters
            // the maker is trading two fungibles and the taker is trading one fungible
            // note that this will result in a partial fill because the `takerAssetAmount`
            // less than the `takerAssetAmount` of the order.
            const takerAssetFillAmount = new BigNumber(6);
            const makerAssetsToTransfer = erc1155FungibleTokens.slice(0, 2);
            const takerAssetsToTransfer = erc1155FungibleTokens.slice(2, 3);
            const makerValuesToTransfer = [new BigNumber(500), new BigNumber(700)];
            const takerValuesToTransfer = [new BigNumber(900)];
            const makerAssetAmount = new BigNumber(10);
            const takerAssetAmount = new BigNumber(20);
            const receiverCallbackData = '0x';
            const makerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                makerAssetsToTransfer,
                makerValuesToTransfer,
                receiverCallbackData,
            );
            const takerAssetData = encodeERC1155AssetData(
                erc1155Contract.address,
                takerAssetsToTransfer,
                takerValuesToTransfer,
                receiverCallbackData,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerAssetData,
                makerAssetAmount,
                takerAssetAmount,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
        });
    });

    describe('Testing orders that utilize StaticCallProxy', () => {
        before(async () => {
            staticCallTarget = await TestStaticCallTargetContract.deployFrom0xArtifactAsync(
                proxyArtifacts.TestStaticCallTarget,
                provider,
                txDefaults,
                {},
            );
        });
        it('should revert if the staticcall is unsuccessful', async () => {
            const staticCallData = staticCallTarget.assertEvenNumber(new BigNumber(1)).getABIEncodedTransactionData();
            const assetData = encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                assetData,
                new StringRevertError(RevertReason.TargetNotEven).encode(),
            );
            const tx = exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });
        it('should fill the order if the staticcall is successful', async () => {
            const staticCallData = staticCallTarget
                .assertEvenNumber(constants.ZERO_AMOUNT)
                .getABIEncodedTransactionData();
            const assetData = encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should revert if the staticcall is unsuccessful using the MultiAssetProxy', async () => {
            const staticCallData = staticCallTarget.assertEvenNumber(new BigNumber(1)).getABIEncodedTransactionData();
            const staticCallAssetData = encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            const assetData = encodeMultiAssetData(
                [new BigNumber(1), new BigNumber(1)],
                [encodeERC20AssetData(defaultMakerAssetAddress), staticCallAssetData],
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
                orderHashHex,
                assetData,
                new StringRevertError(RevertReason.TargetNotEven).encode(),
            );
            const tx = exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            return expect(tx).to.revertWith(expectedError);
        });
        it('should fill the order is the staticcall is successful using the MultiAssetProxy', async () => {
            const staticCallData = staticCallTarget
                .assertEvenNumber(constants.ZERO_AMOUNT)
                .getABIEncodedTransactionData();
            const staticCallAssetData = encodeStaticCallAssetData(
                staticCallTarget.address,
                staticCallData,
                constants.KECCAK256_NULL,
            );
            const assetData = encodeMultiAssetData(
                [new BigNumber(1), new BigNumber(1)],
                [encodeERC20AssetData(defaultMakerAssetAddress), staticCallAssetData],
            );
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: assetData });
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
    });

    describe('getOrderInfo', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should return the correct orderInfo for an unfilled valid order', async () => {
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.Fillable;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a fully filled order', async () => {
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress);
        });
        it('should return the correct orderInfo for a partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await fillOrderWrapper.fillOrderAndAssertEffectsAsync(signedOrder, takerAddress, { takerAssetFillAmount });
        });
        it('should return the correct orderInfo for a cancelled and unfilled order', async () => {
            await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.Cancelled;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a cancelled and partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            await exchange.cancelOrder(signedOrder).awaitTransactionSuccessAsync({ from: makerAddress });
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.Cancelled;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and unfilled order', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.Expired;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.Expired;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and fully filled order', async () => {
            await exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount;
            // FULLY_FILLED takes precedence over EXPIRED
            const expectedOrderStatus = OrderStatus.FullyFilled;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an order with a makerAssetAmount of 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetAmount: new BigNumber(0) });
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.InvalidMakerAssetAmount;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an order with a takerAssetAmount of 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({ takerAssetAmount: new BigNumber(0) });
            const orderInfo = await exchange.getOrderInfo(signedOrder).callAsync();
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.InvalidTakerAssetAmount;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
