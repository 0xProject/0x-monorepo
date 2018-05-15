import * as _ from 'lodash';

import { ArticlesBySection, WebsiteBackendGasInfo, WebsiteBackendPriceInfo, WebsiteBackendRelayerInfo } from 'ts/types';
import { utils } from 'ts/utils/utils';
import { fetchUtils } from 'ts/utils/fetch_utils';

const ETH_GAS_STATION_ENDPOINT = '/eth_gas_station';
const PRICES_ENDPOINT = '/prices';
const RELAYERS_ENDPOINT = '/relayers';
const WIKI_ENDPOINT = '/wiki';

export const backendClient = {
    async getGasInfoAsync(): Promise<WebsiteBackendGasInfo> {
        const result = await fetchUtils.requestAsync(utils.getBackendBaseUrl(), ETH_GAS_STATION_ENDPOINT);
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
        const result = await fetchUtils.requestAsync(utils.getBackendBaseUrl(), PRICES_ENDPOINT, queryParams);
        return result;
    },
    async getRelayerInfosAsync(): Promise<WebsiteBackendRelayerInfo[]> {
        const result = await fetchUtils.requestAsync(utils.getBackendBaseUrl(), RELAYERS_ENDPOINT);
        return result;
    },
    async getWikiArticlesBySectionAsync(): Promise<ArticlesBySection> {
        const result = await fetchUtils.requestAsync(utils.getBackendBaseUrl(), WIKI_ENDPOINT);
        return result;
    },
};
