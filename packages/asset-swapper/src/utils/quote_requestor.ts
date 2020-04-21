import { schemas, SchemaValidator } from '@0x/json-schemas';
import { assetDataUtils, SignedOrder } from '@0x/order-utils';
import { ERC20AssetData } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import Axios, { AxiosResponse } from 'axios';
import * as _ from 'lodash';

import { constants } from '../constants';
import { MarketOperation, RfqtRequestOpts } from '../types';

/**
 * Request quotes from RFQ-T providers
 */

export interface RfqtIndicativeQuoteResponse {
    makerAssetData: string;
    makerAssetAmount: BigNumber;
    takerAssetData: string;
    takerAssetAmount: BigNumber;
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
): { buyToken: string; sellToken: string; buyAmount: string | undefined; sellAmount: string | undefined } {
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
    private readonly _rfqtMakerEndpoints: string[];
    private readonly _schemaValidator: SchemaValidator = new SchemaValidator();

    constructor(rfqtMakerEndpoints: string[]) {
        this._rfqtMakerEndpoints = rfqtMakerEndpoints;
    }

    public async requestRfqtFirmQuotesAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options?: Partial<RfqtRequestOpts>,
    ): Promise<SignedOrder[]> {
        const _opts = _.merge({}, constants.DEFAULT_RFQT_REQUEST_OPTS, options);
        assertTakerAddressOrThrow(_opts.takerAddress);

        // create an array of promises for quote responses, using "undefined"
        // as a placeholder for failed requests.
        const responsesIfDefined: Array<undefined | AxiosResponse<SignedOrder>> = await Promise.all(
            this._rfqtMakerEndpoints.map(async rfqtMakerEndpoint => {
                try {
                    return await Axios.get<SignedOrder>(`${rfqtMakerEndpoint}/quote`, {
                        headers: { '0x-api-key': _opts.apiKey },
                        params: {
                            takerAddress: _opts.takerAddress,
                            ...inferQueryParams(marketOperation, makerAssetData, takerAssetData, assetFillAmount),
                        },
                        timeout: _opts.makerEndpointMaxResponseTimeMs,
                    });
                } catch (err) {
                    logUtils.warn(
                        `Failed to get RFQ-T firm quote from market maker endpoint ${rfqtMakerEndpoint} for API key ${
                            _opts.apiKey
                        } for taker address ${_opts.takerAddress}`,
                    );
                    logUtils.warn(err);
                    return undefined;
                }
            }),
        );

        const responses = responsesIfDefined.filter(
            (respIfDefd): respIfDefd is AxiosResponse<SignedOrder> => respIfDefd !== undefined,
        );

        const ordersWithStringInts = responses.map(response => response.data); // not yet BigNumber

        const validatedOrdersWithStringInts = ordersWithStringInts.filter(order => {
            const hasValidSchema = this._schemaValidator.isValid(order, schemas.signedOrderSchema);
            if (!hasValidSchema) {
                logUtils.warn(`Invalid RFQ-t order received, filtering out: ${JSON.stringify(order)}`);
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
                logUtils.warn(`Unexpected asset data in RFQ-T order, filtering out: ${JSON.stringify(order)}`);
                return false;
            }

            return true;
        });

        const orders: SignedOrder[] = validatedOrdersWithStringInts.map(orderWithStringInts => {
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

        return orders;
    }

    public async requestRfqtIndicativeQuotesAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: RfqtRequestOpts,
    ): Promise<RfqtIndicativeQuoteResponse[]> {
        const _opts = _.merge({}, constants.DEFAULT_RFQT_REQUEST_OPTS, options);
        assertTakerAddressOrThrow(_opts.takerAddress);

        const axiosResponsesIfDefined: Array<
            undefined | AxiosResponse<RfqtIndicativeQuoteResponse>
        > = await Promise.all(
            this._rfqtMakerEndpoints.map(async rfqtMakerEndpoint => {
                try {
                    return await Axios.get<RfqtIndicativeQuoteResponse>(`${rfqtMakerEndpoint}/price`, {
                        headers: { '0x-api-key': options.apiKey },
                        params: {
                            takerAddress: options.takerAddress,
                            ...inferQueryParams(marketOperation, makerAssetData, takerAssetData, assetFillAmount),
                        },
                        timeout: options.makerEndpointMaxResponseTimeMs,
                    });
                } catch (err) {
                    logUtils.warn(
                        `Failed to get RFQ-T indicative quote from market maker endpoint ${rfqtMakerEndpoint} for API key ${
                            options.apiKey
                        } for taker address ${options.takerAddress}`,
                    );
                    logUtils.warn(err);
                    return undefined;
                }
            }),
        );

        const axiosResponses = axiosResponsesIfDefined.filter(
            (respIfDefd): respIfDefd is AxiosResponse<RfqtIndicativeQuoteResponse> => respIfDefd !== undefined,
        );

        const responsesWithStringInts = axiosResponses.map(response => response.data); // not yet BigNumber

        const validResponsesWithStringInts = responsesWithStringInts.filter(response => {
            if (!this._isValidRfqtIndicativeQuoteResponse(response)) {
                logUtils.warn(`Invalid RFQ-T indicative quote received, filtering out: ${JSON.stringify(response)}`);
                return false;
            }
            if (
                !hasExpectedAssetData(makerAssetData, takerAssetData, response.makerAssetData, response.takerAssetData)
            ) {
                logUtils.warn(
                    `Unexpected asset data in RFQ-T indicative quote, filtering out: ${JSON.stringify(response)}`,
                );
                return false;
            }
            return true;
        });

        const responses = validResponsesWithStringInts.map(response => {
            return {
                ...response,
                makerAssetAmount: new BigNumber(response.makerAssetAmount),
                takerAssetAmount: new BigNumber(response.takerAssetAmount),
            };
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
        if (hasValidMakerAssetAmount && hasValidTakerAssetAmount && hasValidMakerAssetData && hasValidTakerAssetData) {
            return true;
        }
        return false;
    }
}
