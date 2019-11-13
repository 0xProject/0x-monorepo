import { artifacts as erc721Artifacts } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts } from '@0x/contracts-exchange';
import { LogDecoder, Web3ProviderEngine } from '@0x/contracts-test-utils';
import { DutchAuctionDetails, SignedOrder } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { DutchAuctionContract } from '../../generated-wrappers/dutch_auction';
import { artifacts } from '../../src/artifacts';

export class DutchAuctionTestWrapper {
    private readonly _dutchAuctionContract: DutchAuctionContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _logDecoder: LogDecoder;

    constructor(contractInstance: DutchAuctionContract, provider: Web3ProviderEngine) {
        this._dutchAuctionContract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper, {
            ...artifacts,
            ...exchangeArtifacts,
            ...erc721Artifacts,
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
        const txHash = await this._dutchAuctionContract
            .matchOrders(buyOrder, sellOrder, buyOrder.signature, sellOrder.signature)
            .sendTransactionAsync({
                from,
            });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    /**
     * Calculates the Auction Details for the given order
     * @param sellOrder The Seller's order. This order is for the lowest amount (at the end of the auction).
     * @return The dutch auction details.
     */
    public async getAuctionDetailsAsync(sellOrder: SignedOrder): Promise<DutchAuctionDetails> {
        const auctionDetails = await this._dutchAuctionContract.getAuctionDetails(sellOrder).callAsync();
        return auctionDetails;
    }
}
