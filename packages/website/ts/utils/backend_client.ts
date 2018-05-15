import * as _ from 'lodash';

import { ArticlesBySection, WebsiteBackendGasInfo, WebsiteBackendPriceInfo, WebsiteBackendRelayerInfo } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { fetchUtils } from 'ts/utils/fetch_utils';

const ETH_GAS_STATION_ENDPOINT = '/eth_gas_station';
const PRICES_ENDPOINT = '/prices';
const RELAYERS_ENDPOINT = '/relayers';
const WIKI_ENDPOINT = '/wiki';

export const backendClient = {
    async getGasInfoAsync(): Promise<WebsiteBackendGasInfo> {
        const result = await fetchUtils.requestAsync(configs.BACKEND_BASE_URL, ETH_GAS_STATION_ENDPOINT);
        return result;
    },
    async getPriceInfoAsync(tokenSymbols: string[]): Promise<WebsiteBackendPriceInfo> {
        if (_.isEmpty(tokenSymbols)) {
            return {};
        }
        const joinedTokenSymbols = tokenSymbols.join(',');
        const queryParams = {
            tokens: joinedTokenSymbols,
        };
        const result = await fetchUtils.requestAsync(configs.BACKEND_BASE_URL, PRICES_ENDPOINT, queryParams);
        return result;
    },
    async getRelayerInfosAsync(): Promise<WebsiteBackendRelayerInfo[]> {
        const result = await fetchUtils.requestAsync(configs.BACKEND_BASE_URL, RELAYERS_ENDPOINT);
        return result;
    },
    async getWikiArticlesBySectionAsync(): Promise<ArticlesBySection> {
        const result = await fetchUtils.requestAsync(configs.BACKEND_BASE_URL, WIKI_ENDPOINT);
        return result;
    },
};
