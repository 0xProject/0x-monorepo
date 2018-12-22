import { artifacts as protocolArtifacts } from '@0x/contracts-protocol';
import { LogDecoder } from '@0x/contracts-test-utils';
import { artifacts as tokensArtifacts } from '@0x/contracts-tokens';
import { DutchAuctionDetails, SignedOrder } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';
import { BigNumber } from '@0x/utils';

import { DutchAuctionContract } from '../../generated-wrappers/dutch_auction';
import { artifacts } from '../../src/artifacts';
import { DutchAuctionWrapper } from '@0x/contract-wrappers';

export class DutchAuctionTestWrapper {
    private readonly _dutchAuctionContract: DutchAuctionContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _logDecoder: LogDecoder;

    constructor(contractInstance: DutchAuctionContract, provider: Provider) {
        this._dutchAuctionContract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper, {
            ...artifacts,
            ...tokensArtifacts,
            ...protocolArtifacts,
        });
    }
    /**
     * Matches the buy and sell orders at an amount given the following: the current block time, the auction
     * start time and the auction begin amount. The sell order is a an order at the lowest amount
     * at the end of the auction. Excess from the match is transferred to the seller.
     * Over time the price moves from beginAmount to endAmount given the current block.timestamp.
     * @param buyOrder The Buyer's order. This order is for the current expected price of the auction.
     * @param sellOrder The Seller's order. This order is for the lowest amount (at the end of the auction).
     * @param from Address the transaction is being sent from.
     * @return Transaction receipt with decoded logs.
     */
    public async matchOrdersAsync(
        buyOrder: SignedOrder,
        sellOrder: SignedOrder,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._dutchAuctionContract.matchOrders.sendTransactionAsync(
            buyOrder,
            sellOrder,
            buyOrder.signature,
            sellOrder.signature,
            {
                from,
            },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    /**
     * Calculates the Auction Details for the given order
     * @param sellOrder The Seller's order. This order is for the lowest amount (at the end of the auction).
     * @return The dutch auction details.
     */
    public async getAuctionDetailsAsync(sellOrder: SignedOrder): Promise<DutchAuctionDetails> {
        const afterAuctionDetails = await this._dutchAuctionContract.getAuctionDetails.callAsync(sellOrder);
        return afterAuctionDetails;
    }
    /**
     * Dutch auction details are encoded with the asset data for a 0x order. This function produces a hex
     * encoded assetData string, containing information both about the asset being traded and the
     * dutch auction; which is usable in the makerAssetData or takerAssetData fields in a 0x order.
     * @param assetData Hex encoded assetData string for the asset being auctioned.
     * @param beginTimeSeconds Begin time of the dutch auction.
     * @param beginAmount Starting amount being sold in the dutch auction.
     * @return The hex encoded assetData string.
     */
    public static encodeDutchAuctionAssetData(
        assetData: string,
        beginTimeSeconds: BigNumber,
        beginAmount: BigNumber,
    ): string {
        return DutchAuctionWrapper.encodeDutchAuctionAssetData(assetData, beginTimeSeconds, beginAmount);
    }
}
