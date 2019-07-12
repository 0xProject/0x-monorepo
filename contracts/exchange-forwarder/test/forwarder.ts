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
// const MAX_WETH_FILL_PERCENTAGE = 95;

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
    let erc20TokenA: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let forwarderContract: ForwarderContract;
    let wethContract: WETH9Contract;
    let forwarderWrapper: ForwarderWrapper;
    let exchangeWrapper: ExchangeWrapper;

    let orderWithoutFee: SignedOrder;
    let orderWithPercentageFee: SignedOrder;
    let orderWithWethFee: SignedOrder;
    let orderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let tx: TransactionReceiptWithDecodedLogs;

    let erc721MakerAssetIds: BigNumber[];
    let takerEthBalanceBefore: BigNumber;
    // let feePercentage: BigNumber;
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

        const numDummyErc20ToDeploy = 1;
        [erc20TokenA] = await erc20Wrapper.deployDummyTokensAsync(
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

        defaultMakerAssetAddress = erc20TokenA.address;
        const defaultTakerAssetAddress = wethContract.address;
        const defaultOrderParams = {
            makerAddress,
            feeRecipientAddress: orderFeeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
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
            wethAssetData,
        );
        forwarderContract = new ForwarderContract(forwarderInstance.address, provider);
        forwarderWrapper = new ForwarderWrapper(forwarderContract, provider);
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
        orderWithPercentageFee = await orderFactory.newSignedOrderAsync({
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
        });
        orderWithWethFee = await orderFactory.newSignedOrderAsync({
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(wethContract.address),
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
                    wethAssetData,
                ) as any) as sendTransactionResult,
                RevertReason.UnregisteredAssetProxy,
            );
        });
    });
    describe('marketSellOrdersWithEth without extra fees', () => {
        it('should fill a single order without a taker fee', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
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
        it('should fill multiple orders without taker fees', async () => {
            const secondOrderWithoutFee = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [orderWithoutFee, secondOrderWithoutFee];
            const ethValue = ordersWithoutFee[0].takerAssetAmount.plus(
                ordersWithoutFee[1].takerAssetAmount.dividedToIntegerBy(2),
            );

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
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
        it('should fill a single order with a percentage-based fee', async () => {
            const ordersWithFee = [orderWithPercentageFee];
            const ethValue = orderWithPercentageFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithPercentageFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithPercentageFee.takerAssetAmount);
            const takerFeeAmount = primaryTakerAssetFillAmount
                .times(orderWithPercentageFee.takerFee)
                .dividedToIntegerBy(orderWithPercentageFee.takerAssetAmount);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount).minus(takerFeeAmount),
            );
            expect(newBalances[orderFeeRecipientAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[orderFeeRecipientAddress][defaultMakerAssetAddress].plus(takerFeeAmount),
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
        it('should fill multiple orders with percentage-based fees', async () => {
            const secondOrderWithPercentageFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), DECIMALS_DEFAULT),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            const ordersWithFee = [orderWithPercentageFee, secondOrderWithPercentageFee];
            const ethValue = ordersWithFee[0].takerAssetAmount.plus(
                ordersWithFee[1].takerAssetAmount.dividedToIntegerBy(2),
            );

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const firstTakerAssetFillAmount = ordersWithFee[0].takerAssetAmount;
            const secondTakerAssetFillAmount = primaryTakerAssetFillAmount.minus(firstTakerAssetFillAmount);

            const makerAssetFillAmount = ordersWithFee[0].makerAssetAmount.plus(
                ordersWithFee[1].makerAssetAmount
                    .times(secondTakerAssetFillAmount)
                    .dividedToIntegerBy(ordersWithFee[1].takerAssetAmount),
            );
            const firstTakerFeeAmount = firstTakerAssetFillAmount
                .times(orderWithPercentageFee.takerFee)
                .dividedToIntegerBy(orderWithPercentageFee.takerAssetAmount);
            const secondTakerFeeAmount = secondTakerAssetFillAmount
                .times(secondOrderWithPercentageFee.takerFee)
                .dividedToIntegerBy(secondOrderWithPercentageFee.takerAssetAmount);
            const takerFeeAmount =  firstTakerFeeAmount.plus(secondTakerFeeAmount);

            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount).minus(takerFeeAmount),
            );
            expect(newBalances[orderFeeRecipientAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[orderFeeRecipientAddress][defaultMakerAssetAddress].plus(takerFeeAmount),
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
        it('should refund remaining ETH if amount is greater than takerAssetAmount', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const ethValue = orderWithoutFee.takerAssetAmount.times(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = orderWithoutFee.takerAssetAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
        // it('should not fill orders with different makerAssetData than the first order', async () => {
        //     const makerAssetId = erc721MakerAssetIds[0];
        //     const erc721SignedOrder = await orderFactory.newSignedOrderAsync({
        //         makerAssetAmount: new BigNumber(1),
        //         makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
        //     });
        //     const erc20SignedOrder = await orderFactory.newSignedOrderAsync();
        //     const ordersWithoutFee = [erc20SignedOrder, erc721SignedOrder];
        //     const ethValue = erc20SignedOrder.takerAssetAmount.plus(erc721SignedOrder.takerAssetAmount);
        //
        //     tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, {
        //         value: ethValue,
        //         from: takerAddress,
        //     });
        //     const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
        //     const totalEthSpent = erc20SignedOrder.takerAssetAmount.plus(gasPrice.times(tx.gasUsed));
        //
        //     expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        // });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
