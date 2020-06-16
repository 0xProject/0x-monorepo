import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { constants as contractConstants, getRandomInteger, Numberish, randomAddress } from '@0x/contracts-test-utils';
import {
    decodeFillQuoteTransformerData,
    decodePayTakerTransformerData,
    decodeWethTransformerData,
    ETH_TOKEN_ADDRESS,
    FillQuoteTransformerSide,
} from '@0x/contracts-zero-ex';
import { assetDataUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { AbiEncoder, BigNumber, hexUtils } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { constants } from '../src/constants';
import {
    ExchangeProxySwapQuoteConsumer,
    getTransformerAddress,
} from '../src/quote_consumers/exchange_proxy_swap_quote_consumer';
import { MarketBuySwapQuote, MarketOperation, MarketSellSwapQuote } from '../src/types';
import { OptimizedMarketOrder } from '../src/utils/market_operation_utils/types';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const { NULL_ADDRESS } = constants;
const { MAX_UINT256 } = contractConstants;

// tslint:disable: custom-no-magic-numbers

describe('ExchangeProxySwapQuoteConsumer', () => {
    const CHAIN_ID = 1;
    const TAKER_TOKEN = randomAddress();
    const MAKER_TOKEN = randomAddress();
    const TRANSFORMER_DEPLOYER = randomAddress();
    const contractAddresses = {
        ...getContractAddressesForChainOrThrow(CHAIN_ID),
        exchangeProxy: randomAddress(),
        exchangeProxyAllowanceTarget: randomAddress(),
        exchangeProxyTransformerDeployer: TRANSFORMER_DEPLOYER,
        transformers: {
            wethTransformer: getTransformerAddress(TRANSFORMER_DEPLOYER, 1),
            payTakerTransformer: getTransformerAddress(TRANSFORMER_DEPLOYER, 2),
            fillQuoteTransformer: getTransformerAddress(TRANSFORMER_DEPLOYER, 3),
        },
    };
    let consumer: ExchangeProxySwapQuoteConsumer;

    before(async () => {
        const fakeProvider = {
            async sendAsync(): Promise<void> {
                /* noop */
            },
        };
        consumer = new ExchangeProxySwapQuoteConsumer(fakeProvider, contractAddresses, { chainId: CHAIN_ID });
    });

    function getRandomAmount(maxAmount: Numberish = '1e18'): BigNumber {
        return getRandomInteger(1, maxAmount);
    }

    function createAssetData(token?: string): string {
        return assetDataUtils.encodeERC20AssetData(token || randomAddress());
    }

    function getRandomOrder(): OptimizedMarketOrder {
        return {
            fillableMakerAssetAmount: getRandomAmount(),
            fillableTakerFeeAmount: getRandomAmount(),
            fillableTakerAssetAmount: getRandomAmount(),
            fills: [],
            chainId: CHAIN_ID,
            exchangeAddress: contractAddresses.exchange,
            expirationTimeSeconds: getRandomInteger(1, 2e9),
            feeRecipientAddress: randomAddress(),
            makerAddress: randomAddress(),
            makerAssetAmount: getRandomAmount(),
            takerAssetAmount: getRandomAmount(),
            makerFee: getRandomAmount(),
            takerFee: getRandomAmount(),
            salt: getRandomAmount(2e9),
            signature: hexUtils.random(66),
            senderAddress: NULL_ADDRESS,
            takerAddress: NULL_ADDRESS,
            makerAssetData: createAssetData(MAKER_TOKEN),
            takerAssetData: createAssetData(TAKER_TOKEN),
            makerFeeAssetData: createAssetData(),
            takerFeeAssetData: createAssetData(),
        };
    }

    function getRandomQuote(side: MarketOperation): MarketBuySwapQuote | MarketSellSwapQuote {
        return {
            gasPrice: getRandomInteger(1, 1e9),
            type: side,
            makerAssetData: createAssetData(MAKER_TOKEN),
            takerAssetData: createAssetData(TAKER_TOKEN),
            orders: [getRandomOrder()],
            bestCaseQuoteInfo: {
                feeTakerAssetAmount: getRandomAmount(),
                makerAssetAmount: getRandomAmount(),
                gas: Math.floor(Math.random() * 8e6),
                protocolFeeInWeiAmount: getRandomAmount(),
                takerAssetAmount: getRandomAmount(),
                totalTakerAssetAmount: getRandomAmount(),
            },
            worstCaseQuoteInfo: {
                feeTakerAssetAmount: getRandomAmount(),
                makerAssetAmount: getRandomAmount(),
                gas: Math.floor(Math.random() * 8e6),
                protocolFeeInWeiAmount: getRandomAmount(),
                takerAssetAmount: getRandomAmount(),
                totalTakerAssetAmount: getRandomAmount(),
            },
            ...(side === MarketOperation.Buy
                ? { makerAssetFillAmount: getRandomAmount() }
                : { takerAssetFillAmount: getRandomAmount() }),
        } as any;
    }

    function getRandomSellQuote(): MarketSellSwapQuote {
        return getRandomQuote(MarketOperation.Sell) as MarketSellSwapQuote;
    }

    function getRandomBuyQuote(): MarketBuySwapQuote {
        return getRandomQuote(MarketOperation.Buy) as MarketBuySwapQuote;
    }

    type PlainOrder = Exclude<Order, ['chainId', 'exchangeAddress']>;

    function cleanOrders(orders: OptimizedMarketOrder[]): PlainOrder[] {
        return orders.map(
            o =>
                _.omit(o, [
                    'chainId',
                    'exchangeAddress',
                    'fillableMakerAssetAmount',
                    'fillableTakerAssetAmount',
                    'fillableTakerFeeAmount',
                    'fills',
                    'signature',
                ]) as PlainOrder,
        );
    }

    const callDataEncoder = AbiEncoder.createMethod('transformERC20', [
        { type: 'address', name: 'inputToken' },
        { type: 'address', name: 'outputToken' },
        { type: 'uint256', name: 'inputTokenAmount' },
        { type: 'uint256', name: 'minOutputTokenAmount' },
        {
            type: 'tuple[]',
            name: 'transformations',
            components: [{ type: 'uint32', name: 'deploymentNonce' }, { type: 'bytes', name: 'data' }],
        },
    ]);

    interface CallArgs {
        inputToken: string;
        outputToken: string;
        inputTokenAmount: BigNumber;
        minOutputTokenAmount: BigNumber;
        transformations: Array<{
            deploymentNonce: BigNumber;
            data: string;
        }>;
    }

    describe('getCalldataOrThrow()', () => {
        it('can produce a sell quote', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote);
            const callArgs = callDataEncoder.decode(callInfo.calldataHexString) as CallArgs;
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAssetAmount);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.makerAssetAmount);
            expect(callArgs.transformations).to.be.length(2);
            expect(
                callArgs.transformations[0].deploymentNonce.toNumber() ===
                    consumer.transformerNonces.fillQuoteTransformer,
            );
            expect(
                callArgs.transformations[1].deploymentNonce.toNumber() ===
                    consumer.transformerNonces.payTakerTransformer,
            );
            const fillQuoteTransformerData = decodeFillQuoteTransformerData(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(FillQuoteTransformerSide.Sell);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(quote.takerAssetFillAmount);
            expect(fillQuoteTransformerData.orders).to.deep.eq(cleanOrders(quote.orders));
            expect(fillQuoteTransformerData.signatures).to.deep.eq(quote.orders.map(o => o.signature));
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = decodePayTakerTransformerData(callArgs.transformations[1].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, MAKER_TOKEN, ETH_TOKEN_ADDRESS]);
        });

        it('can produce a buy quote', async () => {
            const quote = getRandomBuyQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote);
            const callArgs = callDataEncoder.decode(callInfo.calldataHexString) as CallArgs;
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAssetAmount);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.makerAssetAmount);
            expect(callArgs.transformations).to.be.length(2);
            expect(
                callArgs.transformations[0].deploymentNonce.toNumber() ===
                    consumer.transformerNonces.fillQuoteTransformer,
            );
            expect(
                callArgs.transformations[1].deploymentNonce.toNumber() ===
                    consumer.transformerNonces.payTakerTransformer,
            );
            const fillQuoteTransformerData = decodeFillQuoteTransformerData(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(FillQuoteTransformerSide.Buy);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(quote.makerAssetFillAmount);
            expect(fillQuoteTransformerData.orders).to.deep.eq(cleanOrders(quote.orders));
            expect(fillQuoteTransformerData.signatures).to.deep.eq(quote.orders.map(o => o.signature));
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = decodePayTakerTransformerData(callArgs.transformations[1].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, MAKER_TOKEN, ETH_TOKEN_ADDRESS]);
        });

        it('ERC20 -> ERC20 does not have a WETH transformer', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote);
            const callArgs = callDataEncoder.decode(callInfo.calldataHexString) as CallArgs;
            const nonces = callArgs.transformations.map(t => t.deploymentNonce);
            expect(nonces).to.not.include(consumer.transformerNonces.wethTransformer);
        });

        it('ETH -> ERC20 has a WETH transformer before the fill', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { isFromETH: true },
            });
            const callArgs = callDataEncoder.decode(callInfo.calldataHexString) as CallArgs;
            expect(callArgs.transformations[0].deploymentNonce.toNumber()).to.eq(
                consumer.transformerNonces.wethTransformer,
            );
            const wethTransformerData = decodeWethTransformerData(callArgs.transformations[0].data);
            expect(wethTransformerData.amount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAssetAmount);
            expect(wethTransformerData.token).to.eq(ETH_TOKEN_ADDRESS);
        });

        it('ERC20 -> ETH has a WETH transformer after the fill', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { isToETH: true },
            });
            const callArgs = callDataEncoder.decode(callInfo.calldataHexString) as CallArgs;
            expect(callArgs.transformations[1].deploymentNonce.toNumber()).to.eq(
                consumer.transformerNonces.wethTransformer,
            );
            const wethTransformerData = decodeWethTransformerData(callArgs.transformations[1].data);
            expect(wethTransformerData.amount).to.bignumber.eq(MAX_UINT256);
            expect(wethTransformerData.token).to.eq(contractAddresses.etherToken);
        });
    });
});
