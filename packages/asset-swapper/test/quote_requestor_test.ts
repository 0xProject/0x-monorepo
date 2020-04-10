import { tokenUtils } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { MarketOperation } from '../src/types';
import { QuoteRequestor } from '../src/utils/quote_requestor';

import { chaiSetup } from './utils/chai_setup';
import { MockedSuccessfulRfqtRequest, rfqtMocker } from './utils/rfqt_mocker';
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

            // Set up maker RFQT responses
            const expectedParams = {
                sellToken: takerToken,
                buyToken: makerToken,
                sellAmount: '10000',
                takerAddress,
            };
            const mockedOrder1 = testOrderFactory.generateTestSignedOrder({});
            const mockedRequest1: MockedSuccessfulRfqtRequest = {
                endpoint: 'https://1337.0.0.1',
                expectedApiKey: takerApiKey,
                expectedParams,
                response: mockedOrder1,
            };
            const mockedOrder2 = testOrderFactory.generateTestSignedOrder({});
            const mockedRequest2: MockedSuccessfulRfqtRequest = {
                endpoint: 'https://1338.0.0.1',
                expectedApiKey: takerApiKey,
                expectedParams,
                response: mockedOrder2,
            };

            return rfqtMocker.withMockedRfqtRequests(
                { successfulRequests: [mockedRequest1, mockedRequest2] },
                async () => {
                    const qr = new QuoteRequestor(['https://1337.0.0.1', 'https://1338.0.0.1']);
                    const resp = await qr.requestRfqtFirmQuotesAsync(
                        makerAssetData,
                        takerAssetData,
                        new BigNumber(10000),
                        MarketOperation.Sell,
                        true,
                        takerApiKey,
                        takerAddress,
                    );
                    expect(resp.sort()).to.eql([mockedOrder1, mockedOrder2].sort());
                },
            );
        });
    });
});
