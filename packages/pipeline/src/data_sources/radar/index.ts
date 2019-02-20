import { orderParsingUtils } from '@0x/order-utils';
import { fetchAsync, logUtils } from '@0x/utils';
import { RadarBook, RadarMarket, RadarSignedOrder } from '@radarrelay/types';

const RADAR_BASE_URL = 'https://api.radarrelay.com/v2/';
const ACTIVE_MARKETS_URL = `${RADAR_BASE_URL}/markets`;
const MAX_PER_PAGE = 10000;

export const RADAR_SOURCE = 'radar';

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class RadarSource {
    public static parseRadarOrderResponse(radarOrderResponse: any): RadarSignedOrder {
        return {
            ...radarOrderResponse,
            ...orderParsingUtils.convertStringsFieldsToBigNumbers(radarOrderResponse, [
                'remainingBaseTokenAmount',
                'remainingQuoteTokenAmount',
                'price',
            ]),
            signedOrder: orderParsingUtils.convertOrderStringFieldsToBigNumber(radarOrderResponse.signedOrder),
        };
    }
    /**
     * Call Radar API to find out which markets they are maintaining orderbooks for.
     */
    public async getActiveMarketsAsync(): Promise<RadarMarket[]> {
        logUtils.log('Getting all active Radar markets');
        const resp = await fetchAsync(`${ACTIVE_MARKETS_URL}?perPage=${MAX_PER_PAGE}`);
        const markets: RadarMarket[] = await resp.json();
        logUtils.log(`Got ${markets.length} markets.`);
        return markets;
    }

    /**
     * Retrieve orderbook from Radar API for a given market.
     * @param marketId String identifying the market we want data for. Eg. 'REP/AUG'
     */
    public async getMarketOrderbookAsync(marketId: string): Promise<RadarBook> {
        logUtils.log(`${marketId}: Retrieving orderbook.`);
        const marketOrderbookUrl = `${ACTIVE_MARKETS_URL}/${marketId}/book?perPage=${MAX_PER_PAGE}`;
        const resp = await fetchAsync(marketOrderbookUrl);
        const jsonResp = await resp.json();
        return {
            ...jsonResp,
            // tslint:disable-next-line:no-unbound-method
            bids: jsonResp.bids.map(RadarSource.parseRadarOrderResponse),
            // tslint:disable-next-line:no-unbound-method
            asks: jsonResp.asks.map(RadarSource.parseRadarOrderResponse),
        };
    }
}
