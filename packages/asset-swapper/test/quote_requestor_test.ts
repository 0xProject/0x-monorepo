import { tokenUtils } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { StatusCodes } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { MarketOperation } from '../src/types';
import { QuoteRequestor } from '../src/utils/quote_requestor';

import { chaiSetup } from './utils/chai_setup';
import { MockedRfqtFirmQuoteResponse, rfqtMocker } from './utils/rfqt_mocker';
import { testOrderFactory } from './utils/test_order_factory';

chaiSetup.configure();
const expect = chai.expect;

describe('QuoteRequestor', async () => {
    const [makerToken, takerToken] = tokenUtils.getDummyERC20TokenAddresses();
    const makerAssetData = assetDataUtils.encodeERC20AssetData(makerToken);
    const takerAssetData = assetDataUtils.encodeERC20AssetData(takerToken);

    describe('requestRfqtFirmQuotesAsync', async () => {
        it('should return successful RFQT requests', async () => {
            const takerAddress = '0xd209925defc99488e3afff1174e48b4fa628302a';
            const takerApiKey = 'my-ko0l-api-key';

            // Set up RFQT responses
            // tslint:disable-next-line:array-type
            const mockedRequests: MockedRfqtFirmQuoteResponse[] = [];
            const expectedParams = {
                sellToken: takerToken,
                buyToken: makerToken,
                sellAmount: '10000',
                takerAddress,
            };
            // Successful response
            const mockedOrder1 = testOrderFactory.generateTestSignedOrder({});
            mockedRequests.push({
                endpoint: 'https://1337.0.0.1',
                requestApiKey: takerApiKey,
                requestParams: expectedParams,
                responseData: mockedOrder1,
                responseCode: StatusCodes.Success,
            });
            // Test out a bad response code, ensure it doesnt cause throw
            mockedRequests.push({
                endpoint: 'https://420.0.0.1',
                requestApiKey: takerApiKey,
                requestParams: expectedParams,
                responseData: { error: 'bad request' },
                responseCode: StatusCodes.InternalError,
            });
            // Another Successful response
            const mockedOrder3 = testOrderFactory.generateTestSignedOrder({});
            mockedRequests.push({
                endpoint: 'https://37.0.0.1',
                requestApiKey: takerApiKey,
                requestParams: expectedParams,
                responseData: mockedOrder3,
                responseCode: StatusCodes.Success,
            });

            return rfqtMocker.withMockedRfqtFirmQuotes(mockedRequests, async () => {
                const qr = new QuoteRequestor(['https://1337.0.0.1', 'https://420.0.0.1', 'https://37.0.0.1']);
                const resp = await qr.requestRfqtFirmQuotesAsync(
                    makerAssetData,
                    takerAssetData,
                    new BigNumber(10000),
                    MarketOperation.Sell,
                    takerApiKey,
                    takerAddress,
                );
                expect(resp.sort()).to.eql([mockedOrder1, mockedOrder3].sort());
            });
        });
    });
});
