import { SignedOrder } from '@0x/order-utils';
import { StatusCodes } from '@0x/types';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

/**
 * Ensures that we throw if a HTTP request is made
 * that is not one of the known mocked routes
 * See https://github.com/ctimmerm/axios-mock-adapter/issues/173
 */
const setupAdapterToThrowOnUnknownRequest = (mockAdapter: AxiosMockAdapter) => {
    mockAdapter.onAny().reply(config => {
        throw new Error(
            `Could not find mock for ${config.url} ${JSON.stringify(config.params)} ${JSON.stringify(config.headers)}`,
        );
    });
};

interface RfqtMakerParams {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    takerAddress: string;
}
export interface MockedSuccessfulRfqtRequest {
    endpoint: string;
    expectedApiKey: string;
    expectedParams: RfqtMakerParams;
    response: SignedOrder;
}
export const rfqtMocker = {
    withMockedRfqtRequests: async (
        mocks: { successfulRequests?: MockedSuccessfulRfqtRequest[] },
        performAction: () => Promise<void>,
    ) => {
        const mockAdapter = new AxiosMockAdapter(axios);

        const { successfulRequests } = mocks;

        // Mock successful requests
        if (successfulRequests) {
            for (const mockedSuccessfulRequest of successfulRequests) {
                const { endpoint, response, expectedParams, expectedApiKey } = mockedSuccessfulRequest;

                mockAdapter
                    .onGet(
                        `${endpoint}/quote`,
                        {
                            params: expectedParams,
                        },
                        { Accept: 'application/json, text/plain, */*', '0x-api-key': expectedApiKey },
                    )
                    .replyOnce(StatusCodes.Success, response);
            }
        }

        setupAdapterToThrowOnUnknownRequest(mockAdapter);

        try {
            await performAction();
        } finally {
            mockAdapter.restore();
        }
    },
};
