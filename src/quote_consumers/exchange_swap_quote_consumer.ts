import { ContractAddresses } from '@0x/contract-addresses';
import { ExchangeContract } from '@0x/contracts-exchange';
import { AbiEncoder, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    ExchangeSmartContractParams,
    MarketOperation,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class ExchangeSwapQuoteConsumer implements SwapQuoteConsumerBase<ExchangeSmartContractParams> {
    public readonly provider: ZeroExProvider;
    public readonly chainId: number;

    private readonly _exchangeContract: ExchangeContract;

    constructor(
        supportedProvider: SupportedProvider,
        contractAddresses: ContractAddresses,
        options: Partial<SwapQuoteConsumerOpts> = {},
    ) {
        const { chainId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('chainId', chainId);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.chainId = chainId;
        this._exchangeContract = new ExchangeContract(contractAddresses.exchange, supportedProvider);
    }

    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<CalldataInfo> {
        assert.isValidSwapQuote('quote', quote);

        const { toAddress, methodAbi, ethAmount, params } = await this.getSmartContractParamsOrThrowAsync(quote, opts);

        const abiEncoder = new AbiEncoder.Method(methodAbi);

        const { orders, signatures } = params;
        let args: any[];
        if (params.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = params;
            args = [orders, makerAssetFillAmount, signatures];
        } else {
            const { takerAssetFillAmount } = params;
            args = [orders, takerAssetFillAmount, signatures];
        }
        const calldataHexString = abiEncoder.encode(args, { shouldOptimize: true });
        return {
            calldataHexString,
            methodAbi,
            toAddress,
            ethAmount,
        };
    }

    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        _opts: Partial<SwapQuoteGetOutputOpts> = {},
    ): Promise<SmartContractParamsInfo<ExchangeSmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);

        const { orders } = quote;

        const signatures = _.map(orders, o => o.signature);

        let params: ExchangeSmartContractParams;
        let methodName: string;

        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;

            params = {
                orders,
                signatures,
                makerAssetFillAmount,
                type: MarketOperation.Buy,
            };

            methodName = 'marketBuyOrdersFillOrKill';
        } else {
            const { takerAssetFillAmount } = quote;

            params = {
                orders,
                signatures,
                takerAssetFillAmount,
                type: MarketOperation.Sell,
            };

            methodName = 'marketSellOrdersFillOrKill';
        }

        const methodAbi = utils.getMethodAbiFromContractAbi(this._exchangeContract.abi, methodName) as MethodAbi;

        return {
            params,
            toAddress: this._exchangeContract.address,
            methodAbi,
            ethAmount: quote.worstCaseQuoteInfo.protocolFeeInWeiAmount,
        };
    }

    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        assert.isValidSwapQuote('quote', quote);

        const { takerAddress, gasLimit, ethAmount } = opts;

        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }
        const { orders, gasPrice } = quote;

        const finalTakerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);
        const value = ethAmount || quote.worstCaseQuoteInfo.protocolFeeInEthAmount;
        let txHash: string;
        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;
            txHash = await this._exchangeContract
                .marketBuyOrdersFillOrKill(orders, makerAssetFillAmount, orders.map(o => o.signature))
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value,
                });
        } else {
            const { takerAssetFillAmount } = quote;
            txHash = await this._exchangeContract
                .marketSellOrdersFillOrKill(orders, takerAssetFillAmount, orders.map(o => o.signature))
                .sendTransactionAsync({
                    from: finalTakerAddress,
                    gas: gasLimit,
                    gasPrice,
                    value,
                });
        }
        // TODO(dorothy-zbornak): Handle signature request denied
        // (see contract-wrappers/decorators)
        // and ExchangeRevertErrors.IncompleteFillError.
        return txHash;
    }
}
