import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract, ExchangeWrapper } from '@0x/contracts-exchange';
import {
    chaiSetup,
    constants,
    ContractName,
    OrderFactory,
    provider,
    sendTransactionResult,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, ForwarderRevertErrors } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { artifacts, ForwarderContract, ForwarderTestFactory, ForwarderWrapper } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;

describe(ContractName.Forwarder, () => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let orderFeeRecipientAddress: string;
    let forwarderFeeRecipientAddress: string;
    let defaultMakerAssetAddress: string;
    let wethAssetData: string;

    let weth: DummyERC20TokenContract;
    let erc20Token: DummyERC20TokenContract;
    let secondErc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let forwarderContract: ForwarderContract;
    let wethContract: WETH9Contract;
    let forwarderWrapper: ForwarderWrapper;
    let exchangeWrapper: ExchangeWrapper;

    let orderWithoutFee: SignedOrder;
    let orderWithPercentageFee: SignedOrder;
    let orderWithWethFee: SignedOrder;
    let orderFactory: OrderFactory;
    let forwarderTestFactory: ForwarderTestFactory;
    let erc20Wrapper: ERC20Wrapper;
    let tx: TransactionReceiptWithDecodedLogs;

    let erc721MakerAssetIds: BigNumber[];
    let gasPrice: BigNumber;

    before(async () => {
        await blockchainLifecycle.startAsync();

        chainId = await providerUtils.getChainIdAsync(provider);

        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([
            owner,
            makerAddress,
            takerAddress,
            orderFeeRecipientAddress,
            forwarderFeeRecipientAddress,
        ] = accounts);

        const txHash = await web3Wrapper.sendTransactionAsync({ from: accounts[0], to: accounts[0], value: 0 });
        const transaction = await web3Wrapper.getTransactionByHashAsync(txHash);
        gasPrice = new BigNumber(transaction.gasPrice);

        const erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 2;
        [erc20Token, secondErc20Token] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );

        const erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        const erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];

        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(erc20Artifacts.WETH9, provider, txDefaults);
        weth = new DummyERC20TokenContract(wethContract.address, provider);
        erc20Wrapper.addDummyTokenContract(weth);

        wethAssetData = assetDataUtils.encodeERC20AssetData(wethContract.address);
        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            provider,
            txDefaults,
            new BigNumber(chainId),
        );
        exchangeWrapper = new ExchangeWrapper(exchangeInstance, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);

        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });

        defaultMakerAssetAddress = erc20Token.address;
        const defaultTakerAssetAddress = wethContract.address;
        const defaultOrderParams = {
            makerAddress,
            feeRecipientAddress: orderFeeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(200, DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(10, DECIMALS_DEFAULT),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            makerFee: Web3Wrapper.toBaseUnitAmount(0, DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(0, DECIMALS_DEFAULT),
            domain: {
                verifyingContractAddress: exchangeInstance.address,
                chainId,
            },
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        forwarderContract = await ForwarderContract.deployFrom0xArtifactAsync(
            artifacts.Forwarder,
            provider,
            txDefaults,
            exchangeInstance.address,
            wethAssetData,
        );
        forwarderWrapper = new ForwarderWrapper(forwarderContract, provider);

        await forwarderWrapper.approveMakerAssetProxyAsync(defaultOrderParams.makerAssetData, { from: takerAddress });
        erc20Wrapper.addTokenOwnerAddress(forwarderContract.address);

        forwarderTestFactory = new ForwarderTestFactory(
            forwarderWrapper,
            erc20Wrapper,
            forwarderContract.address,
            makerAddress,
            takerAddress,
            orderFeeRecipientAddress,
            forwarderFeeRecipientAddress,
            weth.address,
            gasPrice,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        orderWithoutFee = await orderFactory.newSignedOrderAsync();
        orderWithPercentageFee = await orderFactory.newSignedOrderAsync({
            takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
        });
        orderWithWethFee = await orderFactory.newSignedOrderAsync({
            takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
            takerFeeAssetData: wethAssetData,
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('constructor', () => {
        it('should revert if assetProxy is unregistered', async () => {
            const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
                exchangeArtifacts.Exchange,
                provider,
                txDefaults,
                new BigNumber(chainId),
            );

            const deployForwarder = (ForwarderContract.deployFrom0xArtifactAsync(
                artifacts.Forwarder,
                provider,
                txDefaults,
                exchangeInstance.address,
                wethAssetData,
            ) as any) as sendTransactionResult;

            expect(deployForwarder).to.revertWith(new ForwarderRevertErrors.UnregisteredAssetProxyError());
        });
    });
    describe('marketSellOrdersWithEth without extra fees', () => {
        it('should fill a single order without a taker fee', async () => {
            await forwarderTestFactory.marketSellTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token);
        });
        it('should fill multiple orders without taker fees', async () => {
            const secondOrderWithoutFee = await orderFactory.newSignedOrderAsync();
            const orders = [orderWithoutFee, secondOrderWithoutFee];
            await forwarderTestFactory.marketSellTestAsync(orders, new BigNumber(1.5), erc20Token);
        });
        it('should fill a single order with a percentage fee', async () => {
            await forwarderTestFactory.marketSellTestAsync([orderWithPercentageFee], new BigNumber(0.5), erc20Token);
        });
        it('should fill multiple orders with percentage fees', async () => {
            const secondOrderWithPercentageFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(2, DECIMALS_DEFAULT),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            const orders = [orderWithPercentageFee, secondOrderWithPercentageFee];
            await forwarderTestFactory.marketSellTestAsync(orders, new BigNumber(1.5), erc20Token);
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
            const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(takerAddress);

            // Execute test case
            tx = await forwarderWrapper.marketSellOrdersWithEthAsync([order], {
                value: ethValue,
                from: takerAddress,
            });

            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const totalEthSpent = gasPrice.times(tx.gasUsed);

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
            await forwarderTestFactory.marketSellTestAsync([orderWithWethFee], new BigNumber(0.5), erc20Token);
        });
        it('should fill multiple orders with WETH fees', async () => {
            const secondOrderWithPercentageFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(2, DECIMALS_DEFAULT),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            const orders = [orderWithWethFee, secondOrderWithPercentageFee];
            await forwarderTestFactory.marketSellTestAsync(orders, new BigNumber(1.5), erc20Token);
        });
        it('should refund remaining ETH if amount is greater than takerAssetAmount', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const ethValue = orderWithoutFee.takerAssetAmount.times(2);
            const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(takerAddress);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = orderWithoutFee.takerAssetAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
        it('should not fill orders with different makerAssetData than the first order', async () => {
            const firstOrderMakerAssetData = assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress);
            const erc20SignedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: firstOrderMakerAssetData,
            });

            const makerAssetId = erc721MakerAssetIds[0];
            const secondOrderMakerAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId);
            const erc721SignedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: secondOrderMakerAssetData,
            });

            const orders = [erc20SignedOrder, erc721SignedOrder];

            const revertError = new ForwarderRevertErrors.MakerAssetMismatchError(
                firstOrderMakerAssetData,
                secondOrderMakerAssetData,
            );
            await forwarderTestFactory.marketSellTestAsync(orders, new BigNumber(2), erc20Token, {
                revertError,
            });
        });
    });
    describe('marketSellOrdersWithEth with extra fees', () => {
        it('should fill the order and send fee to feeRecipient', async () => {
            await forwarderTestFactory.marketSellTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token, {
                forwarderFeePercentage: new BigNumber(2),
            });
        });
        it('should fail if the fee is set too high', async () => {
            const forwarderFeePercentage = new BigNumber(6);
            const revertError = new ForwarderRevertErrors.FeePercentageTooLargeError(
                ForwarderTestFactory.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, forwarderFeePercentage),
            );

            await forwarderTestFactory.marketSellTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token, {
                forwarderFeePercentage,
                revertError,
            });
        });
    });
    describe('marketBuyOrdersWithEth without extra fees', () => {
        it('should buy the exact amount of makerAsset in a single order', async () => {
            await forwarderTestFactory.marketBuyTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token);
        });
        it('should buy the exact amount of makerAsset in multiple orders', async () => {
            const secondOrderWithoutFee = await orderFactory.newSignedOrderAsync();
            const orders = [orderWithoutFee, secondOrderWithoutFee];
            await forwarderTestFactory.marketBuyTestAsync(orders, new BigNumber(1.5), erc20Token);
        });
        it('should buy the exact amount of makerAsset and return excess ETH', async () => {
            await forwarderTestFactory.marketBuyTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token, {
                ethValueAdjustment: new BigNumber(2),
            });
        });
        it('should buy the exact amount of makerAsset from a single order with a WETH fee', async () => {
            await forwarderTestFactory.marketBuyTestAsync([orderWithWethFee], new BigNumber(0.5), erc20Token);
        });
        it('should buy the exact amount of makerAsset from a single order with a percentage fee', async () => {
            await forwarderTestFactory.marketBuyTestAsync([orderWithPercentageFee], new BigNumber(0.5), erc20Token);
        });
        it('should revert if the amount of ETH sent is too low to fill the makerAssetAmount', async () => {
            const revertError = new ForwarderRevertErrors.CompleteFillFailedError();
            await forwarderTestFactory.marketBuyTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token, {
                ethValueAdjustment: new BigNumber(-2),
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
            await forwarderTestFactory.marketBuyTestAsync([erc721Order], new BigNumber(1), erc721Token, {
                makerAssetId,
            });
        });
        it('should buy an ERC721 asset and pay WETH fees from a single fee order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            const erc721orderWithWethFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerFee: Web3Wrapper.toBaseUnitAmount(1, DECIMALS_DEFAULT),
                takerFeeAssetData: wethAssetData,
            });
            await forwarderTestFactory.marketBuyTestAsync([erc721orderWithWethFee], new BigNumber(1), erc721Token, {
                makerAssetId,
            });
        });
        it('Should buy slightly greater MakerAsset when exchange rate is rounded', async () => {
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
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('30'),
                takerAssetAmount: new BigNumber('20'),
                makerAssetData: assetDataUtils.encodeERC20AssetData(erc20Token.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const desiredMakerAssetFillAmount = new BigNumber('5');
            const makerAssetFillAmount = new BigNumber('6');
            const ethValue = new BigNumber('4');

            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(takerAddress);

            // Execute test case
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, desiredMakerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            // Fetch end balances and construct expected outputs
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
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
            // Order taken from a transaction on mainnet that failed due to a rounding error.
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('268166666666666666666'),
                takerAssetAmount: new BigNumber('219090625878836371'),
                makerAssetData: assetDataUtils.encodeERC20AssetData(erc20Token.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const ordersWithoutFee = [orderWithoutFee];

            const erc20Balances = await erc20Wrapper.getBalancesAsync();
            const takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(takerAddress);

            // The taker will receive more than the desired amount of makerAsset due to rounding
            const desiredMakerAssetFillAmount = new BigNumber('5000000000000000000');
            const ethValue = new BigNumber('4084971271824171');
            const makerAssetFillAmount = ethValue
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            // Execute test case
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, desiredMakerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            // Fetch end balances and construct expected outputs
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
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
    describe('marketBuyOrdersWithEth with extra fees', () => {
        it('should buy the asset and send fee to feeRecipient', async () => {
            await forwarderTestFactory.marketBuyTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token, {
                forwarderFeePercentage: new BigNumber(2),
            });
        });
        it('should fail if the fee is set too high', async () => {
            const revertError = new ForwarderRevertErrors.FeePercentageTooLargeError(
                ForwarderTestFactory.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, new BigNumber(6)),
            );
            await forwarderTestFactory.marketBuyTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token, {
                forwarderFeePercentage: new BigNumber(6),
                revertError,
            });
        });
        it('should fail if there is not enough ETH remaining to pay the fee', async () => {
            const revertError = new ForwarderRevertErrors.InsufficientEthForFeeError();
            await forwarderTestFactory.marketBuyTestAsync([orderWithoutFee], new BigNumber(0.5), erc20Token, {
                ethValueAdjustment: new BigNumber(-2),
                forwarderFeePercentage: new BigNumber(2),
                revertError,
            });
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
