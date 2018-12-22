import { fetchAsync } from '@0x/utils';

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
    Leads = 'leads',
    Opportunities = 'opportunities',
    Activities = 'activities',
}

function getUriForEndpoint(endpoint: CopperEndpoint): string {
    return ((_endpoint: CopperEndpoint) => {
        switch (_endpoint) {
            case CopperEndpoint.Leads:
                return '/leads/search';
            case CopperEndpoint.Opportunities:
                return '/opportunities/search';
            case CopperEndpoint.Activities:
                return '/activities/search';
            default:
                return '';
        }
    })(endpoint);
}

function httpErrorCheck(response: Response): void {
    if (response.status !== HTTP_OK_STATUS) {
        throw new Error(`HTTP error while scraping Copper: [${JSON.stringify(response)}]`);
    }
}
export class CopperSource {
    private readonly _maxConcurrentRequests: number;
    private readonly _accessToken: string;
    private readonly _userEmail: string;
    private readonly _DEFAULT_HEADERS: any;

    constructor(maxConcurrentRequests: number, accessToken: string, userEmail: string) {
        this._maxConcurrentRequests = maxConcurrentRequests;
        this._accessToken = accessToken;
        this._userEmail = userEmail;
        this._DEFAULT_HEADERS = {
            'Content-Type': 'application/json',
            'X-PW-AccessToken': this._accessToken,
            'X-PW-Application': 'developer_api',
            'X-PW-UserEmail': this._userEmail,
        };
    }

    public async fetchNumberOfPagesAsync(endpoint: CopperEndpoint, searchParams?: CopperSearchParams): Promise<number> {
        const resp = await fetchAsync(COPPER_URI + getUriForEndpoint(endpoint), {
            method: 'POST',
            body: JSON.stringify({ ...DEFAULT_PAGINATION_PARAMS, ...searchParams }),
            headers: this._DEFAULT_HEADERS,
        });

        httpErrorCheck(resp);

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
        const response = await fetchAsync(COPPER_URI + getUriForEndpoint(endpoint), {
            method: 'POST',
            body: JSON.stringify({ ...DEFAULT_PAGINATION_PARAMS, ...searchParams }),
            headers: this._DEFAULT_HEADERS,
        });
        httpErrorCheck(response);
        const json: T[] = await response.json();
        return json;
    }

    public async fetchActivityTypesAsync(): Promise<Map<CopperActivityTypeCategory, CopperActivityTypeResponse[]>> {
        const response = await fetchAsync(`${COPPER_URI}/activity_types`, {
            method: 'GET',
            headers: this._DEFAULT_HEADERS,
        });
        httpErrorCheck(response);
        return response.json();
    }

    public async fetchCustomFieldsAsync(): Promise<CopperCustomFieldResponse[]> {
        const response = await fetchAsync(`${COPPER_URI}/custom_field_definitions`, {
            method: 'GET',
            headers: this._DEFAULT_HEADERS,
        });
        httpErrorCheck(response);
        return response.json();
    }
}
