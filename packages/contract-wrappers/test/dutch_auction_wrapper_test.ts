import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { ContractWrappers, OrderStatus } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { migrateOnceAsync } from './utils/migrate';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';
import { getLatestBlockTimestampAsync } from '@0x/contracts-test-utils';
import { DutchAuction } from '@0x/contract-artifacts';
import { DutchAuctionWrapper } from '../src/contract_wrappers/dutch_auction_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

// tslint:disable:custom-no-magic-numbers
describe.only('DutchAuctionWrapper', () => {
    const fillableAmount = new BigNumber(5);
    const tenMinutesInSeconds = 10 * 60;
    let contractWrappers: ContractWrappers;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let zrxTokenAddress: string;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let buyOrder: SignedOrder;
    let sellOrder: SignedOrder;
    let makerTokenAssetData: string;
    let takerTokenAssetData: string;
    before(async () => {
        console.log(`BEOGIN DEPLOYINH`);
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };

        contractWrappers = new ContractWrappers(provider, config);
        console.log(`DEPLOYINH`);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = contractWrappers.exchange.zrxTokenAddress;
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
            contractWrappers.erc721Proxy.address,
        );
        [, makerAddress, takerAddress] = userAddresses;
        [makerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        takerTokenAddress = contractWrappers.forwarder.etherTokenAddress;
        // construct asset data for tokens being swapped
        [makerTokenAssetData, takerTokenAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        // encode auction details in maker asset data
        const auctionBeginAmount = fillableAmount;
        const currentBlockTimestamp = await getLatestBlockTimestampAsync();
        const auctionBeginTimeSeconds = new BigNumber(currentBlockTimestamp - tenMinutesInSeconds);
        makerAssetData = DutchAuctionWrapper.encodeDutchAuctionAssetData(
            makerTokenAssetData,
            auctionBeginTimeSeconds,
            auctionBeginAmount
        );
        takerAssetData = takerTokenAssetData;
        // create sell / buy orders for auction
        // note that the maker/taker asset datas are swapped in the `buyOrder`
        sellOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            constants.NULL_ADDRESS,
            fillableAmount,
        );
        buyOrder = await fillScenarios.createFillableSignedOrderAsync(
            takerAssetData,
            makerAssetData,
            makerAddress,
            constants.NULL_ADDRESS,
            fillableAmount,
        );
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
            return expect(
                await contractWrappers.dutchAuction.matchOrdersAsync(
                    badBuyOrder,
                    badSellOrder,
                    takerAddress,
                    {
                        shouldValidate: true,
                    },
                ),
            ).to.be.rejectedWith('COMPLETE_FILL_FAILED');
        });
    });

    describe('#getAuctionDetailsAsync', () => {
        it('should be worth the begin price at the begining of the auction', async () => {
            // setup auction details
            const auctionBeginAmount = fillableAmount;
            const currentBlockTimestamp = await getLatestBlockTimestampAsync();
            const auctionBeginTimeSeconds = new BigNumber(currentBlockTimestamp + tenMinutesInSeconds);
            const makerAssetData = DutchAuctionWrapper.encodeDutchAuctionAssetData(
                makerTokenAssetData,
                auctionBeginTimeSeconds,
                auctionBeginAmount
            );
            const order = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                constants.NULL_ADDRESS,
                fillableAmount,
            );
            const auctionDetails = await contractWrappers.dutchAuction.getAuctionDetailsAsync(order);
            expect(auctionDetails.currentTimeSeconds).to.be.bignumber.lte(auctionBeginTimeSeconds);
            expect(auctionDetails.currentAmount).to.be.bignumber.equal(auctionBeginAmount);
            expect(auctionDetails.beginAmount).to.be.bignumber.equal(auctionBeginAmount);
        });
    });
});
