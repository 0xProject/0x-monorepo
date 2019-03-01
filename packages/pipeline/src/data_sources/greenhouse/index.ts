import { fetchAsync } from '@0x/utils';
import { stringify } from 'querystring';
const HTTP_OK_STATUS = 200;
const GREENHOUSE_URI = 'https://harvest.greenhouse.io/v1';

enum GreenhouseStatus {
    Active = 'active',
    Rejected = 'rejected',
    Hired = 'hired',
}
export interface GreenhouseApplicationResponse {
    id: number;
    candidate_id: number;
    applied_at: string;
    rejected_at?: string;
    last_activity_at: string;
    credited_to: {
        id: number;
        name: string;
    };
    source: {
        id: number;
        public_name: string;
    };
    status: GreenhouseStatus;
    current_stage: {
        id: number;
        name: string;
    };
}

function httpErrorCheck(response: Response): void {
    if (response.status !== HTTP_OK_STATUS) {
        throw new Error(`HTTP error while scraping Greenhouse: [${JSON.stringify(response)}]`);
    }
}
export class GreenhouseSource {
    private readonly _authHeaders: any;

    constructor(accessToken: string) {
        this._authHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${accessToken}:`).toString('base64')}`,
        };
    }

    public async fetchApplicationsAsync(startTime: Date): Promise<GreenhouseApplicationResponse[]> {
        const queryParams = stringify({
            last_activity_after: startTime.toISOString(),
            per_page: 500, // max
        });
        const resp = await fetchAsync(`${GREENHOUSE_URI}/applications?${queryParams}`, {
            headers: this._authHeaders,
        });
        httpErrorCheck(resp);
        return resp.json();
    }
}
