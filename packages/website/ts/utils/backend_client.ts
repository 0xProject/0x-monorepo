import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as queryString from 'query-string';

import {
    ArticlesBySection,
    ItemByAddress,
    WebsiteBackendGasInfo,
    WebsiteBackendPriceInfo,
    WebsiteBackendRelayerInfo,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { errorReporter } from 'ts/utils/error_reporter';

const ETH_GAS_STATION_ENDPOINT = '/eth_gas_station';
const PRICES_ENDPOINT = '/prices';
const RELAYERS_ENDPOINT = '/relayers';
const WIKI_ENDPOINT = '/wiki';

export const backendClient = {
    async getGasInfoAsync(): Promise<WebsiteBackendGasInfo> {
        const result = await requestAsync(ETH_GAS_STATION_ENDPOINT);
        return result;
    },
    async getPriceInfosAsync(tokenAddresses: string[]): Promise<WebsiteBackendPriceInfo[]> {
        if (_.isEmpty(tokenAddresses)) {
            return [];
        }
        const joinedTokenAddresses = tokenAddresses.join(',');
        const queryParams = {
            tokens: joinedTokenAddresses,
        };
        const result = await requestAsync(PRICES_ENDPOINT, queryParams);
        return result;
    },
    async getRelayerInfosAsync(): Promise<WebsiteBackendRelayerInfo[]> {
        const result = await requestAsync(RELAYERS_ENDPOINT);
        return result;
    },
    async getWikiArticlesBySectionAsync(): Promise<ArticlesBySection> {
        const result = await requestAsync(WIKI_ENDPOINT);
        return result;
    },
};

async function requestAsync(endpoint: string, queryParams?: object): Promise<any> {
    const query = queryStringFromQueryParams(queryParams);
    const url = `${configs.BACKEND_BASE_URL}${endpoint}${query}`;
    const response = await fetch(url);
    if (response.status !== 200) {
        const errorText = `Error requesting url: ${url}, ${response.status}: ${response.statusText}`;
        logUtils.log(errorText);
        const error = Error(errorText);
        // tslint:disable-next-line:no-floating-promises
        errorReporter.reportAsync(error);
        throw error;
    }
    const result = await response.json();
    return result;
}

function queryStringFromQueryParams(queryParams?: object): string {
    // if params are undefined or empty, return an empty string
    if (_.isUndefined(queryParams) || _.isEmpty(queryParams)) {
        return '';
    }
    // stringify the formatted object
    const stringifiedParams = queryString.stringify(queryParams);
    return `?${stringifiedParams}`;
}
