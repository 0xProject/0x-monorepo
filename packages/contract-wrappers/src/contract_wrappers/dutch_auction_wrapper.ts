import { DutchAuctionContract } from '@0x/abi-gen-wrappers';
import { DutchAuction } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import { assetDataUtils } from '@0x/order-utils';
import { DutchAuctionData, DutchAuctionDetails, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import { DutchAuctionWrapperError, OrderTransactionOpts } from '../types';
import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';

export class DutchAuctionWrapper {
    public abi: ContractAbi = DutchAuction.compilerOutput.abi;
    public address: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _dutchAuctionContract: DutchAuctionContract;
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
        const dutchAuctionData = assetDataUtils.encodeDutchAuctionAssetData(assetData, beginTimeSeconds, beginAmount);
        return dutchAuctionData;
    }
    /**
     * Dutch auction details are encoded with the asset data for a 0x order. This function decodes a hex
     * encoded assetData string, containing information both about the asset being traded and the
     * dutch auction.
     * @param dutchAuctionData Hex encoded assetData string for the asset being auctioned.
     * @return An object containing the auction asset, auction begin time and auction begin amount.
     */
    public static decodeDutchAuctionData(dutchAuctionData: string): DutchAuctionData {
        const decoded = assetDataUtils.decodeDutchAuctionData(dutchAuctionData);
        return decoded;
    }
    /**
     * Instantiate DutchAuctionWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the Dutch Auction contract. If undefined, will
     * default to the known address corresponding to the networkId.
     */
    public constructor(web3Wrapper: Web3Wrapper, networkId: number, address?: string) {
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).dutchAuction : address;
        this._web3Wrapper = web3Wrapper;
        this._dutchAuctionContract = new DutchAuctionContract(
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
    }
    /**
     * Matches the buy and sell orders at an amount given the following: the current block time, the auction
     * start time and the auction begin amount. The sell order is a an order at the lowest amount
     * at the end of the auction. Excess from the match is transferred to the seller.
     * Over time the price moves from beginAmount to endAmount given the current block.timestamp.
     * @param buyOrder      The Buyer's order. This order is for the current expected price of the auction.
     * @param sellOrder     The Seller's order. This order is for the lowest amount (at the end of the auction).
     * @param takerAddress  The user Ethereum address who would like to fill this order. Must be available via the supplied
     *                      Provider provided at instantiation.
     * @return              Transaction hash.
     */
    public async matchOrdersAsync(
        buyOrder: SignedOrder,
        sellOrder: SignedOrder,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        // type assertions
        assert.doesConformToSchema('buyOrder', buyOrder, schemas.signedOrderSchema);
        assert.doesConformToSchema('sellOrder', sellOrder, schemas.signedOrderSchema);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();
        // other assertions
        if (
            sellOrder.makerAssetData !== buyOrder.takerAssetData ||
            sellOrder.takerAssetData !== buyOrder.makerAssetData
        ) {
            throw new Error(DutchAuctionWrapperError.AssetDataMismatch);
        }
        // validate transaction
        if (orderTransactionOpts.shouldValidate) {
            await this._dutchAuctionContract.matchOrders.callAsync(
                buyOrder,
                sellOrder,
                buyOrder.signature,
                sellOrder.signature,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        // send transaction
        const txHash = await this._dutchAuctionContract.matchOrders.sendTransactionAsync(
            buyOrder,
            sellOrder,
            buyOrder.signature,
            sellOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
    }
    /**
     * Fetches the Auction Details for the given order
     * @param sellOrder The Seller's order. This order is for the lowest amount (at the end of the auction).
     * @return The dutch auction details.
     */
    public async getAuctionDetailsAsync(sellOrder: SignedOrder): Promise<DutchAuctionDetails> {
        // type assertions
        assert.doesConformToSchema('sellOrder', sellOrder, schemas.signedOrderSchema);
        // call contract
        const auctionDetails = await this._dutchAuctionContract.getAuctionDetails.callAsync(sellOrder);
        return auctionDetails;
    }
}
