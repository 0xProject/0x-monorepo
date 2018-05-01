import { Order, OrderTransactionOpts } from '0x.js';
import { ContractAbi, TransactionReceiptWithDecodedLogs } from '@0xproject/types';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { formatters } from '../../src/utils/formatters';
import { orderUtils } from '../../src/utils/order_utils';
import { ForwarderContract } from '../contract_wrappers/generated/forwarder';
// import { artifacts } from '../ts/artifacts';

import { Artifact, SignatureType, SignedOrder, UnsignedOrder } from './types';

export class ForwarderWrapper {
    private _web3Wrapper: Web3Wrapper;
    private _forwarderContract: ForwarderContract;
    // TODO remove this
    // public static async getForwarderContractAsync(web3Wrapper: Web3Wrapper): Promise<ForwarderContract> {
    //     const networkId = await web3Wrapper.getNetworkIdAsync();
    //     const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
    //         artifacts.Forwarder,
    //         web3Wrapper,
    //         networkId,
    //     );
    //     const contractInstance = new ForwarderContract(web3Wrapper, abi, address);
    //     return contractInstance;
    // }
    protected static async _getContractAbiAndAddressFromArtifactsAsync(
        artifact: Artifact,
        web3Wrapper: Web3Wrapper,
        networkId: number,
    ): Promise<[ContractAbi, string]> {
        const contractAddress = this._getContractAddress(artifact, networkId);
        const doesContractExist = await web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(`Forwarder Contract ${contractAddress} Not Found on network ${networkId}`);
        }
        const abiAndAddress: [ContractAbi, string] = [artifact.networks[networkId].abi, contractAddress];
        return abiAndAddress;
    }
    protected static _getContractAddress(artifact: Artifact, networkId: number, addressIfExists?: string): string {
        let contractAddress;
        if (_.isUndefined(addressIfExists)) {
            contractAddress = artifact.networks[networkId].address;
            if (_.isUndefined(contractAddress)) {
                throw new Error('ContractDoesNotExist');
            }
        } else {
            contractAddress = addressIfExists;
        }
        return contractAddress;
    }

    constructor(contractInstance: ForwarderContract, web3Wrapper: Web3Wrapper) {
        this._forwarderContract = contractInstance;
        this._web3Wrapper = web3Wrapper;
        this._web3Wrapper.abiDecoder.addABI(contractInstance.abi);
    }
    public async buyTokensAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        fillAmountWei: BigNumber,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txOpts = {
            from,
            value: fillAmountWei,
        };
        const params = formatters.createMarketSellOrders(orders, fillAmountWei);
        const feeParams = formatters.createMarketSellOrders(feeOrders, new BigNumber(0));
        const txHash: string = await this._forwarderContract.buyTokens.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            txOpts,
        );
        const tx = await this._getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async buyTokensFeeAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        fillAmountWei: BigNumber,
        feeProportion: number,
        feeRecipient: string,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txOpts = {
            from,
            value: fillAmountWei,
        };
        const params = formatters.createMarketSellOrders(orders, fillAmountWei);
        const feeParams = formatters.createMarketSellOrders(feeOrders, new BigNumber(0));
        const txHash: string = await this._forwarderContract.buyTokensFee.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            feeProportion,
            feeRecipient,
            txOpts,
        );
        const tx = await this._getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async buyTokensQuoteAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        buyAmountWei: BigNumber,
    ): Promise<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
    }> {
        const params = formatters.createMarketBuyOrders(orders, buyAmountWei);
        const feeParams = formatters.createMarketBuyOrders(feeOrders, buyAmountWei);
        const quote = await this._forwarderContract.buyTokensQuote.callAsync(
            params.orders,
            feeParams.orders,
            buyAmountWei,
        );
        return quote;
    }
    public async buyNFTTokensAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        let fillAmountWei = _.reduce(
            orders,
            (prev: BigNumber, order: SignedOrder) => {
                return prev.plus(order.takerAssetAmount);
            },
            new BigNumber(0),
        );
        const feeParams = formatters.createMarketSellOrders(feeOrders, new BigNumber(0));
        const params = formatters.createMarketSellOrders(orders, fillAmountWei);
        const totalFees = _.reduce(
            orders,
            (prev: BigNumber, order: SignedOrder) => {
                return prev.plus(order.takerFee);
            },
            new BigNumber(0),
        );
        if (totalFees.greaterThan(0)) {
            const feeQuote = await this._forwarderContract.computeBuyFeesFillResult.callAsync(
                feeParams.orders,
                totalFees,
            );
            fillAmountWei = fillAmountWei.plus(feeQuote.takerAssetFilledAmount);
        }
        const txOpts = {
            from,
            value: fillAmountWei,
        };
        const txHash: string = await this._forwarderContract.buyNFTTokens.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            txOpts,
        );
        const tx = await this._getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async withdrawAllZRXAsync(from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const balanceOfZRX = await this._forwarderContract.balanceOf.callAsync(from);
        const tx = await this.withdrawZRXAsync(from, balanceOfZRX);
        return tx;
    }
    public async withdrawZRXAsync(from: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._forwarderContract.withdrawZRX.sendTransactionAsync(amount);
        const tx = await this._getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    private async _getTxWithDecodedLogsAsync(txHash: string) {
        const tx = await this._web3Wrapper.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._forwarderContract.address);
        return tx;
    }
}
