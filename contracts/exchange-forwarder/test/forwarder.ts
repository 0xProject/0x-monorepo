import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract, ExchangeWrapper } from '@0x/contracts-exchange';
import {
    chaiSetup,
    constants,
    ContractName,
    ERC20BalancesByOwner,
    expectContractCreationFailedAsync,
    expectTransactionFailedAsync,
    OrderFactory,
    provider,
    sendTransactionResult,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { artifacts, ForwarderContract, ForwarderWrapper } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;
const MAX_WETH_FILL_PERCENTAGE = 95;

describe(ContractName.Forwarder, () => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let defaultMakerAssetAddress: string;
    let zrxAssetData: string;
    let wethAssetData: string;

    let weth: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc20TokenA: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let forwarderContract: ForwarderContract;
    let wethContract: WETH9Contract;
    let forwarderWrapper: ForwarderWrapper;
    let exchangeWrapper: ExchangeWrapper;

    let orderWithoutFee: SignedOrder;
    let orderWithFee: SignedOrder;
    let feeOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let tx: TransactionReceiptWithDecodedLogs;

    let erc721MakerAssetIds: BigNumber[];
    let takerEthBalanceBefore: BigNumber;
    let feePercentage: BigNumber;
    let gasPrice: BigNumber;

    before(async () => {
        await blockchainLifecycle.startAsync();

        chainId = await providerUtils.getChainIdAsync(provider);

        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        const txHash = await web3Wrapper.sendTransactionAsync({ from: accounts[0], to: accounts[0], value: 0 });
        const transaction = await web3Wrapper.getTransactionByHashAsync(txHash);
        gasPrice = new BigNumber(transaction.gasPrice);

        const erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
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
        zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
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

        defaultMakerAssetAddress = erc20TokenA.address;
        const defaultTakerAssetAddress = wethContract.address;
        const defaultOrderParams = {
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
            domain: {
                verifyingContractAddress: exchangeInstance.address,
                chainId,
            },
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        const forwarderInstance = await ForwarderContract.deployFrom0xArtifactAsync(
            artifacts.Forwarder,
            provider,
            txDefaults,
            exchangeInstance.address,
            zrxAssetData,
            wethAssetData,
        );
        forwarderContract = new ForwarderContract(forwarderInstance.address, provider);
        forwarderWrapper = new ForwarderWrapper(forwarderContract, provider);
        const zrxDepositAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 18);
        await web3Wrapper.awaitTransactionSuccessAsync(
            await zrxToken.transfer.sendTransactionAsync(forwarderContract.address, zrxDepositAmount),
        );
        erc20Wrapper.addTokenOwnerAddress(forwarderInstance.address);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        erc20Balances = await erc20Wrapper.getBalancesAsync();
        takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
        orderWithoutFee = await orderFactory.newSignedOrderAsync();
        feeOrder = await orderFactory.newSignedOrderAsync({
            makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        });
        orderWithFee = await orderFactory.newSignedOrderAsync({
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
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
            return expectContractCreationFailedAsync(
                (ForwarderContract.deployFrom0xArtifactAsync(
                    artifacts.Forwarder,
                    provider,
                    txDefaults,
                    exchangeInstance.address,
                    zrxAssetData,
                    wethAssetData,
                ) as any) as sendTransactionResult,
                RevertReason.UnregisteredAssetProxy,
            );
        });
    });
    describe('marketSellOrdersWithEth without extra fees', () => {
        it('should fill a single order', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

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
        it('should fill multiple orders', async () => {
            const secondOrderWithoutFee = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [orderWithoutFee, secondOrderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = ordersWithoutFee[0].takerAssetAmount.plus(
                ordersWithoutFee[1].takerAssetAmount.dividedToIntegerBy(2),
            );

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const firstTakerAssetFillAmount = ordersWithoutFee[0].takerAssetAmount;
            const secondTakerAssetFillAmount = primaryTakerAssetFillAmount.minus(firstTakerAssetFillAmount);

            const makerAssetFillAmount = ordersWithoutFee[0].makerAssetAmount.plus(
                ordersWithoutFee[1].makerAssetAmount
                    .times(secondTakerAssetFillAmount)
                    .dividedToIntegerBy(ordersWithoutFee[1].takerAssetAmount),
            );
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
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
        it('should fill the order and pay ZRX fees from a single feeOrder', async () => {
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            const ethValue = orderWithFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const feeAmount = ForwarderWrapper.getPercentageOfValue(
                orderWithFee.takerFee.dividedToIntegerBy(2),
                MAX_WETH_FILL_PERCENTAGE,
            );
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const totalEthSpent = primaryTakerAssetFillAmount
                .plus(wethSpentOnFeeOrders)
                .plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fill the orders and pay ZRX from multiple feeOrders', async () => {
            const ordersWithFee = [orderWithFee];
            const ethValue = orderWithFee.takerAssetAmount;
            const makerAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
            const makerAssetAmount = orderWithFee.takerFee.dividedToIntegerBy(2);
            const takerAssetAmount = feeOrder.takerAssetAmount
                .times(makerAssetAmount)
                .dividedToIntegerBy(feeOrder.makerAssetAmount);

            const firstFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const secondFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const feeOrders = [firstFeeOrder, secondFeeOrder];

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const feeAmount = ForwarderWrapper.getPercentageOfValue(orderWithFee.takerFee, MAX_WETH_FILL_PERCENTAGE);
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const totalEthSpent = primaryTakerAssetFillAmount
                .plus(wethSpentOnFeeOrders)
                .plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fill the order when token is ZRX with fees', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const totalEthSpent = ethValue.plus(gasPrice.times(tx.gasUsed));
            const takerFeePaid = orderWithFee.takerFee.dividedToIntegerBy(2);
            const makerFeePaid = orderWithFee.makerFee.dividedToIntegerBy(2);

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFillAmount).minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(makerAssetFillAmount).minus(takerFeePaid),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(ethValue),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[forwarderContract.address][zrxToken.address],
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should refund remaining ETH if amount is greater than takerAssetAmount', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithoutFee.takerAssetAmount.times(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = orderWithoutFee.takerAssetAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
        it('should revert if ZRX cannot be fully repurchased', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            feeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const feeOrders = [feeOrder];
            const ethValue = orderWithFee.takerAssetAmount;
            return expectTransactionFailedAsync(
                forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                    value: ethValue,
                    from: takerAddress,
                }),
                RevertReason.CompleteFillFailed,
            );
        });
        it('should not fill orders with different makerAssetData than the first order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            const erc721SignedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
            });
            const erc20SignedOrder = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [erc20SignedOrder, erc721SignedOrder];
            const feeOrders: SignedOrder[] = [];
            const ethValue = erc20SignedOrder.takerAssetAmount.plus(erc721SignedOrder.takerAssetAmount);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = erc20SignedOrder.takerAssetAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
    });
    describe('marketSellOrdersWithEth with extra fees', () => {
        it('should fill the order and send fee to feeRecipient', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithoutFee.takerAssetAmount.div(2);

            const baseFeePercentage = 2;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                {
                    value: ethValue,
                    from: takerAddress,
                },
                { feePercentage, feeRecipient: feeRecipientAddress },
            );
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const ethSpentOnFee = ForwarderWrapper.getPercentageOfValue(primaryTakerAssetFillAmount, baseFeePercentage);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(ethSpentOnFee).plus(gasPrice.times(tx.gasUsed));

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
            expect(feeRecipientEthBalanceAfter).to.be.bignumber.equal(feeRecipientEthBalanceBefore.plus(ethSpentOnFee));
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fail if the fee is set too high', async () => {
            const ethValue = orderWithoutFee.takerAssetAmount.div(2);
            const baseFeePercentage = 6;
            feePercentage = ForwarderWrapper.getPercentageOfValue(ethValue, baseFeePercentage);
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            await expectTransactionFailedAsync(
                forwarderWrapper.marketSellOrdersWithEthAsync(
                    ordersWithoutFee,
                    feeOrders,
                    { from: takerAddress, value: ethValue, gasPrice },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.FeePercentageTooLarge,
            );
        });
        it('should fail if there is not enough ETH remaining to pay the fee', async () => {
            const ethValue = orderWithoutFee.takerAssetAmount.div(2);
            const baseFeePercentage = 5;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            await expectTransactionFailedAsync(
                forwarderWrapper.marketSellOrdersWithEthAsync(
                    ordersWithFee,
                    feeOrders,
                    { from: takerAddress, value: ethValue, gasPrice },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.InsufficientEthRemaining,
            );
        });
    });
    describe('marketBuyOrdersWithEth without extra fees', () => {
        it('should buy the exact amount of makerAsset in a single order', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

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
        it('should buy the exact amount of makerAsset in multiple orders', async () => {
            const secondOrderWithoutFee = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [orderWithoutFee, secondOrderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = ordersWithoutFee[0].makerAssetAmount.plus(
                ordersWithoutFee[1].makerAssetAmount.dividedToIntegerBy(2),
            );
            const ethValue = ordersWithoutFee[0].takerAssetAmount.plus(
                ordersWithoutFee[1].takerAssetAmount.dividedToIntegerBy(2),
            );

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

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
        it('should buy the exact amount of makerAsset and return excess ETH', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount;

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue.dividedToIntegerBy(2);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

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
        it('should buy the exact amount of makerAsset and pay ZRX from feeOrders', async () => {
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithFee.takerAssetAmount;

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = orderWithFee.takerAssetAmount.dividedToIntegerBy(2);
            const feeAmount = orderWithFee.takerFee.dividedToIntegerBy(2);
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const totalEthSpent = primaryTakerAssetFillAmount
                .plus(wethSpentOnFeeOrders)
                .plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy slightly greater than makerAssetAmount when buying ZRX', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithFee.takerAssetAmount;
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getWethForFeeOrders(
                makerAssetFillAmount,
                ordersWithFee,
            );
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            const makerAssetFilledAmount = orderWithFee.makerAssetAmount
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const takerFeePaid = orderWithFee.takerFee
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const makerFeePaid = orderWithFee.makerFee
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const totalZrxPurchased = makerAssetFilledAmount.minus(takerFeePaid);
            // Up to 1 wei worth of ZRX will be overbought per order
            const maxOverboughtZrx = new BigNumber(1)
                .times(orderWithFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);

            expect(totalZrxPurchased).to.be.bignumber.gte(makerAssetFillAmount);
            expect(totalZrxPurchased).to.be.bignumber.lte(makerAssetFillAmount.plus(maxOverboughtZrx));
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFilledAmount).minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(totalZrxPurchased),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[forwarderContract.address][zrxToken.address],
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should revert if the amount of ETH sent is too low to fill the makerAssetAmount', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(4);
            return expectTransactionFailedAsync(
                forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                    value: ethValue,
                    from: takerAddress,
                }),
                RevertReason.CompleteFillFailed,
            );
        });
        it('should buy an ERC721 asset from a single order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = new BigNumber(1);
            const ethValue = orderWithFee.takerAssetAmount;

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                from: takerAddress,
                value: ethValue,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            expect(newOwner).to.be.bignumber.equal(takerAddress);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should revert if buying an ERC721 asset when later orders contain different makerAssetData', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
            });
            const differentMakerAssetDataOrder = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [orderWithoutFee, differentMakerAssetDataOrder];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = new BigNumber(1).plus(differentMakerAssetDataOrder.makerAssetAmount);
            const ethValue = orderWithFee.takerAssetAmount;
            return expectTransactionFailedAsync(
                forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                    value: ethValue,
                    from: takerAddress,
                }),
                RevertReason.CompleteFillFailed,
            );
        });
        it('should buy an ERC721 asset and pay ZRX fees from a single fee order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            const makerAssetFillAmount = orderWithFee.makerAssetAmount;
            const primaryTakerAssetFillAmount = orderWithFee.takerAssetAmount;
            const feeAmount = orderWithFee.takerFee;
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const ethValue = primaryTakerAssetFillAmount.plus(wethSpentOnFeeOrders);

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const totalEthSpent = ethValue.plus(gasPrice.times(tx.gasUsed));

            expect(newOwner).to.be.bignumber.equal(takerAddress);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy an ERC721 asset and pay ZRX fees from multiple fee orders', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const makerAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
            const makerAssetAmount = orderWithFee.takerFee.dividedToIntegerBy(2);
            const takerAssetAmount = feeOrder.takerAssetAmount
                .times(makerAssetAmount)
                .dividedToIntegerBy(feeOrder.makerAssetAmount);

            const firstFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const secondFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const feeOrders = [firstFeeOrder, secondFeeOrder];

            const makerAssetFillAmount = orderWithFee.makerAssetAmount;
            const primaryTakerAssetFillAmount = orderWithFee.takerAssetAmount;
            const feeAmount = orderWithFee.takerFee;
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const ethValue = primaryTakerAssetFillAmount.plus(wethSpentOnFeeOrders);

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const totalEthSpent = ethValue.plus(gasPrice.times(tx.gasUsed));

            expect(newOwner).to.be.bignumber.equal(takerAddress);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
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
                makerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const desiredMakerAssetFillAmount = new BigNumber('5');
            const makerAssetFillAmount = new BigNumber('6');
            const ethValue = new BigNumber('4');
            // Execute test case
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                desiredMakerAssetFillAmount,
                {
                    value: ethValue,
                    from: takerAddress,
                },
            );
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
        it('Should buy slightly greater MakerAsset when exchange rate is rounded, and MakerAsset is ZRX', async () => {
            // See the test case above for a detailed description of this case.
            // The difference here is that the MakerAsset is ZRX. We expect the same result as above,
            // but this tests a different code path.
            //
            // Construct test case using values from example above
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('30'),
                takerAssetAmount: new BigNumber('20'),
                makerAssetData: zrxAssetData,
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const desiredMakerAssetFillAmount = new BigNumber('5');
            const makerAssetFillAmount = new BigNumber('6');
            const ethValue = new BigNumber('4');
            // Execute test case
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                desiredMakerAssetFillAmount,
                {
                    value: ethValue,
                    from: takerAddress,
                },
            );
            // Fetch end balances and construct expected outputs
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            // Validate test case
            expect(makerAssetFillAmount).to.be.bignumber.greaterThan(desiredMakerAssetFillAmount);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('Should buy slightly greater MakerAsset when exchange rate is rounded (Regression Test)', async () => {
            // Order taken from a transaction on mainnet that failed due to a rounding error.
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('268166666666666666666'),
                takerAssetAmount: new BigNumber('219090625878836371'),
                makerAssetData: assetDataUtils.encodeERC20AssetData(erc20TokenA.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            // The taker will receive more than the desired amount of makerAsset due to rounding
            const desiredMakerAssetFillAmount = new BigNumber('5000000000000000000');
            const ethValue = new BigNumber('4084971271824171');
            const makerAssetFillAmount = ethValue
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            // Execute test case
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                desiredMakerAssetFillAmount,
                {
                    value: ethValue,
                    from: takerAddress,
                },
            );
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
        it('Should buy slightly greater MakerAsset when exchange rate is rounded, and MakerAsset is ZRX (Regression Test)', async () => {
            // Order taken from a transaction on mainnet that failed due to a rounding error.
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('268166666666666666666'),
                takerAssetAmount: new BigNumber('219090625878836371'),
                makerAssetData: zrxAssetData,
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            // The taker will receive more than the desired amount of makerAsset due to rounding
            const desiredMakerAssetFillAmount = new BigNumber('5000000000000000000');
            const ethValue = new BigNumber('4084971271824171');
            const makerAssetFillAmount = ethValue
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            // Execute test case
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                desiredMakerAssetFillAmount,
                {
                    value: ethValue,
                    from: takerAddress,
                },
            );
            // Fetch end balances and construct expected outputs
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            // Validate test case
            expect(makerAssetFillAmount).to.be.bignumber.greaterThan(desiredMakerAssetFillAmount);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('Should buy correct MakerAsset when exchange rate is NOT rounded, and MakerAsset is ZRX (Regression Test)', async () => {
            // An extra unit of TakerAsset was sent to the exchange contract to account for rounding errors, in Forwarder v1.
            // Specifically, the takerFillAmount was calculated using Floor(desiredMakerAmount * exchangeRate) + 1
            // We have since changed this to be Ceil(desiredMakerAmount * exchangeRate)
            // These calculations produce different results when `desiredMakerAmount * exchangeRate` is an integer.
            //
            // This test verifies that `ceil` is sufficient:
            //  Let TakerAssetAmount = MakerAssetAmount * 2
            //  -> exchangeRate = TakerAssetAmount / MakerAssetAmount = (2*MakerAssetAmount)/MakerAssetAmount = 2
            //  .: desiredMakerAmount * exchangeRate is an integer.
            //
            // Construct test case using values from example above
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber('30'),
                takerAssetAmount: new BigNumber('60'),
                makerAssetData: zrxAssetData,
                takerAssetData: assetDataUtils.encodeERC20AssetData(weth.address),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = new BigNumber('5');
            const ethValue = new BigNumber('10');
            // Execute test case
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
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
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });
    describe('marketBuyOrdersWithEth with extra fees', () => {
        it('should buy an asset and send fee to feeRecipient', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount;

            const baseFeePercentage = 2;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                makerAssetFillAmount,
                {
                    value: ethValue,
                    from: takerAddress,
                },
                { feePercentage, feeRecipient: feeRecipientAddress },
            );
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);
            const ethSpentOnFee = ForwarderWrapper.getPercentageOfValue(primaryTakerAssetFillAmount, baseFeePercentage);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(ethSpentOnFee).plus(gasPrice.times(tx.gasUsed));

            expect(feeRecipientEthBalanceAfter).to.be.bignumber.equal(feeRecipientEthBalanceBefore.plus(ethSpentOnFee));
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
        it('should fail if the fee is set too high', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount;

            const baseFeePercentage = 6;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            await expectTransactionFailedAsync(
                forwarderWrapper.marketBuyOrdersWithEthAsync(
                    ordersWithoutFee,
                    feeOrders,
                    makerAssetFillAmount,
                    {
                        value: ethValue,
                        from: takerAddress,
                    },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.FeePercentageTooLarge,
            );
        });
        it('should fail if there is not enough ETH remaining to pay the fee', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);

            const baseFeePercentage = 2;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            await expectTransactionFailedAsync(
                forwarderWrapper.marketBuyOrdersWithEthAsync(
                    ordersWithoutFee,
                    feeOrders,
                    makerAssetFillAmount,
                    {
                        value: ethValue,
                        from: takerAddress,
                    },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.InsufficientEthRemaining,
            );
        });
    });
    describe('withdrawAsset', () => {
        it('should allow owner to withdraw ERC20 tokens', async () => {
            const zrxWithdrawAmount = erc20Balances[forwarderContract.address][zrxToken.address];
            await forwarderWrapper.withdrawAssetAsync(zrxAssetData, zrxWithdrawAmount, { from: owner });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[owner][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[owner][zrxToken.address].plus(zrxWithdrawAmount),
            );
            expect(newBalances[forwarderContract.address][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[forwarderContract.address][zrxToken.address].minus(zrxWithdrawAmount),
            );
        });
        it('should revert if not called by owner', async () => {
            const zrxWithdrawAmount = erc20Balances[forwarderContract.address][zrxToken.address];
            await expectTransactionFailedAsync(
                forwarderWrapper.withdrawAssetAsync(zrxAssetData, zrxWithdrawAmount, { from: makerAddress }),
                RevertReason.OnlyContractOwner,
            );
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
