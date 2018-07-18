import { assetDataUtils } from '@0xproject/order-utils';
import { AssetProxyId, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs, TxDataPayable } from 'ethereum-types';
import * as _ from 'lodash';

import { ForwarderContract } from '../../generated_contract_wrappers/forwarder';

import { constants } from './constants';
import { formatters } from './formatters';
import { LogDecoder } from './log_decoder';
import { MarketSellOrders } from './types';

const DEFAULT_FEE_PROPORTION = 0;
const PERCENTAGE_DENOMINATOR = 10000;
const ZERO_AMOUNT = new BigNumber(0);
const INSUFFICENT_ORDERS_FOR_MAKER_AMOUNT = 'Unable to satisfy makerAssetFillAmount with provided orders';

export class ForwarderWrapper {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _forwarderContract: ForwarderContract;
    private readonly _logDecoder: LogDecoder;
    private readonly _zrxAddress: string;
    private static _createOptimizedSellOrders(signedOrders: SignedOrder[]): MarketSellOrders {
        const marketSellOrders = formatters.createMarketSellOrders(signedOrders, ZERO_AMOUNT);
        const assetDataId = assetDataUtils.decodeAssetProxyId(signedOrders[0].makerAssetData);
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
        const assetDataId = assetDataUtils.decodeAssetProxyId(orders[0].makerAssetData);
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
    public async calculateMarketBuyFillAmountWeiAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        makerAssetFillAmount: BigNumber,
    ): Promise<BigNumber> {
        const assetProxyId = assetDataUtils.decodeAssetProxyId(orders[0].makerAssetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20: {
                const fillAmountWei = this._calculateMarketBuyERC20FillAmountAsync(
                    orders,
                    feeOrders,
                    feeProportion,
                    makerAssetFillAmount,
                );
                return fillAmountWei;
            }
            case AssetProxyId.ERC721: {
                const fillAmountWei = await this._calculateMarketBuyERC721FillAmountAsync(
                    orders,
                    feeOrders,
                    feeProportion,
                );
                return fillAmountWei;
            }
            default:
                throw new Error(`Invalid Asset Proxy Id: ${assetProxyId}`);
        }
    }
    private async _calculateMarketBuyERC20FillAmountAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        makerAssetFillAmount: BigNumber,
    ): Promise<BigNumber> {
        const makerAssetData = assetDataUtils.decodeAssetData(orders[0].makerAssetData);
        const makerAssetToken = makerAssetData.tokenAddress;
        const params = formatters.createMarketBuyOrders(orders, makerAssetFillAmount);

        let fillAmountWei;
        if (makerAssetToken === this._zrxAddress) {
            // If buying ZRX we buy the tokens and fees from the ZRX order in one step
            const expectedBuyFeeTokensFillResults = await this._forwarderContract.calculateMarketBuyZrxResults.callAsync(
                params.orders,
                makerAssetFillAmount,
            );
            if (expectedBuyFeeTokensFillResults.makerAssetFilledAmount.lessThan(makerAssetFillAmount)) {
                throw new Error(INSUFFICENT_ORDERS_FOR_MAKER_AMOUNT);
            }
            fillAmountWei = expectedBuyFeeTokensFillResults.takerAssetFilledAmount;
        } else {
            const expectedMarketBuyFillResults = await this._forwarderContract.calculateMarketBuyResults.callAsync(
                params.orders,
                makerAssetFillAmount,
            );
            if (expectedMarketBuyFillResults.makerAssetFilledAmount.lessThan(makerAssetFillAmount)) {
                throw new Error(INSUFFICENT_ORDERS_FOR_MAKER_AMOUNT);
            }
            fillAmountWei = expectedMarketBuyFillResults.takerAssetFilledAmount;
            const expectedFeeAmount = expectedMarketBuyFillResults.takerFeePaid;
            if (expectedFeeAmount.greaterThan(ZERO_AMOUNT)) {
                const expectedFeeFillFillAmountWei = await this._calculateMarketBuyERC20FillAmountAsync(
                    feeOrders,
                    [],
                    DEFAULT_FEE_PROPORTION,
                    expectedFeeAmount,
                );
                fillAmountWei = fillAmountWei.plus(expectedFeeFillFillAmountWei);
            }
        }
        fillAmountWei = ForwarderWrapper._calculateAdditionalFeeProportionAmount(feeProportion, fillAmountWei);
        return fillAmountWei;
    }
    private async _calculateMarketBuyERC721FillAmountAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
    ): Promise<BigNumber> {
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
            const expectedFeeAmountWei = await this._calculateMarketBuyERC20FillAmountAsync(
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
