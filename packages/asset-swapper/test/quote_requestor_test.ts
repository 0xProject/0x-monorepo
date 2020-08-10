import { tokenUtils } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { StatusCodes } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { MarketOperation, MockedRfqtFirmQuoteResponse, MockedRfqtIndicativeQuoteResponse } from '../src/types';
import { QuoteRequestor, quoteRequestorHttpClient } from '../src/utils/quote_requestor';
import { rfqtMocker } from '../src/utils/rfqt_mocker';

import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';

chaiSetup.configure();
const expect = chai.expect;

function makeThreeMinuteExpiry(): BigNumber {
    const expiry = new Date(Date.now());
    expiry.setMinutes(expiry.getMinutes() + 3);
    return new BigNumber(Math.round(expiry.valueOf() / constants.ONE_SECOND_MS));
}

describe.only('QuoteRequestor', async () => {
    const [makerToken, takerToken, otherToken1] = tokenUtils.getDummyERC20TokenAddresses();
    const makerAssetData = assetDataUtils.encodeERC20AssetData(makerToken);
    const takerAssetData = assetDataUtils.encodeERC20AssetData(takerToken);

    describe('requestRfqtFirmQuotesAsync for firm quotes', async () => {
        it('should return successful RFQT requests', async () => {
            const takerAddress = '0xd209925defc99488e3afff1174e48b4fa628302a';
            const apiKey = 'my-ko0l-api-key';

            // Set up RFQT responses
            // tslint:disable-next-line:array-type
            const mockedRequests: MockedRfqtFirmQuoteResponse[] = [];
            const expectedParams = {
                sellTokenAddress: takerToken,
                buyTokenAddress: makerToken,
                sellAmountBaseUnits: '10000',
                buyAmountBaseUnits: undefined,
                takerAddress,
            };
            // Successful response
            const successfulOrder1 = testOrderFactory.generateTestSignedOrder({
                makerAssetData,
                takerAssetData,
                takerAddress,
                feeRecipientAddress: '0x0000000000000000000000000000000000000001',
                expirationTimeSeconds: makeThreeMinuteExpiry(),
            });
            mockedRequests.push({
                endpoint: 'https://1337.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { signedOrder: successfulOrder1 },
                responseCode: StatusCodes.Success,
            });
            // Test out a bad response code, ensure it doesnt cause throw
            mockedRequests.push({
                endpoint: 'https://420.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { error: 'bad request' },
                responseCode: StatusCodes.InternalError,
            });
            // Test out a successful response code but an invalid order
            mockedRequests.push({
                endpoint: 'https://421.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { makerAssetData: '123' },
                responseCode: StatusCodes.Success,
            });
            // ensure that a non-JSON response doesn't throw an error when trying to parse
            mockedRequests.push({
                endpoint: 'https://421.1.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: 'this is not JSON!',
                responseCode: StatusCodes.Success,
            });
            // A successful response code and valid order, but for wrong maker asset data
            const wrongMakerAssetDataOrder = testOrderFactory.generateTestSignedOrder({
                makerAssetData: assetDataUtils.encodeERC20AssetData(otherToken1),
                expirationTimeSeconds: makeThreeMinuteExpiry(),
                takerAssetData,
            });
            mockedRequests.push({
                endpoint: 'https://422.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { signedOrder: wrongMakerAssetDataOrder },
                responseCode: StatusCodes.Success,
            });
            // A successful response code and valid order, but for wrong taker asset data
            const wrongTakerAssetDataOrder = testOrderFactory.generateTestSignedOrder({
                makerAssetData,
                expirationTimeSeconds: makeThreeMinuteExpiry(),
                takerAssetData: assetDataUtils.encodeERC20AssetData(otherToken1),
            });
            mockedRequests.push({
                endpoint: 'https://423.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { signedOrder: wrongTakerAssetDataOrder },
                responseCode: StatusCodes.Success,
            });
            // A successful response code and good order but its unsigned
            const unsignedOrder = testOrderFactory.generateTestSignedOrder({
                makerAssetData,
                takerAssetData,
                expirationTimeSeconds: makeThreeMinuteExpiry(),
                feeRecipientAddress: '0x0000000000000000000000000000000000000002',
            });
            delete unsignedOrder.signature;
            mockedRequests.push({
                endpoint: 'https://424.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { signedOrder: unsignedOrder },
                responseCode: StatusCodes.Success,
            });
            // A successful response code and good order but for the wrong takerAddress
            const orderWithNullTaker = testOrderFactory.generateTestSignedOrder({
                makerAssetData,
                takerAssetData,
                expirationTimeSeconds: makeThreeMinuteExpiry(),
                takerAddress: constants.NULL_ADDRESS,
                feeRecipientAddress: '0x0000000000000000000000000000000000000002',
            });
            mockedRequests.push({
                endpoint: 'https://425.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { signedOrder: orderWithNullTaker },
                responseCode: StatusCodes.Success,
            });

            // Another Successful response
            const successfulOrder2 = testOrderFactory.generateTestSignedOrder({
                makerAssetData,
                takerAssetData,
                takerAddress,
                expirationTimeSeconds: makeThreeMinuteExpiry(),
            });
            mockedRequests.push({
                endpoint: 'https://37.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { signedOrder: successfulOrder2 },
                responseCode: StatusCodes.Success,
            });

            return rfqtMocker.withMockedRfqtFirmQuotes(
                mockedRequests,
                async () => {
                    const qr = new QuoteRequestor({
                        'https://1337.0.0.1': [[makerToken, takerToken]],
                        'https://420.0.0.1': [[makerToken, takerToken]],
                        'https://421.0.0.1': [[makerToken, takerToken]],
                        'https://421.1.0.1': [[makerToken, takerToken]],
                        'https://422.0.0.1': [[makerToken, takerToken]],
                        'https://423.0.0.1': [[makerToken, takerToken]],
                        'https://424.0.0.1': [[makerToken, takerToken]],
                        'https://425.0.0.1': [[makerToken, takerToken]],
                        'https://426.0.0.1': [] /* Shouldn't ping an RFQ-T
                    provider when they don't support the requested asset pair. */,
                        'https://37.0.0.1': [[makerToken, takerToken]],
                    });
                    const resp = await qr.requestRfqtFirmQuotesAsync(
                        makerAssetData,
                        takerAssetData,
                        new BigNumber(10000),
                        MarketOperation.Sell,
                        {
                            apiKey,
                            takerAddress,
                            intentOnFilling: true,
                        },
                    );
                    expect(resp.sort()).to.eql(
                        [{ signedOrder: successfulOrder1 }, { signedOrder: successfulOrder2 }].sort(),
                    );
                },
                quoteRequestorHttpClient,
            );
        });
    });
    describe('requestRfqtIndicativeQuotesAsync for Indicative quotes', async () => {
        it('should return successful RFQT requests', async () => {
            const takerAddress = '0xd209925defc99488e3afff1174e48b4fa628302a';
            const apiKey = 'my-ko0l-api-key';

            // Set up RFQT responses
            // tslint:disable-next-line:array-type
            const mockedRequests: MockedRfqtIndicativeQuoteResponse[] = [];
            const expectedParams = {
                sellTokenAddress: takerToken,
                buyTokenAddress: makerToken,
                sellAmountBaseUnits: '10000',
                buyAmountBaseUnits: undefined,
                takerAddress,
            };
            // Successful response
            const successfulQuote1 = {
                makerAssetData,
                takerAssetData,
                makerAssetAmount: new BigNumber(expectedParams.sellAmountBaseUnits),
                takerAssetAmount: new BigNumber(expectedParams.sellAmountBaseUnits),
                expirationTimeSeconds: makeThreeMinuteExpiry(),
            };
            mockedRequests.push({
                endpoint: 'https://1337.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: successfulQuote1,
                responseCode: StatusCodes.Success,
            });
            // Test out a bad response code, ensure it doesnt cause throw
            mockedRequests.push({
                endpoint: 'https://420.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { error: 'bad request' },
                responseCode: StatusCodes.InternalError,
            });
            // Test out a successful response code but an invalid order
            mockedRequests.push({
                endpoint: 'https://421.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { makerAssetData: '123' },
                responseCode: StatusCodes.Success,
            });
            // A successful response code and valid response data, but for wrong maker asset data
            mockedRequests.push({
                endpoint: 'https://422.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { ...successfulQuote1, makerAssetData: assetDataUtils.encodeERC20AssetData(otherToken1) },
                responseCode: StatusCodes.Success,
            });
            // A successful response code and valid response data, but for wrong taker asset data
            mockedRequests.push({
                endpoint: 'https://423.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: { ...successfulQuote1, takerAssetData: assetDataUtils.encodeERC20AssetData(otherToken1) },
                responseCode: StatusCodes.Success,
            });
            // Another Successful response
            mockedRequests.push({
                endpoint: 'https://37.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: successfulQuote1,
                responseCode: StatusCodes.Success,
            });

            return rfqtMocker.withMockedRfqtIndicativeQuotes(
                mockedRequests,
                async () => {
                    const qr = new QuoteRequestor({
                        'https://1337.0.0.1': [[makerToken, takerToken]],
                        'https://420.0.0.1': [[makerToken, takerToken]],
                        'https://421.0.0.1': [[makerToken, takerToken]],
                        'https://422.0.0.1': [[makerToken, takerToken]],
                        'https://423.0.0.1': [[makerToken, takerToken]],
                        'https://424.0.0.1': [[makerToken, takerToken]],
                        'https://37.0.0.1': [[makerToken, takerToken]],
                    });
                    const resp = await qr.requestRfqtIndicativeQuotesAsync(
                        makerAssetData,
                        takerAssetData,
                        new BigNumber(10000),
                        MarketOperation.Sell,
                        {
                            apiKey,
                            takerAddress,
                            intentOnFilling: true,
                        },
                    );
                    expect(resp.sort()).to.eql([successfulQuote1, successfulQuote1].sort());
                },
                quoteRequestorHttpClient,
            );
        });
        it('should return successful RFQT indicative quote requests', async () => {
            const takerAddress = '0xd209925defc99488e3afff1174e48b4fa628302a';
            const apiKey = 'my-ko0l-api-key';

            // Set up RFQT responses
            // tslint:disable-next-line:array-type
            const mockedRequests: MockedRfqtIndicativeQuoteResponse[] = [];
            const expectedParams = {
                sellTokenAddress: takerToken,
                buyTokenAddress: makerToken,
                buyAmountBaseUnits: '10000',
                sellAmountBaseUnits: undefined,
                takerAddress,
            };
            // Successful response
            const successfulQuote1 = {
                makerAssetData,
                takerAssetData,
                makerAssetAmount: new BigNumber(expectedParams.buyAmountBaseUnits),
                takerAssetAmount: new BigNumber(expectedParams.buyAmountBaseUnits),
                expirationTimeSeconds: makeThreeMinuteExpiry(),
            };
            mockedRequests.push({
                endpoint: 'https://1337.0.0.1',
                requestApiKey: apiKey,
                requestParams: expectedParams,
                responseData: successfulQuote1,
                responseCode: StatusCodes.Success,
            });

            return rfqtMocker.withMockedRfqtIndicativeQuotes(
                mockedRequests,
                async () => {
                    const qr = new QuoteRequestor({ 'https://1337.0.0.1': [[makerToken, takerToken]] });
                    const resp = await qr.requestRfqtIndicativeQuotesAsync(
                        makerAssetData,
                        takerAssetData,
                        new BigNumber(10000),
                        MarketOperation.Buy,
                        {
                            apiKey,
                            takerAddress,
                            intentOnFilling: true,
                        },
                    );
                    expect(resp.sort()).to.eql([successfulQuote1].sort());
                },
                quoteRequestorHttpClient,
            );
        });
    });
});
