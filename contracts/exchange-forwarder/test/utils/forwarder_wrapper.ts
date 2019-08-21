import { artifacts as erc20Artifacts } from '@0x/contracts-erc20';
import { artifacts as erc721Artifacts } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts } from '@0x/contracts-exchange';
import { constants, LogDecoder, Web3ProviderEngine } from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs, TxDataPayable } from 'ethereum-types';
import * as _ from 'lodash';

import { ForwarderContract } from '../../generated-wrappers/forwarder';
import { artifacts } from '../../src/artifacts';

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
                        .integerValue(BigNumber.ROUND_CEIL),
                );
                remainingFeeAmount = new BigNumber(0);
            } else if (!remainingFeeAmount.isZero()) {
                wethAmount = wethAmount.plus(feeOrder.takerAssetAmount);
                remainingFeeAmount = remainingFeeAmount.minus(feeAvailable);
            }
        });
        return wethAmount;
    }
    constructor(contractInstance: ForwarderContract, provider: Web3ProviderEngine) {
        this._forwarderContract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper, {
            ...artifacts,
            ...exchangeArtifacts,
            ...erc20Artifacts,
            ...erc721Artifacts,
        });
    }
    public async marketSellOrdersWithEthAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        txData: TxDataPayable,
        opts: { feePercentage?: BigNumber; feeRecipient?: string } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const feePercentage = opts.feePercentage === undefined ? constants.ZERO_AMOUNT : opts.feePercentage;
        const feeRecipient = opts.feeRecipient === undefined ? constants.NULL_ADDRESS : opts.feeRecipient;
        const txHash = await this._forwarderContract.marketSellOrdersWithEth.sendTransactionAsync(
            orders,
            orders.map(signedOrder => signedOrder.signature),
            feeOrders,
            feeOrders.map(signedFeeOrder => signedFeeOrder.signature),
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
        const feePercentage = opts.feePercentage === undefined ? constants.ZERO_AMOUNT : opts.feePercentage;
        const feeRecipient = opts.feeRecipient === undefined ? constants.NULL_ADDRESS : opts.feeRecipient;
        const txHash = await this._forwarderContract.marketBuyOrdersWithEth.sendTransactionAsync(
            orders,
            makerAssetFillAmount,
            orders.map(signedOrder => signedOrder.signature),
            feeOrders,
            feeOrders.map(signedFeeOrder => signedFeeOrder.signature),
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
