import { assetDataUtils, SignedOrder } from '@0x/order-utils';
import { ERC20AssetData } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import Axios, { AxiosResponse } from 'axios';

import { MarketOperation } from '../types';

/**
 * Request quotes from RFQ-T providers
 */
export class QuoteRequestor {
    private readonly _rfqtMakerEndpoints: string[];

    constructor(rfqtMakerEndpoints: string[]) {
        this._rfqtMakerEndpoints = rfqtMakerEndpoints;
    }

    public async requestRfqtFirmQuotesAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        intentOnFilling: boolean,
        takerApiKey: string,
        takerAddress: string,
    ): Promise<SignedOrder[]> {
        const makerEndpointMaxResponseTimeMs = 1000;

        const getTokenAddressOrThrow = (assetData: string): string => {
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
            } else {
                throw new Error(
                    `Decoded asset data (${JSON.stringify(decodedAssetData)}) does not contain a token address`,
                );
            }
        };

        const buyToken = getTokenAddressOrThrow(makerAssetData);
        const sellToken = getTokenAddressOrThrow(takerAssetData);

        // create an array of promises for quote responses, using "undefined"
        // as a placeholder for failed requests.

        const responsesIfDefined: Array<void | AxiosResponse<SignedOrder>> = await Promise.all(
            this._rfqtMakerEndpoints.map(async rfqtMakerEndpoint =>
                Axios.get<SignedOrder>(`${rfqtMakerEndpoint}/quote`, {
                    headers: { '0x-api-key': takerApiKey },
                    params: {
                        sellToken,
                        buyToken,
                        buyAmount: marketOperation === MarketOperation.Buy ? assetFillAmount.toString() : undefined,
                        sellAmount: marketOperation === MarketOperation.Sell ? assetFillAmount.toString() : undefined,
                        takerAddress,
                    },
                    timeout: makerEndpointMaxResponseTimeMs,
                }).catch(err => {
                    logUtils.warn(
                        `Failed to get RFQ-T quote from market maker endpoint ${rfqtMakerEndpoint} for API key ${takerApiKey} for taker address ${takerAddress}: ${JSON.stringify(
                            err,
                        )}`,
                    );
                }),
            ),
        );

        const responses: Array<AxiosResponse<SignedOrder>> = responsesIfDefined.filter(
            (respIfDefd): respIfDefd is AxiosResponse<SignedOrder> => respIfDefd !== undefined,
        );

        const ordersWithStringInts = responses.map(response => response.data); // not yet BigNumber

        const orders: SignedOrder[] = ordersWithStringInts.map(orderWithStringInts => {
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
}
