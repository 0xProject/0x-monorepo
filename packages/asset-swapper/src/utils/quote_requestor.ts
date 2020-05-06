import { schemas, SchemaValidator } from '@0x/json-schemas';
import { assetDataUtils, orderCalculationUtils, SignedOrder } from '@0x/order-utils';
import { ERC20AssetData } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import Axios, { AxiosResponse } from 'axios';

import { constants } from '../constants';
import { MarketOperation, RfqtMakerAssetOfferings, RfqtRequestOpts } from '../types';

/**
 * Request quotes from RFQ-T providers
 */

export interface RfqtIndicativeQuoteResponse {
    makerAssetData: string;
    makerAssetAmount: BigNumber;
    takerAssetData: string;
    takerAssetAmount: BigNumber;
    expirationTimeSeconds: BigNumber;
}

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

function assertTakerAddressOrThrow(takerAddress: string | undefined): void {
    if (
        takerAddress === undefined ||
        takerAddress === '' ||
        takerAddress === '0x' ||
        !takerAddress ||
        takerAddress === constants.NULL_ADDRESS
    ) {
        throw new Error('RFQ-T requires the presence of a taker address');
    }
}

function inferQueryParams(
    marketOperation: MarketOperation,
    makerAssetData: string,
    takerAssetData: string,
    assetFillAmount: BigNumber,
): { buyToken: string; sellToken: string; buyAmount?: string; sellAmount?: string } {
    if (marketOperation === MarketOperation.Buy) {
        return {
            buyToken: getTokenAddressOrThrow(makerAssetData),
            sellToken: getTokenAddressOrThrow(takerAssetData),
            buyAmount: assetFillAmount.toString(),
            sellAmount: undefined,
        };
    } else {
        return {
            buyToken: getTokenAddressOrThrow(makerAssetData),
            sellToken: getTokenAddressOrThrow(takerAssetData),
            sellAmount: assetFillAmount.toString(),
            buyAmount: undefined,
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

export class QuoteRequestor {
    private readonly _schemaValidator: SchemaValidator = new SchemaValidator();

    constructor(
        private readonly _rfqtAssetOfferings: RfqtMakerAssetOfferings,
        private readonly _warningLogger: (a: any) => void = a => logUtils.warn(a),
        private readonly _infoLogger: (a: any) => void = () => undefined,
        private readonly _expiryBufferMs: number = constants.DEFAULT_SWAP_QUOTER_OPTS.expiryBufferMs,
    ) {}

    public async requestRfqtFirmQuotesAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: RfqtRequestOpts,
    ): Promise<SignedOrder[]> {
        const _opts: RfqtRequestOpts = { ...constants.DEFAULT_RFQT_REQUEST_OPTS, ...options };
        assertTakerAddressOrThrow(_opts.takerAddress);

        // create an array of promises for quote responses, using "undefined"
        // as a placeholder for failed requests.
        const responsesIfDefined: Array<undefined | AxiosResponse<SignedOrder>> = await Promise.all(
            Object.keys(this._rfqtAssetOfferings).map(async url => {
                if (this._makerSupportsPair(url, makerAssetData, takerAssetData)) {
                    try {
                        const timeBeforeAwait = Date.now();
                        const response = await Axios.get<SignedOrder>(`${url}/quote`, {
                            headers: { '0x-api-key': _opts.apiKey },
                            params: {
                                takerAddress: _opts.takerAddress,
                                ...inferQueryParams(marketOperation, makerAssetData, takerAssetData, assetFillAmount),
                            },
                            timeout: _opts.makerEndpointMaxResponseTimeMs,
                        });
                        this._infoLogger({
                            rfqtFirmQuoteMakerResponseTime: {
                                makerEndpoint: url,
                                responseTimeMs: Date.now() - timeBeforeAwait,
                            },
                        });
                        return response;
                    } catch (err) {
                        this._warningLogger(
                            `Failed to get RFQ-T firm quote from market maker endpoint ${url} for API key ${
                                _opts.apiKey
                            } for taker address ${_opts.takerAddress}`,
                        );
                        this._warningLogger(err);
                        return undefined;
                    }
                }
                return undefined;
            }),
        );

        const responses = responsesIfDefined.filter(
            (respIfDefd): respIfDefd is AxiosResponse<SignedOrder> => respIfDefd !== undefined,
        );

        const ordersWithStringInts = responses.map(response => response.data); // not yet BigNumber

        const validatedOrdersWithStringInts = ordersWithStringInts.filter(order => {
            const hasValidSchema = this._schemaValidator.isValid(order, schemas.signedOrderSchema);
            if (!hasValidSchema) {
                this._warningLogger(`Invalid RFQ-t order received, filtering out: ${JSON.stringify(order)}`);
                return false;
            }

            if (
                !hasExpectedAssetData(
                    makerAssetData,
                    takerAssetData,
                    order.makerAssetData.toLowerCase(),
                    order.takerAssetData.toLowerCase(),
                )
            ) {
                this._warningLogger(`Unexpected asset data in RFQ-T order, filtering out: ${JSON.stringify(order)}`);
                return false;
            }

            if (order.takerAddress.toLowerCase() !== _opts.takerAddress.toLowerCase()) {
                this._warningLogger(`Unexpected takerAddress in RFQ-T order, filtering out: ${JSON.stringify(order)}`);
                return false;
            }

            return true;
        });

        const validatedOrders: SignedOrder[] = validatedOrdersWithStringInts.map(orderWithStringInts => {
            return {
                ...orderWithStringInts,
                makerAssetAmount: new BigNumber(orderWithStringInts.makerAssetAmount),
                takerAssetAmount: new BigNumber(orderWithStringInts.takerAssetAmount),
                makerFee: new BigNumber(orderWithStringInts.makerFee),
                takerFee: new BigNumber(orderWithStringInts.takerFee),
                expirationTimeSeconds: new BigNumber(orderWithStringInts.expirationTimeSeconds),
                salt: new BigNumber(orderWithStringInts.salt),
            };
        });

        const orders = validatedOrders.filter(order => {
            if (orderCalculationUtils.willOrderExpire(order, this._expiryBufferMs / constants.ONE_SECOND_MS)) {
                this._warningLogger(`Expiry too soon in RFQ-T order, filtering out: ${JSON.stringify(order)}`);
                return false;
            }
            return true;
        });

        return orders;
    }

    public async requestRfqtIndicativeQuotesAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: RfqtRequestOpts,
    ): Promise<RfqtIndicativeQuoteResponse[]> {
        const _opts: RfqtRequestOpts = { ...constants.DEFAULT_RFQT_REQUEST_OPTS, ...options };
        assertTakerAddressOrThrow(_opts.takerAddress);

        const axiosResponsesIfDefined: Array<
            undefined | AxiosResponse<RfqtIndicativeQuoteResponse>
        > = await Promise.all(
            Object.keys(this._rfqtAssetOfferings).map(async url => {
                if (this._makerSupportsPair(url, makerAssetData, takerAssetData)) {
                    try {
                        const timeBeforeAwait = Date.now();
                        const response = await Axios.get<RfqtIndicativeQuoteResponse>(`${url}/price`, {
                            headers: { '0x-api-key': options.apiKey },
                            params: {
                                takerAddress: options.takerAddress,
                                ...inferQueryParams(marketOperation, makerAssetData, takerAssetData, assetFillAmount),
                            },
                            timeout: options.makerEndpointMaxResponseTimeMs,
                        });
                        this._infoLogger({
                            rfqtIndicativeQuoteMakerResponseTime: {
                                makerEndpoint: url,
                                responseTimeMs: Date.now() - timeBeforeAwait,
                            },
                        });
                        return response;
                    } catch (err) {
                        this._warningLogger(
                            `Failed to get RFQ-T indicative quote from market maker endpoint ${url} for API key ${
                                options.apiKey
                            } for taker address ${options.takerAddress}`,
                        );
                        this._warningLogger(err);
                        return undefined;
                    }
                }
                return undefined;
            }),
        );

        const axiosResponses = axiosResponsesIfDefined.filter(
            (respIfDefd): respIfDefd is AxiosResponse<RfqtIndicativeQuoteResponse> => respIfDefd !== undefined,
        );

        const responsesWithStringInts = axiosResponses.map(response => response.data); // not yet BigNumber

        const validResponsesWithStringInts = responsesWithStringInts.filter(response => {
            if (!this._isValidRfqtIndicativeQuoteResponse(response)) {
                this._warningLogger(
                    `Invalid RFQ-T indicative quote received, filtering out: ${JSON.stringify(response)}`,
                );
                return false;
            }
            if (
                !hasExpectedAssetData(makerAssetData, takerAssetData, response.makerAssetData, response.takerAssetData)
            ) {
                this._warningLogger(
                    `Unexpected asset data in RFQ-T indicative quote, filtering out: ${JSON.stringify(response)}`,
                );
                return false;
            }
            return true;
        });

        const validResponses = validResponsesWithStringInts.map(response => {
            return {
                ...response,
                makerAssetAmount: new BigNumber(response.makerAssetAmount),
                takerAssetAmount: new BigNumber(response.takerAssetAmount),
                expirationTimeSeconds: new BigNumber(response.expirationTimeSeconds),
            };
        });

        const responses = validResponses.filter(response => {
            if (this._isExpirationTooSoon(response.expirationTimeSeconds)) {
                this._warningLogger(
                    `Expiry too soon in RFQ-T indicative quote, filtering out: ${JSON.stringify(response)}`,
                );
                return false;
            }
            return true;
        });

        return responses;
    }

    private _isValidRfqtIndicativeQuoteResponse(response: RfqtIndicativeQuoteResponse): boolean {
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
}
