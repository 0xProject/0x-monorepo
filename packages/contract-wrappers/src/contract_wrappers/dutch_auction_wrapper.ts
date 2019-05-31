import { DutchAuctionContract } from '@0x/abi-gen-wrappers';
import { DutchAuction } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import { assetDataUtils } from '@0x/order-utils';
import { DutchAuctionDetails, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as ethAbi from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import { DutchAuctionData, DutchAuctionWrapperError, OrderTransactionOpts } from '../types';
import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';

import { ContractWrapper } from './contract_wrapper';

export class DutchAuctionWrapper extends ContractWrapper {
    public abi: ContractAbi = DutchAuction.compilerOutput.abi;
    public bytecode: string = DutchAuction.compilerOutput.evm.deployedBytecode.object;
    public address: string;
    private _dutchAuctionContractIfExists?: DutchAuctionContract;
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
        const assetDataBuffer = ethUtil.toBuffer(assetData);
        const abiEncodedAuctionData = (ethAbi as any).rawEncode(
            ['uint256', 'uint256'],
            [beginTimeSeconds.toString(), beginAmount.toString()],
        );
        const abiEncodedAuctionDataBuffer = ethUtil.toBuffer(abiEncodedAuctionData);
        const dutchAuctionDataBuffer = Buffer.concat([assetDataBuffer, abiEncodedAuctionDataBuffer]);
        const dutchAuctionData = ethUtil.bufferToHex(dutchAuctionDataBuffer);
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
        const dutchAuctionDataBuffer = ethUtil.toBuffer(dutchAuctionData);
        // Decode asset data
        const dutchAuctionDataLengthInBytes = 64;
        const assetDataBuffer = dutchAuctionDataBuffer.slice(
            0,
            dutchAuctionDataBuffer.byteLength - dutchAuctionDataLengthInBytes,
        );
        const assetDataHex = ethUtil.bufferToHex(assetDataBuffer);
        const assetData = assetDataUtils.decodeAssetDataOrThrow(assetDataHex);
        // Decode auction details
        const dutchAuctionDetailsBuffer = dutchAuctionDataBuffer.slice(
            dutchAuctionDataBuffer.byteLength - dutchAuctionDataLengthInBytes,
        );
        const [beginTimeSecondsAsBN, beginAmountAsBN] = ethAbi.rawDecode(
            ['uint256', 'uint256'],
            dutchAuctionDetailsBuffer,
        );
        const beginTimeSeconds = new BigNumber(beginTimeSecondsAsBN.toString());
        const beginAmount = new BigNumber(beginAmountAsBN.toString());
        return {
            assetData,
            beginTimeSeconds,
            beginAmount,
        };
    }
    /**
     * Instantiate DutchAuctionWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the Dutch Auction contract. If undefined, will
     * default to the known address corresponding to the networkId.
     */
    public constructor(web3Wrapper: Web3Wrapper, networkId: number, address?: string) {
        super(web3Wrapper, networkId);
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).dutchAuction : address;
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
     * Fetches the Auction Details for the given order
     * @param sellOrder The Seller's order. This order is for the lowest amount (at the end of the auction).
     * @return The dutch auction details.
     */
    public async getAuctionDetailsAsync(sellOrder: SignedOrder): Promise<DutchAuctionDetails> {
        // type assertions
        assert.doesConformToSchema('sellOrder', sellOrder, schemas.signedOrderSchema);
        // get contract
        const dutchAuctionInstance = await this._getDutchAuctionContractAsync();
        // call contract
        const auctionDetails = await dutchAuctionInstance.getAuctionDetails.callAsync(sellOrder);
        return auctionDetails;
    }
    private async _getDutchAuctionContractAsync(): Promise<DutchAuctionContract> {
        if (this._dutchAuctionContractIfExists !== undefined) {
            return this._dutchAuctionContractIfExists;
        }
        const contractInstance = new DutchAuctionContract(
            this.abi,
            this.bytecode,
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._dutchAuctionContractIfExists = contractInstance;
        return this._dutchAuctionContractIfExists;
    }
}
