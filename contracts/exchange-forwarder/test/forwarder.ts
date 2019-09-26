import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract, ExchangeWrapper } from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    ContractName,
    expect,
    getLatestBlockTimestampAsync,
    OrderFactory,
    sendTransactionResult,
} from '@0x/contracts-test-utils';
import { assetDataUtils, ForwarderRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import {
    artifacts,
    ForwarderContract,
    ForwarderTestFactory,
    ForwarderWrapper,
    TestProtocolFeeCollectorContract,
} from '../src';

const DECIMALS_DEFAULT = 18;

blockchainTests(ContractName.Forwarder, env => {
    let owner: string;
    let makerAddress: string;
    let takerAddress: string;
    let orderFeeRecipientAddress: string;
    let forwarderFeeRecipientAddress: string;
    let defaultMakerAssetAddress: string;

    let weth: DummyERC20TokenContract;
    let erc20Token: DummyERC20TokenContract;
    let secondErc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let forwarderContract: ForwarderContract;
    let wethContract: WETH9Contract;
    let exchangeContract: ExchangeContract;
    let protocolFeeCollector: TestProtocolFeeCollectorContract;

    let forwarderWrapper: ForwarderWrapper;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;

    let orderFactory: OrderFactory;
    let forwarderTestFactory: ForwarderTestFactory;

    let chainId: number;
    let wethAssetData: string;
    let erc721MakerAssetIds: BigNumber[];

    const GAS_PRICE = new BigNumber(env.txDefaults.gasPrice || constants.DEFAULT_GAS_PRICE);
    const PROTOCOL_FEE_MULTIPLIER = new BigNumber(150);
    const PROTOCOL_FEE = GAS_PRICE.times(PROTOCOL_FEE_MULTIPLIER);

    before(async () => {
        // Set up addresses
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([
            owner,
            makerAddress,
            takerAddress,
            orderFeeRecipientAddress,
            forwarderFeeRecipientAddress,
        ] = accounts);

        // Set up Exchange
        chainId = await env.getChainIdAsync();
        exchangeContract = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(chainId),
        );
        exchangeWrapper = new ExchangeWrapper(exchangeContract);

        // Set up ERC20
        erc20Wrapper = new ERC20Wrapper(env.provider, usedAddresses, owner);
        [erc20Token, secondErc20Token] = await erc20Wrapper.deployDummyTokensAsync(2, constants.DUMMY_TOKEN_DECIMALS);
        const erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeContract.address, {
            from: owner,
        });

        // Set up WETH
        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(
            erc20Artifacts.WETH9,
            env.provider,
            env.txDefaults,
            {},
        );
        weth = new DummyERC20TokenContract(wethContract.address, env.provider);
        wethAssetData = assetDataUtils.encodeERC20AssetData(wethContract.address);
        erc20Wrapper.addDummyTokenContract(weth);
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        // Set up ERC721
        const erc721Wrapper = new ERC721Wrapper(env.provider, usedAddresses, owner);
        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        const erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeContract.address, {
            from: owner,
        });

        // Set up Protocol Fee Collector
        protocolFeeCollector = await TestProtocolFeeCollectorContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFeeCollector,
            env.provider,
            env.txDefaults,
            {},
            wethContract.address,
            erc20Proxy.address,
        );
        await exchangeContract.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(PROTOCOL_FEE_MULTIPLIER);
        await exchangeContract.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(
            protocolFeeCollector.address,
        );
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(protocolFeeCollector.address, {
            from: owner,
        });

        // Set defaults
        defaultMakerAssetAddress = erc20Token.address;
        const defaultOrderParams = {
            makerAddress,
            feeRecipientAddress: orderFeeRecipientAddress,
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(200, DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, DECIMALS_DEFAULT),
            makerFee: Web3Wrapper.toBaseUnitAmount(0, DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(0, DECIMALS_DEFAULT),
            exchangeAddress: exchangeContract.address,
            chainId,
        };

        // Set up Forwarder
        forwarderContract = await ForwarderContract.deployFrom0xArtifactAsync(
            artifacts.Forwarder,
            env.provider,
            env.txDefaults,
            {},
            exchangeContract.address,
            wethAssetData,
        );
        forwarderWrapper = new ForwarderWrapper(forwarderContract, env.provider);
        await forwarderWrapper.approveMakerAssetProxyAsync(defaultOrderParams.makerAssetData, { from: takerAddress });
        erc20Wrapper.addTokenOwnerAddress(forwarderContract.address);

        // Set up factories
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        forwarderTestFactory = new ForwarderTestFactory(
            exchangeWrapper,
            forwarderWrapper,
            erc20Wrapper,
            forwarderContract.address,
            makerAddress,
            takerAddress,
            protocolFeeCollector.address,
            orderFeeRecipientAddress,
            forwarderFeeRecipientAddress,
            weth.address,
            GAS_PRICE,
            PROTOCOL_FEE_MULTIPLIER,
        );
    });

    blockchainTests.resets('constructor', () => {
        it('should revert if assetProxy is unregistered', async () => {
            const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
                exchangeArtifacts.Exchange,
                env.provider,
                env.txDefaults,
                {},
                new BigNumber(chainId),
            );

            const deployForwarder = (ForwarderContract.deployFrom0xArtifactAsync(
                artifacts.Forwarder,
                env.provider,
                env.txDefaults,
                {},
                exchange.address,
                wethAssetData,
            ) as any) as sendTransactionResult;

            await expect(deployForwarder).to.revertWith(new ForwarderRevertErrors.UnregisteredAssetProxyError());
        });
    });
    blockchainTests.resets('marketSellOrdersWithEth without extra fees', () => {
        it('should fill a single order without a taker fee', async () => {
            const orderWithoutFee = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketSellTestAsync([orderWithoutFee], 0.78, erc20Token);
        });
        it('should fill multiple orders without taker fees', async () => {
            const firstOrder = await orderFactory.newSignedOrderAsync();
            const secondOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(285, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(21, DECIMALS_DEFAULT),
            });
            const orders = [firstOrder, secondOrder];
            await forwarderTestFactory.marketSellTestAsync(orders, 1.51, erc20Token);
        });
        it('should fill a single order with a percentage fee', async () => {
            const orderWithPercentageFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            await forwarderTestFactory.marketSellTestAsync([orderWithPercentageFee], 0.58, erc20Token);
        });
        it('should fill multiple orders with percentage fees', async () => {
            const firstOrder = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            const secondOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(190, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(31, DECIMALS_DEFAULT),
                takerFee: Web3Wrapper.toBaseUnitAmount(2, DECIMALS_DEFAULT),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            const orders = [firstOrder, secondOrder];
            await forwarderTestFactory.marketSellTestAsync(orders, 1.34, erc20Token);
        });
        it('should fail to fill an order with a percentage fee if the asset proxy is not yet approved', async () => {
            const unapprovedAsset = assetDataUtils.encodeERC20AssetData(secondErc20Token.address);
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetData: unapprovedAsset,
                takerFee: Web3Wrapper.toBaseUnitAmount(2, DECIMALS_DEFAULT),
                takerFeeAssetData: unapprovedAsset,
            });

            const ethValue = order.takerAssetAmount;
            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const takerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);

            // Execute test case
            const tx = await forwarderWrapper.marketSellOrdersWithEthAsync([order], {
                value: ethValue,
                from: takerAddress,
            });

            const takerEthBalanceAfter = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const totalEthSpent = GAS_PRICE.times(tx.gasUsed);

            // Validate test case
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress],
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress],
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address],
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fill a single order with a WETH fee', async () => {
            const orderWithWethFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: wethAssetData,
            });
            await forwarderTestFactory.marketSellTestAsync([orderWithWethFee], 0.13, erc20Token);
        });
        it('should fill multiple orders with WETH fees', async () => {
            const firstOrder = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: wethAssetData,
            });
            const secondOrderWithWethFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(33, DECIMALS_DEFAULT),
                takerFee: Web3Wrapper.toBaseUnitAmount(2, DECIMALS_DEFAULT),
                takerFeeAssetData: wethAssetData,
            });
            const orders = [firstOrder, secondOrderWithWethFee];
            await forwarderTestFactory.marketSellTestAsync(orders, 1.25, erc20Token);
        });
        it('should refund remaining ETH if amount is greater than takerAssetAmount', async () => {
            const order = await orderFactory.newSignedOrderAsync();
            const ethValue = order.takerAssetAmount.plus(PROTOCOL_FEE).plus(2);
            const takerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);

            const tx = await forwarderWrapper.marketSellOrdersWithEthAsync([order], {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = order.takerAssetAmount.plus(PROTOCOL_FEE).plus(GAS_PRICE.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
        it('should fail to fill orders with mismatched makerAssetData', async () => {
            const firstOrderMakerAssetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            const firstOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: firstOrderMakerAssetData,
            });

            const secondOrderMakerAssetData = assetDataUtils.encodeERC20AssetData(secondErc20Token.address);
            const secondOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: secondOrderMakerAssetData,
            });

            const orders = [firstOrder, secondOrder];

            const revertError = new ForwarderRevertErrors.MakerAssetMismatchError(
                firstOrderMakerAssetData,
                secondOrderMakerAssetData,
            );
            await forwarderTestFactory.marketSellTestAsync(orders, 2, erc20Token, {
                revertError,
            });
        });
        it('should fail to fill an order with a fee denominated in an asset other than makerAsset or WETH', async () => {
            const makerAssetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            const takerFeeAssetData = assetDataUtils.encodeERC20AssetData(secondErc20Token.address);

            const order = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerFeeAssetData,
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
            });

            const revertError = new ForwarderRevertErrors.UnsupportedFeeError(takerFeeAssetData);
            await forwarderTestFactory.marketSellTestAsync([order], 0.5, erc20Token, {
                revertError,
            });
        });
        it('should fill a partially-filled order without a taker fee', async () => {
            const order = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketSellTestAsync([order], 0.3, erc20Token);
            await forwarderTestFactory.marketSellTestAsync([order], 0.8, erc20Token);
        });
        it('should skip over an order with an invalid maker asset amount', async () => {
            const unfillableOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await orderFactory.newSignedOrderAsync();

            await forwarderTestFactory.marketSellTestAsync([unfillableOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over an order with an invalid taker asset amount', async () => {
            const unfillableOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await orderFactory.newSignedOrderAsync();

            await forwarderTestFactory.marketSellTestAsync([unfillableOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over an expired order', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const expiredOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const fillableOrder = await orderFactory.newSignedOrderAsync();

            await forwarderTestFactory.marketSellTestAsync([expiredOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over a fully filled order', async () => {
            const fullyFilledOrder = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketSellTestAsync([fullyFilledOrder], 1, erc20Token);

            const fillableOrder = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketSellTestAsync([fullyFilledOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over a cancelled order', async () => {
            const cancelledOrder = await orderFactory.newSignedOrderAsync();
            await exchangeWrapper.cancelOrderAsync(cancelledOrder, makerAddress);

            const fillableOrder = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketSellTestAsync([cancelledOrder, fillableOrder], 1.5, erc20Token);
        });
    });
    blockchainTests.resets('marketSellOrdersWithEth with extra fees', () => {
        it('should fill the order and send fee to feeRecipient', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(157, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(36, DECIMALS_DEFAULT),
            });
            await forwarderTestFactory.marketSellTestAsync([order], 0.67, erc20Token, {
                forwarderFeePercentage: new BigNumber(2),
            });
        });
        it('should fail if the fee is set too high', async () => {
            const order = await orderFactory.newSignedOrderAsync();
            const forwarderFeePercentage = new BigNumber(6);
            const revertError = new ForwarderRevertErrors.FeePercentageTooLargeError(
                ForwarderTestFactory.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, forwarderFeePercentage),
            );

            await forwarderTestFactory.marketSellTestAsync([order], 0.5, erc20Token, {
                forwarderFeePercentage,
                revertError,
            });
        });
    });
    blockchainTests.resets('marketBuyOrdersWithEth without extra fees', () => {
        it('should buy the exact amount of makerAsset in a single order', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(131, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(20, DECIMALS_DEFAULT),
            });
            await forwarderTestFactory.marketBuyTestAsync([order], 0.62, erc20Token);
        });
        it('should buy the exact amount of makerAsset in multiple orders', async () => {
            const firstOrder = await orderFactory.newSignedOrderAsync();
            const secondOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(77, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(11, DECIMALS_DEFAULT),
            });
            const orders = [firstOrder, secondOrder];
            await forwarderTestFactory.marketBuyTestAsync(orders, 1.96, erc20Token);
        });
        it('should buy the exact amount of makerAsset and return excess ETH', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(80, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, DECIMALS_DEFAULT),
            });
            await forwarderTestFactory.marketBuyTestAsync([order], 0.57, erc20Token, {
                ethValueAdjustment: 2,
            });
        });
        it('should buy the exact amount of makerAsset from a single order with a WETH fee', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(79, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(16, DECIMALS_DEFAULT),
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: wethAssetData,
            });
            await forwarderTestFactory.marketBuyTestAsync([order], 0.38, erc20Token);
        });
        it('should buy the exact amount of makerAsset from a single order with a percentage fee', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(80, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, DECIMALS_DEFAULT),
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            await forwarderTestFactory.marketBuyTestAsync([order], 0.52, erc20Token);
        });
        it('should revert if the amount of ETH sent is too low to fill the makerAssetAmount', async () => {
            const order = await orderFactory.newSignedOrderAsync();
            const revertError = new ForwarderRevertErrors.CompleteBuyFailedError(
                order.makerAssetAmount.times(0.5),
                constants.ZERO_AMOUNT,
            );

            await forwarderTestFactory.marketBuyTestAsync([order], 0.5, erc20Token, {
                ethValueAdjustment: -2,
                revertError,
            });
        });
        it('should buy an ERC721 asset from a single order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            const erc721Order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerFeeAssetData: wethAssetData,
            });
            await forwarderTestFactory.marketBuyTestAsync([erc721Order], 1, erc721Token, {
                makerAssetId,
            });
        });
        it('should buy an ERC721 asset and pay a WETH fee', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            const erc721orderWithWethFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: wethAssetData,
            });
            await forwarderTestFactory.marketBuyTestAsync([erc721orderWithWethFee], 1, erc721Token, {
                makerAssetId,
            });
        });
        it('should fail to fill an order with a fee denominated in an asset other than makerAsset or WETH', async () => {
            const makerAssetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
            const takerFeeAssetData = assetDataUtils.encodeERC20AssetData(secondErc20Token.address);

            const order = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                takerFeeAssetData,
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
            });

            const revertError = new ForwarderRevertErrors.UnsupportedFeeError(takerFeeAssetData);
            await forwarderTestFactory.marketBuyTestAsync([order], 0.5, erc20Token, {
                revertError,
            });
        });
        it('should fill a partially-filled order without a taker fee', async () => {
            const order = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketBuyTestAsync([order], 0.3, erc20Token);
            await forwarderTestFactory.marketBuyTestAsync([order], 0.8, erc20Token);
        });
        it('should skip over an order with an invalid maker asset amount', async () => {
            const unfillableOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await orderFactory.newSignedOrderAsync();

            await forwarderTestFactory.marketBuyTestAsync([unfillableOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over an order with an invalid taker asset amount', async () => {
            const unfillableOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await orderFactory.newSignedOrderAsync();

            await forwarderTestFactory.marketBuyTestAsync([unfillableOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over an expired order', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const expiredOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const fillableOrder = await orderFactory.newSignedOrderAsync();

            await forwarderTestFactory.marketBuyTestAsync([expiredOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over a fully filled order', async () => {
            const fullyFilledOrder = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketBuyTestAsync([fullyFilledOrder], 1, erc20Token);

            const fillableOrder = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketBuyTestAsync([fullyFilledOrder, fillableOrder], 1.5, erc20Token);
        });
        it('should skip over a cancelled order', async () => {
            const cancelledOrder = await orderFactory.newSignedOrderAsync();
            await exchangeWrapper.cancelOrderAsync(cancelledOrder, makerAddress);

            const fillableOrder = await orderFactory.newSignedOrderAsync();
            await forwarderTestFactory.marketBuyTestAsync([cancelledOrder, fillableOrder], 1.5, erc20Token);
        });
        it('Should buy slightly greater makerAsset when exchange rate is rounded', async () => {
            // The 0x Protocol contracts round the exchange rate in favor of the Maker.
            // In this case, the taker must round up how much they're going to spend, which
            // in turn increases the amount of MakerAsset being purchased.
            // Example:
            //  The taker wants to buy 5 units of the MakerAsset at a rate of 3M/2T.
            //  For every 2 units of TakerAsset, the taker will receive 3 units of MakerAsset.
            //  To purchase 5 units, the taker must spend 10/3 = 3.33 units of TakerAssset.
            //  However, the Taker can only spend whole units.
            //  Spending floor(10/3) = 3 units will yield a profit of Floor(3*3/2) = Floor(4.5) = 4 units of MakerAsset.
            //  Spending ceil(10/3) = 4 units will yield a profit of Floor(4*3/2) = 6 units of MakerAsset.
            //
            //  The forwarding contract will opt for the second option, which overbuys, to ensure the taker
            //  receives at least the amount of MakerAsset they requested.
            //
            // Construct test case using values from example above
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('30'),
                takerAssetAmount: new BigNumber('20'),
                makerAssetData: assetDataUtils.encodeERC20AssetData(erc20Token.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const desiredMakerAssetFillAmount = new BigNumber('5');
            const makerAssetFillAmount = new BigNumber('6');
            const primaryTakerAssetFillAmount = new BigNumber('4');
            const ethValue = primaryTakerAssetFillAmount.plus(PROTOCOL_FEE);

            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const takerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);

            // Execute test case
            const tx = await forwarderWrapper.marketBuyOrdersWithEthAsync([order], desiredMakerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            // Fetch end balances and construct expected outputs
            const takerEthBalanceAfter = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const totalEthSpent = ethValue.plus(GAS_PRICE.times(tx.gasUsed));
            // Validate test case
            expect(makerAssetFillAmount).to.be.bignumber.greaterThan(desiredMakerAssetFillAmount);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('Should buy slightly greater MakerAsset when exchange rate is rounded (Regression Test)', async () => {
            // Disable protocol fees for regression test
            await exchangeContract.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(constants.NULL_ADDRESS);
            // Order taken from a transaction on mainnet that failed due to a rounding error.
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('268166666666666666666'),
                takerAssetAmount: new BigNumber('219090625878836371'),
                makerAssetData: assetDataUtils.encodeERC20AssetData(erc20Token.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });

            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const takerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);

            // The taker will receive more than the desired amount of makerAsset due to rounding
            const desiredMakerAssetFillAmount = new BigNumber('5000000000000000000');
            const ethValue = new BigNumber('4084971271824171');
            const makerAssetFillAmount = ethValue
                .times(order.makerAssetAmount)
                .dividedToIntegerBy(order.takerAssetAmount);
            // Execute test case
            const tx = await forwarderWrapper.marketBuyOrdersWithEthAsync([order], desiredMakerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            // Fetch end balances and construct expected outputs
            const takerEthBalanceAfter = await env.web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(GAS_PRICE.times(tx.gasUsed));
            // Validate test case
            expect(makerAssetFillAmount).to.be.bignumber.greaterThan(desiredMakerAssetFillAmount);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });
    blockchainTests.resets('marketBuyOrdersWithEth with extra fees', () => {
        it('should buy the asset and send fee to feeRecipient', async () => {
            const order = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(125, DECIMALS_DEFAULT),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(11, DECIMALS_DEFAULT),
            });
            await forwarderTestFactory.marketBuyTestAsync([order], 0.33, erc20Token, {
                forwarderFeePercentage: new BigNumber(2),
            });
        });
        it('should fail if the fee is set too high', async () => {
            const order = await orderFactory.newSignedOrderAsync();
            const revertError = new ForwarderRevertErrors.FeePercentageTooLargeError(
                ForwarderTestFactory.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, new BigNumber(6)),
            );
            await forwarderTestFactory.marketBuyTestAsync([order], 0.5, erc20Token, {
                forwarderFeePercentage: new BigNumber(6),
                revertError,
            });
        });
        it('should fail if there is not enough ETH remaining to pay the fee', async () => {
            const order = await orderFactory.newSignedOrderAsync();
            const forwarderFeePercentage = new BigNumber(2);
            const ethFee = ForwarderTestFactory.getPercentageOfValue(
                order.takerAssetAmount.times(0.5).plus(PROTOCOL_FEE),
                forwarderFeePercentage,
            );

            const revertError = new ForwarderRevertErrors.InsufficientEthForFeeError(ethFee, ethFee.minus(1));

            // -2 to compensate for the extra 1 wei added in ForwarderTestFactory to account for rounding
            await forwarderTestFactory.marketBuyTestAsync([order], 0.5, erc20Token, {
                ethValueAdjustment: -2,
                forwarderFeePercentage,
                revertError,
            });
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
