import { ZeroEx } from '0x.js';
import { TransactionReceiptWithDecodedLogs } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { formatters } from '../../src/utils/formatters';
import { ForwarderContract } from '../contract_wrappers/generated/forwarder';

import { AssetProxyId, SignedOrder } from './types';

const DEFAULT_FEE_PROPORTION = 0;
const PERCENTAGE_DENOMINATOR = 10000;
const ZERO_AMOUNT = new BigNumber(0);

export class ForwarderWrapper {
    private _web3Wrapper: Web3Wrapper;
    private _forwarderContract: ForwarderContract;
    private _zrxAddressBuffer: Buffer;
    constructor(contractInstance: ForwarderContract, web3Wrapper: Web3Wrapper, zrxAddress: string) {
        this._forwarderContract = contractInstance;
        this._web3Wrapper = web3Wrapper;
        this._web3Wrapper.abiDecoder.addABI(contractInstance.abi);
        this._zrxAddressBuffer = ethUtil.toBuffer(zrxAddress);
    }
    public async buyExactTokensAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        opts: {
            from: string;
            tokenAmount: BigNumber;
            fillAmountWei: BigNumber;
        },
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txOpts = {
            from: opts.from,
            value: opts.fillAmountWei,
        };
        const params = formatters.createMarketBuyOrders(orders, opts.fillAmountWei);
        const feeParams = formatters.createMarketBuyOrders(feeOrders, ZERO_AMOUNT);
        const txHash: string = await this._forwarderContract.buyExactTokens.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            opts.tokenAmount,
            DEFAULT_FEE_PROPORTION,
            ZeroEx.NULL_ADDRESS,
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
            ZeroEx.NULL_ADDRESS,
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
        const makerAssetData = ethUtil.toBuffer(orders[0].makerAssetData);
        const proxyId = makerAssetData[0];
        if (proxyId !== AssetProxyId.ERC20) {
            throw new Error('Proxy type not supported by marketBuyTokens');
        }
        const txOpts = {
            from: opts.from,
            value: opts.fillAmountWei,
        };
        const params = formatters.createMarketSellOrders(orders, opts.fillAmountWei);
        const feeParams = formatters.createMarketSellOrders(feeOrders, ZERO_AMOUNT);
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
        tokenAmount: BigNumber,
    ): Promise<BigNumber> {
        const makerAssetData = ethUtil.toBuffer(orders[0].makerAssetData);
        const proxyId = makerAssetData[0];
        if (proxyId === AssetProxyId.ERC20) {
            const fillAmountWei = await this._calculateBuyExactTokensFillAmountAsync(
                orders,
                feeOrders,
                feeProportion,
                feeRecipient,
                tokenAmount,
            );
            return fillAmountWei;
        } else if (proxyId === AssetProxyId.ERC721) {
            const fillAmountWei = await this._calculateBuyExactNFTFillAmountAsync(
                orders,
                feeOrders,
                feeProportion,
                feeRecipient,
            );
            return fillAmountWei;
        }
        throw new Error(`Invalid Asset Proxy Id: ${proxyId}`);
    }
    private async _calculateBuyExactTokensFillAmountAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        feeRecipient: string,
        tokenAmount: BigNumber,
    ): Promise<BigNumber> {
        const makerAssetData = ethUtil.toBuffer(orders[0].makerAssetData);
        const makerAssetToken = makerAssetData.slice(1, 21);
        const params = formatters.createMarketBuyOrders(orders, tokenAmount);
        const feeParams = formatters.createMarketSellOrders(feeOrders, ZERO_AMOUNT);

        let fillAmountWei;
        if (makerAssetToken.equals(this._zrxAddressBuffer)) {
            // If buying ZRX we buy the tokens and fees from the ZRX order in one step
            const expectedBuyFeeTokensFillResults = await this._forwarderContract.expectedBuyFeesFillResults.callAsync(
                params.orders,
                tokenAmount,
            );
            fillAmountWei = expectedBuyFeeTokensFillResults.takerAssetFilledAmount;
        } else {
            const expectedMarketBuyFillResults = await this._forwarderContract.expectedMaketBuyFillResults.callAsync(
                params.orders,
                tokenAmount,
            );
            fillAmountWei = expectedMarketBuyFillResults.takerAssetFilledAmount;
            const expectedFeeAmount = expectedMarketBuyFillResults.takerFeePaid;
            if (expectedFeeAmount.greaterThan(ZERO_AMOUNT)) {
                const expectedFeeFillResults = await this._forwarderContract.expectedBuyFeesFillResults.callAsync(
                    feeParams.orders,
                    expectedFeeAmount,
                );
                fillAmountWei = fillAmountWei.plus(expectedFeeFillResults.takerAssetFilledAmount);
            }
        }
        fillAmountWei = this._calculateAdditionalFeeProportionAmount(feeProportion, fillAmountWei);
        return fillAmountWei;
    }
    private async _calculateBuyExactNFTFillAmountAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        feeProportion: number,
        feeRecipient: string,
    ): Promise<BigNumber> {
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
        const params = formatters.createMarketSellOrders(orders, fillAmountWei);
        const feeParams = formatters.createMarketSellOrders(feeOrders, ZERO_AMOUNT);
        if (totalFees.greaterThan(ZERO_AMOUNT)) {
            const expectedFeeFillResults = await this._forwarderContract.expectedBuyFeesFillResults.callAsync(
                feeParams.orders,
                totalFees,
            );
            fillAmountWei = fillAmountWei.plus(expectedFeeFillResults.takerAssetFilledAmount);
        }
        fillAmountWei = this._calculateAdditionalFeeProportionAmount(feeProportion, fillAmountWei);
        return fillAmountWei;
    }
    // tslint:disable-next-line:prefer-function-over-method
    private _calculateAdditionalFeeProportionAmount(feeProportion: number, fillAmountWei: BigNumber): BigNumber {
        if (feeProportion > 0) {
            // Add to the total ETH transaction to ensure all NFTs can be filled after fees
            // 150 = 1.5% = 0.015
            const denominator = new BigNumber(1).minus(new BigNumber(feeProportion).dividedBy(PERCENTAGE_DENOMINATOR));
            return fillAmountWei.dividedBy(denominator).round(0, BigNumber.ROUND_UP);
        }
        return fillAmountWei;
    }
    private async _getTxWithDecodedLogsAsync(txHash: string) {
        const tx = await this._web3Wrapper.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._forwarderContract.address);
        return tx;
    }
}
