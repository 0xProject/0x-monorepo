import { expectTransactionFailedAsync, getLatestBlockTimestampAsync } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { ContractWrappers } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { DutchAuctionUtils } from './utils/dutch_auction_utils';
import { migrateOnceAsync } from './utils/migrate';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

// tslint:disable:custom-no-magic-numbers
describe('DutchAuctionWrapper', () => {
    const fillableAmount = new BigNumber(2);
    const tenMinutesInSeconds = 10 * 60;
    let contractWrappers: ContractWrappers;
    let exchangeContractAddress: string;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let buyOrder: SignedOrder;
    let sellOrder: SignedOrder;
    let makerTokenAssetData: string;
    let takerTokenAssetData: string;
    let auctionBeginTimeSeconds: BigNumber;
    let auctionBeginAmount: BigNumber;
    let auctionEndTimeSeconds: BigNumber;
    let auctionEndAmount: BigNumber;
    before(async () => {
        // setup contract wrappers & addresses
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        [, makerAddress, takerAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        // construct asset data for tokens being swapped
        [makerTokenAssetData, takerTokenAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        // setup auction details in maker asset data
        auctionEndAmount = fillableAmount;
        auctionBeginAmount = auctionEndAmount.times(2);
        const currentBlockTimestamp: number = await getLatestBlockTimestampAsync();
        auctionBeginTimeSeconds = new BigNumber(currentBlockTimestamp - tenMinutesInSeconds);
        auctionEndTimeSeconds = new BigNumber(currentBlockTimestamp + tenMinutesInSeconds);
        // create auction orders
        const coinbase = userAddresses[0];
        const dutchAuctionUtils = new DutchAuctionUtils(
            web3Wrapper,
            coinbase,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
        );
        sellOrder = await dutchAuctionUtils.createSignedSellOrderAsync(
            auctionBeginTimeSeconds,
            auctionBeginAmount,
            auctionEndAmount,
            auctionEndTimeSeconds,
            makerTokenAssetData,
            takerTokenAssetData,
            makerAddress,
            constants.NULL_ADDRESS,
            auctionEndAmount,
        );
        buyOrder = await dutchAuctionUtils.createSignedBuyOrderAsync(sellOrder, takerAddress);
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
    describe('#matchOrdersAsync', () => {
        it('should match two orders', async () => {
            const txHash = await contractWrappers.dutchAuction.matchOrdersAsync(buyOrder, sellOrder, takerAddress);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        });
        it('should throw when invalid transaction and shouldValidate is true', async () => {
            // request match with bad buy/sell orders
            const badSellOrder = buyOrder;
            const badBuyOrder = sellOrder;
            return expectTransactionFailedAsync(
                contractWrappers.dutchAuction.matchOrdersAsync(badBuyOrder, badSellOrder, takerAddress, {
                    shouldValidate: true,
                }),
                RevertReason.InvalidAssetData,
            );
        });
    });

    describe('#getAuctionDetailsAsync', () => {
        it('should get auction details', async () => {
            // get auction details
            const auctionDetails = await contractWrappers.dutchAuction.getAuctionDetailsAsync(sellOrder);
            // run some basic sanity checks on the return value
            expect(auctionDetails.beginTimeSeconds, 'auctionDetails.beginTimeSeconds').to.be.bignumber.equal(
                auctionBeginTimeSeconds,
            );
            expect(auctionDetails.beginAmount, 'auctionDetails.beginAmount').to.be.bignumber.equal(auctionBeginAmount);
            expect(auctionDetails.endTimeSeconds, 'auctionDetails.endTimeSeconds').to.be.bignumber.equal(
                auctionEndTimeSeconds,
            );
        });
    });
});
