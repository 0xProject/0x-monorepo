import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

export interface MockedRfqtFirmQuoteResponse {
    endpoint: string;
    requestApiKey: string;
    requestParams: {
        [key: string]: string;
    };
    responseData: any;
    responseCode: number;
}
export const rfqtMocker = {
    withMockedRfqtFirmQuotes: async (
        mockedResponses: MockedRfqtFirmQuoteResponse[],
        performFn: () => Promise<void>,
    ) => {
        const mockedAxios = new AxiosMockAdapter(axios);

        // Mock out RFQT responses
        for (const mockedResponse of mockedResponses) {
            const { endpoint, requestApiKey, requestParams, responseData, responseCode } = mockedResponse;
            const requestHeaders = { Accept: 'application/json, text/plain, */*', '0x-api-key': requestApiKey };
            mockedAxios
                .onGet(`${endpoint}/quote`, { params: requestParams }, requestHeaders)
                .replyOnce(responseCode, responseData);
        }

        try {
            await performFn();
        } finally {
            // Ensure we always restore axios afterwards
            mockedAxios.restore();
        }
    },
};
