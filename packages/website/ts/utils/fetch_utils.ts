import { fetchAsync, logUtils } from '@0x/utils';
import * as _ from 'lodash';
import * as queryString from 'query-string';

import { errorReporter } from 'ts/utils/error_reporter';

const logErrorIfPresent = (response: Response, requestedURL: string) => {
    if (response.status !== 200) {
        const errorText = `Error requesting url: ${requestedURL}, ${response.status}: ${response.statusText}`;
        logUtils.log(errorText);
        const error = Error(errorText);
        errorReporter.report(error);
        throw error;
    }
};

export const fetchUtils = {
    async requestAsync(baseUrl: string, path: string, queryParams?: object): Promise<any> {
        const query = queryStringFromQueryParams(queryParams);
        const url = `${baseUrl}${path}${query}`;
        const response = await fetchAsync(url);
        logErrorIfPresent(response, url);
        const result = await response.json();
        return result;
    },
    async postAsync(baseUrl: string, path: string, body: object): Promise<Response> {
        const url = `${baseUrl}${path}`;
        const response = await fetchAsync(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        logErrorIfPresent(response, url);
        return response;
    },
};

function queryStringFromQueryParams(queryParams?: object): string {
    // if params are undefined or empty, return an empty string
    if (_.isUndefined(queryParams) || _.isEmpty(queryParams)) {
        return '';
    }
    // stringify the formatted object
    const stringifiedParams = queryString.stringify(queryParams);
    return `?${stringifiedParams}`;
}
