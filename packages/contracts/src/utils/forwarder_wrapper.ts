import { assetProxyUtils } from '@0xproject/order-utils';
import { AssetProxyId, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { ForwarderContract } from '../../src/generated_contract_wrappers/forwarder';
import { formatters } from '../../src/utils/formatters';

import { constants } from './constants';
import { MarketSellOrders } from './types';

const DEFAULT_FEE_PROPORTION = 0;
const PERCENTAGE_DENOMINATOR = 10000;
const ZERO_AMOUNT = new BigNumber(0);

export class ForwarderWrapper {
    private _web3Wrapper: Web3Wrapper;
    private _forwarderContract: ForwarderContract;
    private _zrxAddressBuffer: Buffer;
    private static _createOptimizedSellOrders(signedOrders: SignedOrder[]): MarketSellOrders {
        const marketSellOrders = formatters.createMarketSellOrders(signedOrders, ZERO_AMOUNT);
        const proxyId = assetProxyUtils.decodeAssetDataId(signedOrders[0].makerAssetData);
        // Contract will fill this in for us as all of the assetData is assumed to be the same
        for (let i = 0; i < signedOrders.length; i++) {
            if (i !== 0 && proxyId === AssetProxyId.ERC20) {
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
            return fillAmountWei.dividedBy(denominator).round(0, BigNumber.ROUND_UP);
        }
        return fillAmountWei;
    }
    constructor(contractInstance: ForwarderContract, provider: Provider, zrxAddress: string) {
        this._forwarderContract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._web3Wrapper.abiDecoder.addABI(contractInstance.abi);
        this._zrxAddressBuffer = ethUtil.toBuffer(zrxAddress);
    }
    public async buyExactAssetsAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        opts: {
            assetAmount: BigNumber;
            fillAmountWei: BigNumber;
            from: string;
        },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this.buyExactAssetsFeeAsync(
            orders,
            feeOrders,
            DEFAULT_FEE_PROPORTION,
            constants.NULL_ADDRESS,
            opts,
        );
        return tx;
    }
    public async buyExactAssetsFeeAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        feeRecipient: string,
        opts: {
            assetAmount: BigNumber;
            fillAmountWei: BigNumber;
            from: string;
        },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txOpts = {
            from: opts.from,
            value: opts.fillAmountWei,
        };
        const params = ForwarderWrapper._createOptimizedSellOrders(orders);
        const feeParams = ForwarderWrapper._createOptimizedZRXSellOrders(feeOrders);
        const txHash: string = await this._forwarderContract.buyExactAssets.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            opts.assetAmount,
            feeProportion,
            feeRecipient,
            txOpts,
        );
        const tx = await this._getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async marketBuyTokensAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        opts: {
            fillAmountWei: BigNumber;
            from: string;
        },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this.marketBuyTokensFeeAsync(
            orders,
            feeOrders,
            DEFAULT_FEE_PROPORTION,
            constants.NULL_ADDRESS,
            opts,
        );
        return tx;
    }
    public async marketBuyTokensFeeAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        feeRecipient: string,
        opts: {
            fillAmountWei: BigNumber;
            from: string;
        },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const proxyId = assetProxyUtils.decodeAssetDataId(orders[0].makerAssetData);
        if (proxyId !== AssetProxyId.ERC20) {
            throw new Error('Asset type not supported by marketBuyTokens');
        }
        const params = ForwarderWrapper._createOptimizedSellOrders(orders);
        const feeParams = ForwarderWrapper._createOptimizedZRXSellOrders(feeOrders);
        const txOpts = {
            from: opts.from,
            value: opts.fillAmountWei,
        };
        const txHash: string = await this._forwarderContract.marketBuyTokens.sendTransactionAsync(
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
    public async calculateBuyExactFillAmountWeiAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        feeRecipient: string,
        makerAssetAmount: BigNumber,
    ): Promise<BigNumber> {
        const proxyId = assetProxyUtils.decodeAssetDataId(orders[0].makerAssetData);
        switch (proxyId) {
            case AssetProxyId.ERC20: {
                const fillAmountWei = await this._calculateBuyExactERC20FillAmountAsync(
                    orders,
                    feeOrders,
                    feeProportion,
                    makerAssetAmount,
                );
                return fillAmountWei;
            }
            case AssetProxyId.ERC721: {
                const fillAmountWei = await this._calculateBuyExactERC721FillAmountAsync(
                    orders,
                    feeOrders,
                    feeProportion,
                );
                return fillAmountWei;
            }
            default:
                throw new Error(`Invalid Asset Proxy Id: ${proxyId}`);
        }
    }
    private async _calculateBuyExactERC20FillAmountAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        makerAssetAmount: BigNumber,
    ): Promise<BigNumber> {
        const makerAssetData = assetProxyUtils.decodeAssetData(orders[0].makerAssetData);
        const makerAssetToken = ethUtil.toBuffer(makerAssetData.tokenAddress);
        const params = formatters.createMarketBuyOrders(orders, makerAssetAmount);
        const feeParams = ForwarderWrapper._createOptimizedZRXSellOrders(feeOrders);

        let fillAmountWei;
        if (makerAssetToken.equals(this._zrxAddressBuffer)) {
            // If buying ZRX we buy the tokens and fees from the ZRX order in one step
            const expectedBuyFeeTokensFillResults = await this._forwarderContract.calculateBuyFeesFillResults.callAsync(
                params.orders,
                makerAssetAmount,
            );
            fillAmountWei = expectedBuyFeeTokensFillResults.takerAssetFilledAmount;
        } else {
            const expectedMarketBuyFillResults = await this._forwarderContract.calculateMarketBuyFillResults.callAsync(
                params.orders,
                makerAssetAmount,
            );
            fillAmountWei = expectedMarketBuyFillResults.takerAssetFilledAmount;
            const expectedFeeAmount = expectedMarketBuyFillResults.takerFeePaid;
            if (expectedFeeAmount.greaterThan(ZERO_AMOUNT)) {
                const expectedFeeFillResults = await this._forwarderContract.calculateBuyFeesFillResults.callAsync(
                    feeParams.orders,
                    expectedFeeAmount,
                );
                fillAmountWei = fillAmountWei.plus(expectedFeeFillResults.takerAssetFilledAmount);
            }
        }
        fillAmountWei = ForwarderWrapper._calculateAdditionalFeeProportionAmount(feeProportion, fillAmountWei);
        return fillAmountWei;
    }
    private async _calculateBuyExactERC721FillAmountAsync(
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
            const expectedFeeAmountWei = await this._calculateBuyExactERC20FillAmountAsync(
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
    private async _getTxWithDecodedLogsAsync(txHash: string): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this._web3Wrapper.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._forwarderContract.address);
        return tx;
    }
}
