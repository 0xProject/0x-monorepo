import { logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as queryString from 'query-string';

import { errorReporter } from 'ts/utils/error_reporter';

export const fetchUtils = {
    async requestAsync(baseUrl: string, path: string, queryParams?: object): Promise<any> {
        const query = queryStringFromQueryParams(queryParams);
        const url = `${baseUrl}${path}${query}`;
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
