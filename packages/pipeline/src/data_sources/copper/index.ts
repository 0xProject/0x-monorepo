import { fetchAsync } from '@0x/utils';
import Bottleneck from 'bottleneck';

import {
    CopperActivityTypeCategory,
    CopperActivityTypeResponse,
    CopperCustomFieldResponse,
    CopperSearchResponse,
} from '../../parsers/copper';

const HTTP_OK_STATUS = 200;
const COPPER_URI = 'https://api.prosperworks.com/developer_api/v1';

const DEFAULT_PAGINATION_PARAMS = {
    page_size: 200,
    sort_by: 'date_modified',
    sort_direction: 'desc',
};

export type CopperSearchParams = CopperLeadSearchParams | CopperActivitySearchParams | CopperOpportunitySearchParams;
export interface CopperLeadSearchParams {
    page_number?: number;
}

export interface CopperActivitySearchParams {
    minimum_activity_date: number;
    page_number?: number;
}

export interface CopperOpportunitySearchParams {
    sort_by: string; // must override the default 'date_modified' for this endpoint
    page_number?: number;
}
export enum CopperEndpoint {
    Leads = '/leads/search',
    Opportunities = '/opportunities/search',
    Activities = '/activities/search',
}
const ONE_SECOND = 1000;

function httpErrorCheck(response: Response): void {
    if (response.status !== HTTP_OK_STATUS) {
        throw new Error(`HTTP error while scraping Copper: [${JSON.stringify(response)}]`);
    }
}
export class CopperSource {
    private readonly _accessToken: string;
    private readonly _userEmail: string;
    private readonly _defaultHeaders: any;
    private readonly _limiter: Bottleneck;

    constructor(maxConcurrentRequests: number, accessToken: string, userEmail: string) {
        this._accessToken = accessToken;
        this._userEmail = userEmail;
        this._defaultHeaders = {
            'Content-Type': 'application/json',
            'X-PW-AccessToken': this._accessToken,
            'X-PW-Application': 'developer_api',
            'X-PW-UserEmail': this._userEmail,
        };
        this._limiter = new Bottleneck({
            minTime: ONE_SECOND / maxConcurrentRequests,
            reservoir: 30,
            reservoirRefreshAmount: 30,
            reservoirRefreshInterval: maxConcurrentRequests,
        });
    }

    public async fetchNumberOfPagesAsync(endpoint: CopperEndpoint, searchParams?: CopperSearchParams): Promise<number> {
        const resp = await this._limiter.schedule(() =>
            fetchAsync(COPPER_URI + endpoint, {
                method: 'POST',
                body: JSON.stringify({ ...DEFAULT_PAGINATION_PARAMS, ...searchParams }),
                headers: this._defaultHeaders,
            }),
        );

        httpErrorCheck(resp);

        // total number of records that match the request parameters
        if (resp.headers.has('X-Pw-Total')) {
            const totalRecords: number = parseInt(resp.headers.get('X-Pw-Total') as string, 10); // tslint:disable-line:custom-no-magic-numbers
            return Math.ceil(totalRecords / DEFAULT_PAGINATION_PARAMS.page_size);
        } else {
            return 1;
        }
    }
    public async fetchSearchResultsAsync<T extends CopperSearchResponse>(
        endpoint: CopperEndpoint,
        searchParams?: CopperSearchParams,
    ): Promise<T[]> {
        const request = { ...DEFAULT_PAGINATION_PARAMS, ...searchParams };
        const response = await this._limiter.schedule(() =>
            fetchAsync(COPPER_URI + endpoint, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: this._defaultHeaders,
            }),
        );
        httpErrorCheck(response);
        const json: T[] = await response.json();
        return json;
    }

    public async fetchActivityTypesAsync(): Promise<Map<CopperActivityTypeCategory, CopperActivityTypeResponse[]>> {
        const response = await this._limiter.schedule(() =>
            fetchAsync(`${COPPER_URI}/activity_types`, {
                method: 'GET',
                headers: this._defaultHeaders,
            }),
        );
        httpErrorCheck(response);
        return response.json();
    }

    public async fetchCustomFieldsAsync(): Promise<CopperCustomFieldResponse[]> {
        const response = await this._limiter.schedule(() =>
            fetchAsync(`${COPPER_URI}/custom_field_definitions`, {
                method: 'GET',
                headers: this._defaultHeaders,
            }),
        );
        httpErrorCheck(response);
        return response.json();
    }
}
