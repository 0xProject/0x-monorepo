import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { DummyERC721TokenContract } from '../../generated-wrappers/dummy_erc721_token';
import { DutchAuctionContract } from '../../generated-wrappers/dutch_auction';
import { ExchangeContract } from '../../generated-wrappers/exchange';
import { WETH9Contract } from '../../generated-wrappers/weth9';
import { artifacts } from '../../src/artifacts';
import { expectTransactionFailedAsync } from '../utils/assertions';
import { getLatestBlockTimestampAsync } from '../utils/block_timestamp';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { ContractName, ERC20BalancesByOwner } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;

describe(ContractName.DutchAuction, () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let defaultMakerAssetAddress: string;

    let weth: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc20TokenA: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let dutchAuctionContract: DutchAuctionContract;
    let wethContract: WETH9Contract;
    let exchangeWrapper: ExchangeWrapper;

    let sellerOrderFactory: OrderFactory;
    let buyerOrderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let tenMinutesInSeconds: number;
    let currentBlockTimestamp: number;
    let auctionBeginTime: BigNumber;
    let auctionBeginPrice: BigNumber;
    let encodedParams: BigNumber;
    let sellOrder: SignedOrder;
    let buyOrder: SignedOrder;
    let erc721MakerAssetIds: BigNumber[];

    before(async () => {
        await blockchainLifecycle.startAsync();
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

        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, txDefaults);
        weth = new DummyERC20TokenContract(wethContract.abi, wethContract.address, provider);
        erc20Wrapper.addDummyTokenContract(weth);

        const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrxAssetData,
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

        const dutchAuctionInstance = await DutchAuctionContract.deployFrom0xArtifactAsync(
            artifacts.DutchAuction,
            provider,
            txDefaults,
            exchangeInstance.address,
        );
        dutchAuctionContract = new DutchAuctionContract(
            dutchAuctionInstance.abi,
            dutchAuctionInstance.address,
            provider,
        );

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
        tenMinutesInSeconds = 10 * 60;
        currentBlockTimestamp = await getLatestBlockTimestampAsync();
        auctionBeginTime = new BigNumber(currentBlockTimestamp).minus(tenMinutesInSeconds);
        auctionBeginPrice = Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT);
        encodedParams = await dutchAuctionContract.encodeParameters.callAsync(auctionBeginTime, auctionBeginPrice);

        const sellerDefaultOrderParams = {
            salt: encodedParams, // Set the encoded params as the salt for the seller order
            exchangeAddress: exchangeInstance.address,
            makerAddress,
            feeRecipientAddress,
            senderAddress: dutchAuctionContract.address,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), DECIMALS_DEFAULT),
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
        };
        const buyerDefaultOrderParams = {
            ...sellerDefaultOrderParams,
            makerAddress: takerAddress,
            makerAssetData: sellerDefaultOrderParams.takerAssetData,
            takerAssetData: sellerDefaultOrderParams.makerAssetData,
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
        };
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(takerAddress)];
        sellerOrderFactory = new OrderFactory(makerPrivateKey, sellerDefaultOrderParams);
        buyerOrderFactory = new OrderFactory(takerPrivateKey, buyerDefaultOrderParams);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        erc20Balances = await erc20Wrapper.getBalancesAsync();
        tenMinutesInSeconds = 10 * 60;
        currentBlockTimestamp = await getLatestBlockTimestampAsync();
        auctionBeginTime = new BigNumber(currentBlockTimestamp).minus(tenMinutesInSeconds);
        auctionBeginPrice = Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT);
        encodedParams = await dutchAuctionContract.encodeParameters.callAsync(auctionBeginTime, auctionBeginPrice);
        sellOrder = await sellerOrderFactory.newSignedOrderAsync();
        buyOrder = await buyerOrderFactory.newSignedOrderAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('matchOrders', () => {
        it('should encode and decode parameters', async () => {
            const [decodedBegin, decodedBeginPrice] = await dutchAuctionContract.decodeParameters.callAsync(
                encodedParams,
            );
            expect(decodedBegin).to.be.bignumber.equal(auctionBeginTime);
            expect(decodedBeginPrice).to.be.bignumber.equal(auctionBeginPrice);
        });
        it('should be worth the begin price at the begining of the auction', async () => {
            // TODO this is flakey
            currentBlockTimestamp = await web3Wrapper.getBlockTimestampAsync('latest');
            await web3Wrapper.increaseTimeAsync(1);
            auctionBeginTime = new BigNumber(currentBlockTimestamp + 2);
            encodedParams = await dutchAuctionContract.encodeParameters.callAsync(auctionBeginTime, auctionBeginPrice);
            sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                salt: encodedParams,
            });
            const auctionDetails = await dutchAuctionContract.getAuctionDetails.callAsync(sellOrder);
            expect(auctionDetails.currentPrice).to.be.bignumber.equal(auctionBeginPrice);
            expect(auctionDetails.beginPrice).to.be.bignumber.equal(auctionBeginPrice);
        });
        it('should match orders and send excess to seller', async () => {
            const txHash = await dutchAuctionContract.matchOrders.sendTransactionAsync(
                buyOrder,
                sellOrder,
                buyOrder.signature,
                sellOrder.signature,
                {
                    from: takerAddress,
                },
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[dutchAuctionContract.address][weth.address]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(buyOrder.makerAssetAmount),
            );
        });
        it('should have valid getAuctionDetails at a block in the future', async () => {
            let auctionDetails = await dutchAuctionContract.getAuctionDetails.callAsync(sellOrder);
            const beforePrice = auctionDetails.currentPrice;
            // Increase block time
            await web3Wrapper.increaseTimeAsync(60);
            auctionDetails = await dutchAuctionContract.getAuctionDetails.callAsync(sellOrder);
            const currentPrice = auctionDetails.currentPrice;
            expect(beforePrice).to.be.bignumber.greaterThan(currentPrice);
            buyOrder = await buyerOrderFactory.newSignedOrderAsync({
                makerAssetAmount: currentPrice,
            });
            const txHash = await dutchAuctionContract.matchOrders.sendTransactionAsync(
                buyOrder,
                sellOrder,
                buyOrder.signature,
                sellOrder.signature,
                {
                    from: takerAddress,
                },
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(currentPrice),
            );
        });
        it('should revert when auction expires', async () => {
            // Increase block time
            await web3Wrapper.increaseTimeAsync(tenMinutesInSeconds);
            return expectTransactionFailedAsync(
                dutchAuctionContract.matchOrders.sendTransactionAsync(
                    buyOrder,
                    sellOrder,
                    buyOrder.signature,
                    sellOrder.signature,
                    {
                        from: takerAddress,
                    },
                ),
                'AUCTION_EXPIRED' as any,
            );
        });
        it('cannot be filled for less than the current price', async () => {
            // Increase block time
            await web3Wrapper.increaseTimeAsync(60);
            buyOrder = await buyerOrderFactory.newSignedOrderAsync({
                makerAssetAmount: sellOrder.takerAssetAmount,
            });
            return expectTransactionFailedAsync(
                dutchAuctionContract.matchOrders.sendTransactionAsync(
                    buyOrder,
                    sellOrder,
                    buyOrder.signature,
                    sellOrder.signature,
                    {
                        from: takerAddress,
                    },
                ),
                'INVALID_PRICE' as any,
            );
        });
        describe('ERC721', () => {
            it('should match orders when ERC721', async () => {
                const makerAssetId = erc721MakerAssetIds[0];
                sellOrder = await sellerOrderFactory.newSignedOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                });
                buyOrder = await buyerOrderFactory.newSignedOrderAsync({
                    takerAssetAmount: new BigNumber(1),
                    takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                });
                const txHash = await dutchAuctionContract.matchOrders.sendTransactionAsync(
                    buyOrder,
                    sellOrder,
                    buyOrder.signature,
                    sellOrder.signature,
                    {
                        from: takerAddress,
                    },
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash);
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][weth.address].plus(buyOrder.makerAssetAmount),
                );
                const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
                expect(newOwner).to.be.bignumber.equal(takerAddress);
            });
        });
    });
});
