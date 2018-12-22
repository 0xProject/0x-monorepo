import { artifacts as protocolArtifacts } from '@0x/contracts-protocol';
import { DutchAuctionContract } from '@0x/abi-gen-wrappers';
import { DutchAuction } from '@0x/contract-artifacts';
import { LogDecoder } from '@0x/contracts-test-utils';
import { artifacts as tokensArtifacts } from '@0x/contracts-tokens';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';
import { DutchAuctionDetails, SignedOrder } from '@0x/types';
import { ContractAbi } from 'ethereum-types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { BigNumber, abiUtils } from '@0x/utils';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';
import ethAbi = require('ethereumjs-abi');
import { schemas } from '@0x/json-schemas';
import { assert } from '../utils/assert';
import ethUtil = require('ethereumjs-util');

import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import { OrderTransactionOpts } from '../types';
import { ContractWrapper } from './contract_wrapper';
import { ExchangeWrapperError } from '../types';

import { assetDataUtils, AssetData } from '@0x/order-utils';

export class DutchAuctionWrapper extends ContractWrapper {
    public abi: ContractAbi = DutchAuction.compilerOutput.abi;
    public address: string;
    private _exchangeAddress: string;
    private _dutchAuctionContractIfExists?: DutchAuctionContract;
    /**
     * Instantiate DutchAuctionWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the Dutch Auction contract. If undefined, will
     * default to the known address corresponding to the networkId.
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        address?: string,
        exchangeAddress?: string,
    ) {
        super(web3Wrapper, networkId);
        this.address = this.address = _.isUndefined(address) ? _getDefaultContractAddresses(networkId).dutchAuction : address;
        this._exchangeAddress = _.isUndefined(exchangeAddress) ? _getDefaultContractAddresses(networkId).exchange : exchangeAddress;
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
            throw new Error(ExchangeWrapperError.AssetDataMismatch);
        } else {
            // Smart contracts assigns the asset data from the left order to the right one so we can save gas on reducing the size of call data
            //rightSignedOrder.makerAssetData = '0x';
           // rightSignedOrder.takerAssetData = '0x';
        }
        // get contract
        const dutchAuctionInstance = await this._getDutchAuctionContractAsync();
        // validate transaction
        if (orderTransactionOpts.shouldValidate) {
            await dutchAuctionInstance.matchOrders.callAsync(
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
        const txHash = await dutchAuctionInstance.matchOrders.sendTransactionAsync(
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
     * Calculates the Auction Details for the given order
     * @param sellOrder The Seller's order. This order is for the lowest amount (at the end of the auction).
     * @return The dutch auction details.
     */
    public async getAuctionDetailsAsync(sellOrder: SignedOrder): Promise<DutchAuctionDetails> {
        // type assertions
        assert.doesConformToSchema('sellOrder', sellOrder, schemas.signedOrderSchema);
        // get contract
        console.log(sellOrder);
        console.log(await this._getDutchAuctionContractAsync());
        const dutchAuctionInstance = await this._getDutchAuctionContractAsync();
        // call contract
        const afterAuctionDetails = await dutchAuctionInstance.getAuctionDetails.callAsync(sellOrder);
        return afterAuctionDetails;
    }
    private async _getDutchAuctionContractAsync(): Promise<DutchAuctionContract> {
        if (!_.isUndefined(this._dutchAuctionContractIfExists)) {
            return this._dutchAuctionContractIfExists;
        }
        const contractInstance = new DutchAuctionContract(
            this.abi,
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._dutchAuctionContractIfExists = contractInstance;
        return this._dutchAuctionContractIfExists;
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
    public static encodeDutchAuctionAssetData(assetData: string, beginTimeSeconds: BigNumber, beginAmount: BigNumber): string {
        const assetDataBuffer = ethUtil.toBuffer(assetData);
        const abiEncodedAuctionData = (ethAbi as any).rawEncode(
            ['uint256', 'uint256'],
            [beginTimeSeconds.toString(), beginAmount.toString()],
        );
        const abiEncodedAuctionDataBuffer = ethUtil.toBuffer(abiEncodedAuctionData);
        const dutchAuctionDataBuffer = Buffer.concat([assetDataBuffer, abiEncodedAuctionDataBuffer]);
     //   console.log(`GREFG --- `, abiEncodedAuctionData);
        const dutchAuctionData = ethUtil.bufferToHex(dutchAuctionDataBuffer);
        return dutchAuctionData;
    };
    /**
     * Dutch auction details are encoded with the asset data for a 0x order. This function produces a hex
     * encoded assetData string, containing information both about the asset being traded and the
     * dutch auction; which is usable in the makerAssetData or takerAssetData fields in a 0x order.
     * @param dutchAuctionData Hex encoded assetData string for the asset being auctioned.
     * @return 
     */
    public static decodeDutchAuctionData(dutchAuctionData: string): [AssetData, BigNumber, BigNumber] {
        const dutchAuctionDataBuffer = ethUtil.toBuffer(dutchAuctionData);
        // Decode asset data
        const assetDataBuffer = dutchAuctionDataBuffer.slice(0, dutchAuctionDataBuffer.byteLength - 64);
        const assetDataHex = ethUtil.bufferToHex(assetDataBuffer);
        const assetData = assetDataUtils.decodeAssetDataOrThrow(assetDataHex);
        // Decode auction details
        const dutchAuctionDetailsBuffer = dutchAuctionDataBuffer.slice(dutchAuctionDataBuffer.byteLength - 64);
        const [beginTimeSecondsAsBN, beginAmountAsBN] = ethAbi.rawDecode(
            ['uint256', 'uint256'],
            dutchAuctionDetailsBuffer
        );
        const beginTimeSeconds = new BigNumber(`0x${beginTimeSecondsAsBN.toString()}`);
        const beginAmount = new BigNumber(`0x${beginAmountAsBN.toString()}`);
        console.log(beginAmount);
        return [assetData, beginTimeSeconds, beginAmount];
     };
}
