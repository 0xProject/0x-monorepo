import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { ExchangeContract, ExchangeWrapper } from '@0x/contracts-exchange';
import {
    chaiSetup,
    constants,
    ContractName,
    ERC20BalancesByOwner,
    getLatestBlockTimestampAsync,
    OrderFactory,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, DutchAuctionContract, DutchAuctionTestWrapper, WETH9Contract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;

describe(ContractName.DutchAuction, () => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let defaultMakerAssetAddress: string;

    let zrxToken: DummyERC20TokenContract;
    let erc20TokenA: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let dutchAuctionContract: DutchAuctionContract;
    let wethContract: WETH9Contract;

    let sellerOrderFactory: OrderFactory;
    let buyerOrderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let currentBlockTimestamp: number;
    let auctionBeginTimeSeconds: BigNumber;
    let auctionEndTimeSeconds: BigNumber;
    let auctionBeginAmount: BigNumber;
    let auctionEndAmount: BigNumber;
    let sellOrder: SignedOrder;
    let buyOrder: SignedOrder;
    let erc721MakerAssetIds: BigNumber[];
    const tenMinutesInSeconds = 10 * 60;

    let dutchAuctionTestWrapper: DutchAuctionTestWrapper;
    let defaultERC20MakerAssetData: string;

    before(async () => {
        await blockchainLifecycle.startAsync();

        chainId = await providerUtils.getChainIdAsync(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 2;
        [erc20TokenA, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        const erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        const erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        const erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];

        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, txDefaults, artifacts);
        erc20Wrapper.addDummyTokenContract(wethContract as any);

        const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            artifacts,
            zrxAssetData,
            new BigNumber(chainId),
        );
        const exchangeWrapper = new ExchangeWrapper(exchangeInstance, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);

        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });

        const dutchAuctionInstance = await DutchAuctionContract.deployFrom0xArtifactAsync(
            artifacts.DutchAuction,
            provider,
            txDefaults,
            artifacts,
            exchangeInstance.address,
        );
        dutchAuctionContract = new DutchAuctionContract(dutchAuctionInstance.address, provider);
        dutchAuctionTestWrapper = new DutchAuctionTestWrapper(dutchAuctionInstance, provider);

        defaultMakerAssetAddress = erc20TokenA.address;
        const defaultTakerAssetAddress = wethContract.address;

        // Set up taker WETH balance and allowance
        await web3Wrapper.awaitTransactionSuccessAsync(
            await wethContract.deposit.sendTransactionAsync({
                from: takerAddress,
                value: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), DECIMALS_DEFAULT),
            }),
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await wethContract.approve.sendTransactionAsync(
                erc20Proxy.address,
                constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
                { from: takerAddress },
            ),
        );
        web3Wrapper.abiDecoder.addABI(exchangeInstance.abi);
        web3Wrapper.abiDecoder.addABI(zrxToken.abi);
        erc20Wrapper.addTokenOwnerAddress(dutchAuctionContract.address);

        currentBlockTimestamp = await getLatestBlockTimestampAsync();
        // Default auction begins 10 minutes ago
        auctionBeginTimeSeconds = new BigNumber(currentBlockTimestamp).minus(tenMinutesInSeconds);
        // Default auction ends 10 from now
        auctionEndTimeSeconds = new BigNumber(currentBlockTimestamp).plus(tenMinutesInSeconds);
        auctionBeginAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT);
        auctionEndAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT);

        // Default sell order and buy order are exact mirrors
        const sellerDefaultOrderParams = {
            salt: generatePseudoRandomSalt(),
            makerAddress,
            feeRecipientAddress,
            // taker address or sender address should be set to the ducth auction contract
            takerAddress: dutchAuctionContract.address,
            makerAssetData: assetDataUtils.encodeDutchAuctionAssetData(
                assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
                auctionBeginTimeSeconds,
                auctionBeginAmount,
            ),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerAssetAmount: auctionEndAmount,
            expirationTimeSeconds: auctionEndTimeSeconds,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            domain: {
                verifyingContract: exchangeInstance.address,
                chainId,
            },
        };
        // Default buy order is for the auction begin price
        const buyerDefaultOrderParams = {
            ...sellerDefaultOrderParams,
            makerAddress: takerAddress,
            makerAssetData: sellerDefaultOrderParams.takerAssetData,
            takerAssetData: sellerDefaultOrderParams.makerAssetData,
            makerAssetAmount: auctionBeginAmount,
            takerAssetAmount: sellerDefaultOrderParams.makerAssetAmount,
        };
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        sellerOrderFactory = new OrderFactory(makerPrivateKey, sellerDefaultOrderParams);
        buyerOrderFactory = new OrderFactory(takerPrivateKey, buyerDefaultOrderParams);
        defaultERC20MakerAssetData = assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        erc20Balances = await erc20Wrapper.getBalancesAsync();
        sellOrder = await sellerOrderFactory.newSignedOrderAsync();
        buyOrder = await buyerOrderFactory.newSignedOrderAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('matchOrders', () => {
        it('should be worth the begin price at the begining of the auction', async () => {
            auctionBeginTimeSeconds = new BigNumber(currentBlockTimestamp + 2);
            const makerAssetData = assetDataUtils.encodeDutchAuctionAssetData(
                defaultERC20MakerAssetData,
                auctionBeginTimeSeconds,
                auctionBeginAmount,
            );
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({ makerAssetData });
            const auctionDetails = await dutchAuctionTestWrapper.getAuctionDetailsAsync(sellOrder);
            expect(auctionDetails.currentTimeSeconds).to.be.bignumber.lte(auctionBeginTimeSeconds);
            expect(auctionDetails.currentAmount).to.be.bignumber.equal(auctionBeginAmount);
            expect(auctionDetails.beginAmount).to.be.bignumber.equal(auctionBeginAmount);
        });
        it('should be be worth the end price at the end of the auction', async () => {
            auctionBeginTimeSeconds = new BigNumber(currentBlockTimestamp - tenMinutesInSeconds * 2);
            auctionEndTimeSeconds = new BigNumber(currentBlockTimestamp - tenMinutesInSeconds);
            const makerAssetData = assetDataUtils.encodeDutchAuctionAssetData(
                defaultERC20MakerAssetData,
                auctionBeginTimeSeconds,
                auctionBeginAmount,
            );
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                makerAssetData,
                expirationTimeSeconds: auctionEndTimeSeconds,
            });
            const auctionDetails = await dutchAuctionTestWrapper.getAuctionDetailsAsync(sellOrder);
            expect(auctionDetails.currentTimeSeconds).to.be.bignumber.gte(auctionEndTimeSeconds);
            expect(auctionDetails.currentAmount).to.be.bignumber.equal(auctionEndAmount);
            expect(auctionDetails.beginAmount).to.be.bignumber.equal(auctionBeginAmount);
        });
        it('should match orders at current amount and send excess to buyer', async () => {
            const beforeAuctionDetails = await dutchAuctionTestWrapper.getAuctionDetailsAsync(sellOrder);
            buyOrder = await buyerOrderFactory.newSignedOrderAsync({
                makerAssetAmount: beforeAuctionDetails.currentAmount.times(2),
            });
            await dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            const afterAuctionDetails = await dutchAuctionTestWrapper.getAuctionDetailsAsync(sellOrder);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[dutchAuctionContract.address][wethContract.address]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            // HACK gte used here due to a bug in ganache where the timestamp can change
            // between multiple calls to the same block. Which can move the amount in our case
            // ref: https://github.com/trufflesuite/ganache-core/issues/111
            expect(newBalances[makerAddress][wethContract.address]).to.be.bignumber.gte(
                erc20Balances[makerAddress][wethContract.address].plus(afterAuctionDetails.currentAmount),
            );
            expect(newBalances[takerAddress][wethContract.address]).to.be.bignumber.gte(
                erc20Balances[takerAddress][wethContract.address].minus(beforeAuctionDetails.currentAmount),
            );
        });
        it('maker fees on sellOrder are paid to the fee receipient', async () => {
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                makerFee: new BigNumber(1),
            });
            await dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            const afterAuctionDetails = await dutchAuctionTestWrapper.getAuctionDetailsAsync(sellOrder);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[makerAddress][wethContract.address]).to.be.bignumber.gte(
                erc20Balances[makerAddress][wethContract.address].plus(afterAuctionDetails.currentAmount),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(sellOrder.makerFee),
            );
        });
        it('maker fees on buyOrder are paid to the fee receipient', async () => {
            buyOrder = await buyerOrderFactory.newSignedOrderAsync({
                makerFee: new BigNumber(1),
            });
            await dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const afterAuctionDetails = await dutchAuctionTestWrapper.getAuctionDetailsAsync(sellOrder);
            expect(newBalances[makerAddress][wethContract.address]).to.be.bignumber.gte(
                erc20Balances[makerAddress][wethContract.address].plus(afterAuctionDetails.currentAmount),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(buyOrder.makerFee),
            );
        });
        it('should revert when auction expires', async () => {
            auctionBeginTimeSeconds = new BigNumber(currentBlockTimestamp - tenMinutesInSeconds * 2);
            auctionEndTimeSeconds = new BigNumber(currentBlockTimestamp - tenMinutesInSeconds);
            const makerAssetData = assetDataUtils.encodeDutchAuctionAssetData(
                defaultERC20MakerAssetData,
                auctionBeginTimeSeconds,
                auctionBeginAmount,
            );
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                expirationTimeSeconds: auctionEndTimeSeconds,
                makerAssetData,
            });
            const tx = dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            return expect(tx).to.revertWith(RevertReason.AuctionExpired);
        });
        it('cannot be filled for less than the current price', async () => {
            buyOrder = await buyerOrderFactory.newSignedOrderAsync({
                makerAssetAmount: sellOrder.takerAssetAmount,
            });
            const tx = dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            return expect(tx).to.revertWith(RevertReason.AuctionInvalidAmount);
        });
        it('auction begin amount must be higher than final amount ', async () => {
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                takerAssetAmount: auctionBeginAmount.plus(1),
            });
            const tx = dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            return expect(tx).to.revertWith(RevertReason.AuctionInvalidAmount);
        });
        it('begin time is less than end time', async () => {
            auctionBeginTimeSeconds = new BigNumber(auctionEndTimeSeconds).plus(tenMinutesInSeconds);
            const makerAssetData = assetDataUtils.encodeDutchAuctionAssetData(
                defaultERC20MakerAssetData,
                auctionBeginTimeSeconds,
                auctionBeginAmount,
            );
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                expirationTimeSeconds: auctionEndTimeSeconds,
                makerAssetData,
            });
            const tx = dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            return expect(tx).to.revertWith(RevertReason.AuctionInvalidBeginTime);
        });
        it('asset data contains auction parameters', async () => {
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            });
            const tx = dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            return expect(tx).to.revertWith(RevertReason.InvalidAssetData);
        });

        describe('ERC721', () => {
            it('should match orders when ERC721', async () => {
                const makerAssetId = erc721MakerAssetIds[0];
                const erc721MakerAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId);
                const makerAssetData = assetDataUtils.encodeDutchAuctionAssetData(
                    erc721MakerAssetData,
                    auctionBeginTimeSeconds,
                    auctionBeginAmount,
                );
                sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    makerAssetData,
                });
                buyOrder = await buyerOrderFactory.newSignedOrderAsync({
                    takerAssetAmount: new BigNumber(1),
                    takerAssetData: sellOrder.makerAssetData,
                });
                await dutchAuctionTestWrapper.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
                const afterAuctionDetails = await dutchAuctionTestWrapper.getAuctionDetailsAsync(sellOrder);
                const newBalances = await erc20Wrapper.getBalancesAsync();
                // HACK gte used here due to a bug in ganache where the timestamp can change
                // between multiple calls to the same block. Which can move the amount in our case
                // ref: https://github.com/trufflesuite/ganache-core/issues/111
                expect(newBalances[makerAddress][wethContract.address]).to.be.bignumber.gte(
                    erc20Balances[makerAddress][wethContract.address].plus(afterAuctionDetails.currentAmount),
                );
                const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
                expect(newOwner).to.be.bignumber.equal(takerAddress);
            });
        });
    });
});
