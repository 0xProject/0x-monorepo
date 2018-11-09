import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs, TxDataPayable } from 'ethereum-types';
import * as _ from 'lodash';

import { ForwarderContract } from '../../generated-wrappers/forwarder';

import { constants } from './constants';
import { formatters } from './formatters';
import { LogDecoder } from './log_decoder';
import { MarketSellOrders } from './types';

export class ForwarderWrapper {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _forwarderContract: ForwarderContract;
    private readonly _logDecoder: LogDecoder;
    public static getPercentageOfValue(value: BigNumber, percentage: number): BigNumber {
        const numerator = constants.PERCENTAGE_DENOMINATOR.times(percentage).dividedToIntegerBy(100);
        const newValue = value.times(numerator).dividedToIntegerBy(constants.PERCENTAGE_DENOMINATOR);
        return newValue;
    }
    public static getWethForFeeOrders(feeAmount: BigNumber, feeOrders: SignedOrder[]): BigNumber {
        let wethAmount = new BigNumber(0);
        let remainingFeeAmount = feeAmount;
        _.forEach(feeOrders, feeOrder => {
            const feeAvailable = feeOrder.makerAssetAmount.minus(feeOrder.takerFee);
            if (!remainingFeeAmount.isZero() && feeAvailable.gt(remainingFeeAmount)) {
                wethAmount = wethAmount.plus(
                    feeOrder.takerAssetAmount
                        .times(remainingFeeAmount)
                        .dividedBy(feeAvailable)
                        .ceil(),
                );
                remainingFeeAmount = new BigNumber(0);
            } else if (!remainingFeeAmount.isZero()) {
                wethAmount = wethAmount.plus(feeOrder.takerAssetAmount);
                remainingFeeAmount = remainingFeeAmount.minus(feeAvailable);
            }
        });
        return wethAmount;
    }
    private static _createOptimizedOrders(signedOrders: SignedOrder[]): MarketSellOrders {
        _.forEach(signedOrders, (signedOrder, index) => {
            signedOrder.takerAssetData = constants.NULL_BYTES;
            if (index > 0) {
                signedOrder.makerAssetData = constants.NULL_BYTES;
            }
        });
        const params = formatters.createMarketSellOrders(signedOrders, constants.ZERO_AMOUNT);
        return params;
    }
    private static _createOptimizedZrxOrders(signedOrders: SignedOrder[]): MarketSellOrders {
        _.forEach(signedOrders, signedOrder => {
            signedOrder.makerAssetData = constants.NULL_BYTES;
            signedOrder.takerAssetData = constants.NULL_BYTES;
        });
        const params = formatters.createMarketSellOrders(signedOrders, constants.ZERO_AMOUNT);
        return params;
    }
    constructor(contractInstance: ForwarderContract, provider: Provider) {
        this._forwarderContract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper);
    }
    public async marketSellOrdersWithEthAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        txData: TxDataPayable,
        opts: { feePercentage?: BigNumber; feeRecipient?: string } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = ForwarderWrapper._createOptimizedOrders(orders);
        const feeParams = ForwarderWrapper._createOptimizedZrxOrders(feeOrders);
        const feePercentage = _.isUndefined(opts.feePercentage) ? constants.ZERO_AMOUNT : opts.feePercentage;
        const feeRecipient = _.isUndefined(opts.feeRecipient) ? constants.NULL_ADDRESS : opts.feeRecipient;
        const txHash = await this._forwarderContract.marketSellOrdersWithEth.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            feePercentage,
            feeRecipient,
            txData,
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async marketBuyOrdersWithEthAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        makerAssetFillAmount: BigNumber,
        txData: TxDataPayable,
        opts: { feePercentage?: BigNumber; feeRecipient?: string } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = ForwarderWrapper._createOptimizedOrders(orders);
        const feeParams = ForwarderWrapper._createOptimizedZrxOrders(feeOrders);
        const feePercentage = _.isUndefined(opts.feePercentage) ? constants.ZERO_AMOUNT : opts.feePercentage;
        const feeRecipient = _.isUndefined(opts.feeRecipient) ? constants.NULL_ADDRESS : opts.feeRecipient;
        const txHash = await this._forwarderContract.marketBuyOrdersWithEth.sendTransactionAsync(
            params.orders,
            makerAssetFillAmount,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            feePercentage,
            feeRecipient,
            txData,
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async withdrawAssetAsync(
        assetData: string,
        amount: BigNumber,
        txData: TxDataPayable,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._forwarderContract.withdrawAsset.sendTransactionAsync(assetData, amount, txData);
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
}
