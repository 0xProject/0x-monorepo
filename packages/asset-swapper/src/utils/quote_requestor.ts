import { schemas, SchemaValidator } from '@0x/json-schemas';
import { assetDataUtils, orderCalculationUtils, orderHashUtils, SignedOrder } from '@0x/order-utils';
import { RFQTFirmQuote, RFQTIndicativeQuote, TakerRequest } from '@0x/quote-server';
import { ERC20AssetData } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import Axios, { AxiosInstance } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

import { constants } from '../constants';
import { MarketOperation, RfqtMakerAssetOfferings, RfqtRequestOpts } from '../types';

import { ONE_SECOND_MS } from './market_operation_utils/constants';

// tslint:disable-next-line: custom-no-magic-numbers
const KEEP_ALIVE_TTL = 5 * 60 * ONE_SECOND_MS;

export const quoteRequestorHttpClient: AxiosInstance = Axios.create({
    httpAgent: new HttpAgent({ keepAlive: true, timeout: KEEP_ALIVE_TTL }),
    httpsAgent: new HttpsAgent({ keepAlive: true, timeout: KEEP_ALIVE_TTL }),
});

/**
 * Request quotes from RFQ-T providers
 */

function getTokenAddressOrThrow(assetData: string): string {
    const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
    if (decodedAssetData.hasOwnProperty('tokenAddress')) {
        // type cast necessary here as decodeAssetDataOrThrow returns
        // an AssetData object, which doesn't necessarily contain a
        // token address.  (it could possibly be a StaticCallAssetData,
        // which lacks an address.)  so we'll just assume it's a token
        // here.  should be safe, with the enclosing guard condition
        // and subsequent error.
        // tslint:disable-next-line:no-unnecessary-type-assertion
        return (decodedAssetData as ERC20AssetData).tokenAddress;
    }
    throw new Error(`Decoded asset data (${JSON.stringify(decodedAssetData)}) does not contain a token address`);
}

function inferQueryParams(
    marketOperation: MarketOperation,
    makerAssetData: string,
    takerAssetData: string,
    assetFillAmount: BigNumber,
): Pick<TakerRequest, 'buyTokenAddress' | 'sellTokenAddress' | 'buyAmountBaseUnits' | 'sellAmountBaseUnits'> {
    if (marketOperation === MarketOperation.Buy) {
        return {
            buyTokenAddress: getTokenAddressOrThrow(makerAssetData),
            sellTokenAddress: getTokenAddressOrThrow(takerAssetData),
            buyAmountBaseUnits: assetFillAmount,
            sellAmountBaseUnits: undefined,
        };
    } else {
        return {
            buyTokenAddress: getTokenAddressOrThrow(makerAssetData),
            sellTokenAddress: getTokenAddressOrThrow(takerAssetData),
            sellAmountBaseUnits: assetFillAmount,
            buyAmountBaseUnits: undefined,
        };
    }
}

function hasExpectedAssetData(
    expectedMakerAssetData: string,
    expectedTakerAssetData: string,
    makerAssetDataInQuestion: string,
    takerAssetDataInQuestion: string,
): boolean {
    const hasExpectedMakerAssetData = makerAssetDataInQuestion.toLowerCase() === expectedMakerAssetData.toLowerCase();
    const hasExpectedTakerAssetData = takerAssetDataInQuestion.toLowerCase() === expectedTakerAssetData.toLowerCase();
    return hasExpectedMakerAssetData && hasExpectedTakerAssetData;
}

function convertIfAxiosError(error: any): Error | object /* axios' .d.ts has AxiosError.toJSON() returning object */ {
    if (error.hasOwnProperty('isAxiosError') && error.isAxiosError) {
        const { message, name, config } = error;
        const { headers, timeout, httpsAgent } = config;
        const { keepAlive, keepAliveMsecs, sockets } = httpsAgent;

        const socketCounts: { [key: string]: number } = {};
        for (const socket of Object.keys(sockets)) {
            socketCounts[socket] = sockets[socket].length;
        }

        return {
            message,
            name,
            config: {
                headers,
                timeout,
                httpsAgent: {
                    keepAlive,
                    keepAliveMsecs,
                    socketCounts,
                },
            },
        };
    } else {
        return error;
    }
}

export type LogFunction = (obj: object, msg?: string, ...args: any[]) => void;

export class QuoteRequestor {
    private readonly _schemaValidator: SchemaValidator = new SchemaValidator();
    private readonly _orderHashToMakerUri: { [orderHash: string]: string } = {};

    constructor(
        private readonly _rfqtAssetOfferings: RfqtMakerAssetOfferings,
        private readonly _warningLogger: LogFunction = (obj, msg) =>
            logUtils.warn(`${msg ? `${msg}: ` : ''}${JSON.stringify(obj)}`),
        private readonly _infoLogger: LogFunction = (obj, msg) =>
            logUtils.log(`${msg ? `${msg}: ` : ''}${JSON.stringify(obj)}`),
        private readonly _expiryBufferMs: number = constants.DEFAULT_SWAP_QUOTER_OPTS.expiryBufferMs,
    ) {}

    public async requestRfqtFirmQuotesAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: RfqtRequestOpts,
    ): Promise<RFQTFirmQuote[]> {
        const _opts: RfqtRequestOpts = { ...constants.DEFAULT_RFQT_REQUEST_OPTS, ...options };
        if (
            _opts.takerAddress === undefined ||
            _opts.takerAddress === '' ||
            _opts.takerAddress === '0x' ||
            !_opts.takerAddress ||
            _opts.takerAddress === constants.NULL_ADDRESS
        ) {
            throw new Error('RFQ-T firm quotes require the presence of a taker address');
        }

        const firmQuoteResponses = await this._getQuotesAsync<RFQTFirmQuote>( // not yet BigNumber
            makerAssetData,
            takerAssetData,
            assetFillAmount,
            marketOperation,
            _opts,
            'firm',
        );

        const result: RFQTFirmQuote[] = [];
        firmQuoteResponses.forEach(firmQuoteResponse => {
            const orderWithStringInts = firmQuoteResponse.response.signedOrder;

            try {
                const hasValidSchema = this._schemaValidator.isValid(orderWithStringInts, schemas.signedOrderSchema);
                if (!hasValidSchema) {
                    throw new Error('Order not valid');
                }
            } catch (err) {
                this._warningLogger(orderWithStringInts, `Invalid RFQ-t order received, filtering out. ${err.message}`);
                return;
            }

            if (
                !hasExpectedAssetData(
                    makerAssetData,
                    takerAssetData,
                    orderWithStringInts.makerAssetData.toLowerCase(),
                    orderWithStringInts.takerAssetData.toLowerCase(),
                )
            ) {
                this._warningLogger(orderWithStringInts, 'Unexpected asset data in RFQ-T order, filtering out');
                return;
            }

            if (orderWithStringInts.takerAddress.toLowerCase() !== _opts.takerAddress.toLowerCase()) {
                this._warningLogger(orderWithStringInts, 'Unexpected takerAddress in RFQ-T order, filtering out');
                return;
            }

            const orderWithBigNumberInts: SignedOrder = {
                ...orderWithStringInts,
                makerAssetAmount: new BigNumber(orderWithStringInts.makerAssetAmount),
                takerAssetAmount: new BigNumber(orderWithStringInts.takerAssetAmount),
                makerFee: new BigNumber(orderWithStringInts.makerFee),
                takerFee: new BigNumber(orderWithStringInts.takerFee),
                expirationTimeSeconds: new BigNumber(orderWithStringInts.expirationTimeSeconds),
                salt: new BigNumber(orderWithStringInts.salt),
            };

            if (
                orderCalculationUtils.willOrderExpire(
                    orderWithBigNumberInts,
                    this._expiryBufferMs / constants.ONE_SECOND_MS,
                )
            ) {
                this._warningLogger(orderWithBigNumberInts, 'Expiry too soon in RFQ-T order, filtering out');
                return;
            }

            // Store makerUri for looking up later
            this._orderHashToMakerUri[orderHashUtils.getOrderHash(orderWithBigNumberInts)] = firmQuoteResponse.makerUri;

            // Passed all validation, add it to result
            result.push({ signedOrder: orderWithBigNumberInts });
            return;
        });
        return result;
    }

    public async requestRfqtIndicativeQuotesAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: RfqtRequestOpts,
    ): Promise<RFQTIndicativeQuote[]> {
        const _opts: RfqtRequestOpts = { ...constants.DEFAULT_RFQT_REQUEST_OPTS, ...options };

        const responsesWithStringInts = await this._getQuotesAsync<RFQTIndicativeQuote>( // not yet BigNumber
            makerAssetData,
            takerAssetData,
            assetFillAmount,
            marketOperation,
            _opts,
            'indicative',
        );

        const validResponsesWithStringInts = responsesWithStringInts.filter(result => {
            const response = result.response;
            if (!this._isValidRfqtIndicativeQuoteResponse(response)) {
                this._warningLogger(response, 'Invalid RFQ-T indicative quote received, filtering out');
                return false;
            }
            if (
                !hasExpectedAssetData(makerAssetData, takerAssetData, response.makerAssetData, response.takerAssetData)
            ) {
                this._warningLogger(response, 'Unexpected asset data in RFQ-T indicative quote, filtering out');
                return false;
            }
            return true;
        });

        const validResponses = validResponsesWithStringInts.map(result => {
            const response = result.response;
            return {
                ...response,
                makerAssetAmount: new BigNumber(response.makerAssetAmount),
                takerAssetAmount: new BigNumber(response.takerAssetAmount),
                expirationTimeSeconds: new BigNumber(response.expirationTimeSeconds),
            };
        });

        const responses = validResponses.filter(response => {
            if (this._isExpirationTooSoon(response.expirationTimeSeconds)) {
                this._warningLogger(response, 'Expiry too soon in RFQ-T indicative quote, filtering out');
                return false;
            }
            return true;
        });

        return responses;
    }

    /**
     * Given an order hash, returns the makerUri that the order originated from
     */
    public getMakerUriForOrderHash(orderHash: string): string | undefined {
        return this._orderHashToMakerUri[orderHash];
    }

    private _isValidRfqtIndicativeQuoteResponse(response: RFQTIndicativeQuote): boolean {
        const hasValidMakerAssetAmount =
            response.makerAssetAmount !== undefined &&
            this._schemaValidator.isValid(response.makerAssetAmount, schemas.wholeNumberSchema);
        const hasValidTakerAssetAmount =
            response.takerAssetAmount !== undefined &&
            this._schemaValidator.isValid(response.takerAssetAmount, schemas.wholeNumberSchema);
        const hasValidMakerAssetData =
            response.makerAssetData !== undefined &&
            this._schemaValidator.isValid(response.makerAssetData, schemas.hexSchema);
        const hasValidTakerAssetData =
            response.takerAssetData !== undefined &&
            this._schemaValidator.isValid(response.takerAssetData, schemas.hexSchema);
        const hasValidExpirationTimeSeconds =
            response.expirationTimeSeconds !== undefined &&
            this._schemaValidator.isValid(response.expirationTimeSeconds, schemas.wholeNumberSchema);
        if (
            hasValidMakerAssetAmount &&
            hasValidTakerAssetAmount &&
            hasValidMakerAssetData &&
            hasValidTakerAssetData &&
            hasValidExpirationTimeSeconds
        ) {
            return true;
        }
        return false;
    }

    private _makerSupportsPair(makerUrl: string, makerAssetData: string, takerAssetData: string): boolean {
        const makerTokenAddress = getTokenAddressOrThrow(makerAssetData);
        const takerTokenAddress = getTokenAddressOrThrow(takerAssetData);
        for (const assetPair of this._rfqtAssetOfferings[makerUrl]) {
            if (
                (assetPair[0] === makerTokenAddress && assetPair[1] === takerTokenAddress) ||
                (assetPair[0] === takerTokenAddress && assetPair[1] === makerTokenAddress)
            ) {
                return true;
            }
        }
        return false;
    }

    private _isExpirationTooSoon(expirationTimeSeconds: BigNumber): boolean {
        const expirationTimeMs = expirationTimeSeconds.times(constants.ONE_SECOND_MS);
        const currentTimeMs = new BigNumber(Date.now());
        return expirationTimeMs.isLessThan(currentTimeMs.plus(this._expiryBufferMs));
    }

    private async _getQuotesAsync<ResponseT>(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: RfqtRequestOpts,
        quoteType: 'firm' | 'indicative',
    ): Promise<Array<{ response: ResponseT; makerUri: string }>> {
        const result: Array<{ response: ResponseT; makerUri: string }> = [];
        await Promise.all(
            Object.keys(this._rfqtAssetOfferings).map(async url => {
                if (this._makerSupportsPair(url, makerAssetData, takerAssetData)) {
                    const requestParamsWithBigNumbers = {
                        takerAddress: options.takerAddress,
                        ...inferQueryParams(marketOperation, makerAssetData, takerAssetData, assetFillAmount),
                    };

                    // convert BigNumbers to strings
                    // so they are digestible by axios
                    const requestParams = {
                        ...requestParamsWithBigNumbers,
                        sellAmountBaseUnits: requestParamsWithBigNumbers.sellAmountBaseUnits
                            ? requestParamsWithBigNumbers.sellAmountBaseUnits.toString()
                            : undefined,
                        buyAmountBaseUnits: requestParamsWithBigNumbers.buyAmountBaseUnits
                            ? requestParamsWithBigNumbers.buyAmountBaseUnits.toString()
                            : undefined,
                    };

                    const partialLogEntry = { url, quoteType, requestParams };
                    const timeBeforeAwait = Date.now();
                    try {
                        const quotePath = (() => {
                            switch (quoteType) {
                                case 'firm':
                                    return 'quote';
                                    break;
                                case 'indicative':
                                    return 'price';
                                    break;
                                default:
                                    throw new Error(`Unexpected quote type ${quoteType}`);
                            }
                        })();
                        const response = await quoteRequestorHttpClient.get<ResponseT>(`${url}/${quotePath}`, {
                            headers: { '0x-api-key': options.apiKey },
                            params: requestParams,
                            timeout: options.makerEndpointMaxResponseTimeMs,
                        });
                        this._infoLogger({
                            rfqtMakerInteraction: {
                                ...partialLogEntry,
                                response: {
                                    included: true,
                                    apiKey: options.apiKey,
                                    takerAddress: requestParams.takerAddress,
                                    statusCode: response.status,
                                    latencyMs: Date.now() - timeBeforeAwait,
                                },
                            },
                        });
                        result.push({ response: response.data, makerUri: url });
                    } catch (err) {
                        this._infoLogger({
                            rfqtMakerInteraction: {
                                ...partialLogEntry,
                                response: {
                                    included: false,
                                    apiKey: options.apiKey,
                                    takerAddress: requestParams.takerAddress,
                                    statusCode: err.response ? err.response.status : undefined,
                                    latencyMs: Date.now() - timeBeforeAwait,
                                },
                            },
                        });
                        this._warningLogger(
                            convertIfAxiosError(err),
                            `Failed to get RFQ-T ${quoteType} quote from market maker endpoint ${url} for API key ${
                                options.apiKey
                            } for taker address ${options.takerAddress}`,
                        );
                    }
                }
            }),
        );
        return result;
    }
}
