import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

import { MockedRfqtFirmQuoteResponse } from '../types';

/**
 * A helper utility for testing which mocks out
 * requests to RFQ-t providers
 */
export const rfqtMocker = {
    /**
     * Stubs out responses from RFQ-T providers by mocking out
     * HTTP calls via axios. Always restores the mock adapter
     * after executing the `performFn`.
     */
    withMockedRfqtFirmQuotes: async (
        mockedResponses: MockedRfqtFirmQuoteResponse[],
        performFn: () => Promise<void>,
    ) => {
        const mockedAxios = new AxiosMockAdapter(axios);
        try {
            // Mock out RFQT responses
            for (const mockedResponse of mockedResponses) {
                const { endpoint, requestApiKey, requestParams, responseData, responseCode } = mockedResponse;
                const requestHeaders = { Accept: 'application/json, text/plain, */*', '0x-api-key': requestApiKey };
                mockedAxios
                    .onGet(`${endpoint}/quote`, { params: requestParams }, requestHeaders)
                    .replyOnce(responseCode, responseData);
            }

            await performFn();
        } finally {
            // Ensure we always restore axios afterwards
            mockedAxios.restore();
        }
    },
    withMockedRfqtIndicativeQuotes: async (
        mockedResponses: MockedRfqtFirmQuoteResponse[],
        performFn: () => Promise<void>,
    ) => {
        const mockedAxios = new AxiosMockAdapter(axios);
        try {
            // Mock out RFQT responses
            for (const mockedResponse of mockedResponses) {
                const { endpoint, requestApiKey, requestParams, responseData, responseCode } = mockedResponse;
                const requestHeaders = { Accept: 'application/json, text/plain, */*', '0x-api-key': requestApiKey };
                mockedAxios
                    .onGet(`${endpoint}/price`, { params: requestParams }, requestHeaders)
                    .replyOnce(responseCode, responseData);
            }

            await performFn();
        } finally {
            // Ensure we always restore axios afterwards
            mockedAxios.restore();
        }
    },
};
