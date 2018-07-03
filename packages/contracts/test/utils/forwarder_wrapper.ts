import { assetProxyUtils } from '@0xproject/order-utils';
import { AssetProxyId, OrderWithoutExchangeAddress, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs, TxDataPayable } from 'ethereum-types';
import * as _ from 'lodash';

import { ForwarderContract } from '../../generated_contract_wrappers/forwarder';

import { constants } from './constants';
import { formatters } from './formatters';
import { LogDecoder } from './log_decoder';
import { FillResults, MarketSellOrders } from './types';

const DEFAULT_FEE_PROPORTION = 0;
const PERCENTAGE_DENOMINATOR = 10000;
const ZERO_AMOUNT = new BigNumber(0);

export class ForwarderWrapper {
    private _web3Wrapper: Web3Wrapper;
    private _forwarderContract: ForwarderContract;
    private _logDecoder: LogDecoder;
    private _zrxAddress: string;
    private static _createOptimizedSellOrders(signedOrders: SignedOrder[]): MarketSellOrders {
        const marketSellOrders = formatters.createMarketSellOrders(signedOrders, ZERO_AMOUNT);
        const assetDataId = assetProxyUtils.decodeAssetDataId(signedOrders[0].makerAssetData);
        // Contract will fill this in for us as all of the assetData is assumed to be the same
        for (let i = 0; i < signedOrders.length; i++) {
            if (i !== 0 && assetDataId === AssetProxyId.ERC20) {
                // Forwarding contract will fill this in from the first order
                marketSellOrders.orders[i].makerAssetData = constants.NULL_BYTES;
            }
            marketSellOrders.orders[i].takerAssetData = constants.NULL_BYTES;
        }
        return marketSellOrders;
    }
    private static _createOptimizedZRXSellOrders(signedOrders: SignedOrder[]): MarketSellOrders {
        const marketSellOrders = formatters.createMarketSellOrders(signedOrders, ZERO_AMOUNT);
        // Contract will fill this in for us as all of the assetData is assumed to be the same
        for (let i = 0; i < signedOrders.length; i++) {
            marketSellOrders.orders[i].makerAssetData = constants.NULL_BYTES;
            marketSellOrders.orders[i].takerAssetData = constants.NULL_BYTES;
        }
        return marketSellOrders;
    }
    private static _calculateAdditionalFeeProportionAmount(feeProportion: number, fillAmountWei: BigNumber): BigNumber {
        if (feeProportion > 0) {
            // Add to the total ETH transaction to ensure all NFTs can be filled after fees
            // 150 = 1.5% = 0.015
            const denominator = new BigNumber(1).minus(new BigNumber(feeProportion).dividedBy(PERCENTAGE_DENOMINATOR));
            return fillAmountWei.dividedBy(denominator).round(0, BigNumber.ROUND_FLOOR);
        }
        return fillAmountWei;
    }
    private static _calculateFillResults(
        order: OrderWithoutExchangeAddress,
        takerAssetFilledAmount: BigNumber,
    ): FillResults {
        const makerAssetFilledAmount = takerAssetFilledAmount
            .times(order.makerAssetAmount)
            .dividedBy(order.takerAssetAmount)
            .round(0, BigNumber.ROUND_FLOOR);
        const makerFeePaid = takerAssetFilledAmount
            .times(order.makerFee)
            .dividedBy(order.takerAssetAmount)
            .round(0, BigNumber.ROUND_FLOOR);
        const takerFeePaid = takerAssetFilledAmount
            .times(order.takerFee)
            .dividedBy(order.takerAssetAmount)
            .round(0, BigNumber.ROUND_FLOOR);
        return {
            makerAssetFilledAmount,
            takerAssetFilledAmount,
            makerFeePaid,
            takerFeePaid,
        };
    }
    private static _addFillResults(totalFillResults: FillResults, singleFillResults: FillResults): FillResults {
        const combinedFillResults = {
            makerAssetFilledAmount: totalFillResults.makerAssetFilledAmount.plus(
                singleFillResults.makerAssetFilledAmount,
            ),
            takerAssetFilledAmount: totalFillResults.takerAssetFilledAmount.plus(
                singleFillResults.takerAssetFilledAmount,
            ),
            makerFeePaid: totalFillResults.makerFeePaid.plus(singleFillResults.makerFeePaid),
            takerFeePaid: totalFillResults.takerFeePaid.plus(totalFillResults.takerFeePaid),
        };
        return combinedFillResults;
    }
    private static _calculateMarketBuyZrxResults(
        orders: OrderWithoutExchangeAddress[],
        zrxFillAmount: BigNumber,
    ): FillResults {
        let totalFillResults: FillResults = {
            makerAssetFilledAmount: new BigNumber(0),
            takerAssetFilledAmount: new BigNumber(0),
            makerFeePaid: new BigNumber(0),
            takerFeePaid: new BigNumber(0),
        };
        _.forEach(orders, order => {
            if (totalFillResults.makerAssetFilledAmount.comparedTo(zrxFillAmount) === -1) {
                const remainingZrxFillAmount = zrxFillAmount.minus(totalFillResults.makerAssetFilledAmount);
                const remainingWethSellAmount = order.takerAssetAmount
                    .times(remainingZrxFillAmount)
                    .dividedBy(order.makerAssetAmount.minus(order.takerFee))
                    .round(0, BigNumber.ROUND_FLOOR);
                const singleFillResults = ForwarderWrapper._calculateFillResults(
                    order,
                    remainingWethSellAmount.plus(1),
                );
                totalFillResults = ForwarderWrapper._addFillResults(totalFillResults, singleFillResults);
            }
        });
        return totalFillResults;
    }
    private static _calculateMarketBuyResults(
        orders: OrderWithoutExchangeAddress[],
        makerAssetFillAmount: BigNumber,
    ): FillResults {
        let totalFillResults: FillResults = {
            makerAssetFilledAmount: new BigNumber(0),
            takerAssetFilledAmount: new BigNumber(0),
            makerFeePaid: new BigNumber(0),
            takerFeePaid: new BigNumber(0),
        };
        _.forEach(orders, order => {
            if (totalFillResults.makerAssetFilledAmount.comparedTo(makerAssetFillAmount) === -1) {
                const remainingMakerAssetFillAmount = makerAssetFillAmount.minus(
                    totalFillResults.makerAssetFilledAmount,
                );
                const remainingTakerAssetFillAmount = order.takerAssetAmount
                    .times(remainingMakerAssetFillAmount)
                    .dividedBy(order.makerAssetAmount)
                    .round(0, BigNumber.ROUND_FLOOR);
                const singleFillResults = ForwarderWrapper._calculateFillResults(order, remainingTakerAssetFillAmount);
                totalFillResults = ForwarderWrapper._addFillResults(totalFillResults, singleFillResults);
            }
        });
        return totalFillResults;
    }
    constructor(contractInstance: ForwarderContract, provider: Provider, zrxAddress: string) {
        this._forwarderContract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper, this._forwarderContract.address);
        // this._web3Wrapper.abiDecoder.addABI(contractInstance.abi);
        this._zrxAddress = zrxAddress;
    }
    public async marketBuyTokensWithEthAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        makerTokenBuyAmount: BigNumber,
        txData: TxDataPayable,
        opts: { feeProportion?: number; feeRecipient?: string } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const params = ForwarderWrapper._createOptimizedSellOrders(orders);
        const feeParams = ForwarderWrapper._createOptimizedZRXSellOrders(feeOrders);
        const feeProportion = _.isUndefined(opts.feeProportion) ? DEFAULT_FEE_PROPORTION : opts.feeProportion;
        const feeRecipient = _.isUndefined(opts.feeRecipient) ? constants.NULL_ADDRESS : opts.feeRecipient;
        const txHash: string = await this._forwarderContract.marketBuyTokensWithEth.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            makerTokenBuyAmount,
            feeProportion,
            feeRecipient,
            txData,
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async marketSellEthForERC20Async(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        txData: TxDataPayable,
        opts: { feeProportion?: number; feeRecipient?: string } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const assetDataId = assetProxyUtils.decodeAssetDataId(orders[0].makerAssetData);
        if (assetDataId !== AssetProxyId.ERC20) {
            throw new Error('Asset type not supported by marketSellEthForERC20');
        }
        const params = ForwarderWrapper._createOptimizedSellOrders(orders);
        const feeParams = ForwarderWrapper._createOptimizedZRXSellOrders(feeOrders);
        const feeProportion = _.isUndefined(opts.feeProportion) ? DEFAULT_FEE_PROPORTION : opts.feeProportion;
        const feeRecipient = _.isUndefined(opts.feeRecipient) ? constants.NULL_ADDRESS : opts.feeRecipient;
        const txHash: string = await this._forwarderContract.marketSellEthForERC20.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            feeProportion,
            feeRecipient,
            txData,
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public calculateMarketBuyFillAmountWei(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        makerAssetFillAmount: BigNumber,
    ): BigNumber {
        const assetProxyId = assetProxyUtils.decodeAssetDataId(orders[0].makerAssetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20: {
                const fillAmountWei = this._calculateMarketBuyERC20FillAmount(
                    orders,
                    feeOrders,
                    feeProportion,
                    makerAssetFillAmount,
                );
                return fillAmountWei;
            }
            case AssetProxyId.ERC721: {
                const fillAmountWei = this._calculateMarketBuyERC721FillAmount(orders, feeOrders, feeProportion);
                return fillAmountWei;
            }
            default:
                throw new Error(`Invalid Asset Proxy Id: ${assetProxyId}`);
        }
    }
    private _calculateMarketBuyERC20FillAmount(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        makerAssetFillAmount: BigNumber,
    ): BigNumber {
        const makerAssetData = assetProxyUtils.decodeAssetData(orders[0].makerAssetData);
        const makerAssetToken = makerAssetData.tokenAddress;
        const params = formatters.createMarketBuyOrders(orders, makerAssetFillAmount);
        const feeParams = formatters.createMarketBuyOrders(feeOrders, ZERO_AMOUNT);

        let fillAmountWei;
        if (makerAssetToken === this._zrxAddress) {
            // If buying ZRX we buy the tokens and fees from the ZRX order in one step
            const expectedBuyFeeTokensFillResults = ForwarderWrapper._calculateMarketBuyZrxResults(
                params.orders,
                makerAssetFillAmount,
            );
            fillAmountWei = expectedBuyFeeTokensFillResults.takerAssetFilledAmount;
        } else {
            const expectedMarketBuyFillResults = ForwarderWrapper._calculateMarketBuyResults(
                params.orders,
                makerAssetFillAmount,
            );
            fillAmountWei = expectedMarketBuyFillResults.takerAssetFilledAmount;
            const expectedFeeAmount = expectedMarketBuyFillResults.takerFeePaid;
            if (expectedFeeAmount.greaterThan(ZERO_AMOUNT)) {
                const expectedFeeFillResults = ForwarderWrapper._calculateMarketBuyZrxResults(
                    feeParams.orders,
                    expectedFeeAmount,
                );
                fillAmountWei = fillAmountWei.plus(expectedFeeFillResults.takerAssetFilledAmount);
            }
        }
        fillAmountWei = ForwarderWrapper._calculateAdditionalFeeProportionAmount(feeProportion, fillAmountWei);
        return fillAmountWei;
    }
    private _calculateMarketBuyERC721FillAmount(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
    ): BigNumber {
        // Total cost when buying ERC721 is the total cost of all ERC721 orders + any fee abstraction
        let fillAmountWei = _.reduce(
            orders,
            (totalAmount: BigNumber, order: SignedOrder) => {
                return totalAmount.plus(order.takerAssetAmount);
            },
            ZERO_AMOUNT,
        );
        const totalFees = _.reduce(
            orders,
            (totalAmount: BigNumber, order: SignedOrder) => {
                return totalAmount.plus(order.takerFee);
            },
            ZERO_AMOUNT,
        );
        if (totalFees.greaterThan(ZERO_AMOUNT)) {
            // Calculate the ZRX fee abstraction cost
            const emptyFeeOrders: SignedOrder[] = [];
            const expectedFeeAmountWei = this._calculateMarketBuyERC20FillAmount(
                feeOrders,
                emptyFeeOrders,
                DEFAULT_FEE_PROPORTION,
                totalFees,
            );
            fillAmountWei = fillAmountWei.plus(expectedFeeAmountWei);
        }
        fillAmountWei = ForwarderWrapper._calculateAdditionalFeeProportionAmount(feeProportion, fillAmountWei);
        return fillAmountWei;
    }
}
