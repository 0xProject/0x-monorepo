import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { logUtils } from '@0x/utils';

import { CopperEndpoint, CopperSearchParams, CopperSource } from '../data_sources/copper';
import { CopperActivity, CopperActivityType, CopperCustomField, CopperLead, CopperOpportunity } from '../entities';
import * as ormConfig from '../ormconfig';
import {
    CopperSearchResponse,
    parseActivities,
    parseActivityTypes,
    parseCustomFields,
    parseLeads,
    parseOpportunities,
} from '../parsers/copper';
import { handleError } from '../utils';
const ONE_SECOND = 1000;
const COPPER_RATE_LIMIT = 10;
let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);

    const accessToken = process.env.COPPER_ACCESS_TOKEN;
    const userEmail = process.env.COPPER_USER_EMAIL;
    if (accessToken === undefined || userEmail === undefined) {
        throw new Error('Missing required env var: COPPER_ACCESS_TOKEN and/or COPPER_USER_EMAIL');
    }
    const source = new CopperSource(COPPER_RATE_LIMIT, accessToken, userEmail);

    const fetchPromises = [
        fetchAndSaveLeadsAsync(source),
        fetchAndSaveOpportunitiesAsync(source),
        fetchAndSaveActivitiesAsync(source),
        fetchAndSaveCustomFieldsAsync(source),
        fetchAndSaveActivityTypesAsync(source),
    ];
    fetchPromises.forEach(async fn => {
        await fn;
    });
})().catch(handleError);

async function fetchAndSaveLeadsAsync(source: CopperSource): Promise<void> {
    const repository = connection.getRepository(CopperLead);
    const startTime = await getMaxAsync(connection, 'date_modified', 'raw.copper_leads');
    logUtils.log(`Fetching Copper leads starting from ${startTime}...`);
    await fetchAndSaveAsync(CopperEndpoint.Leads, source, startTime, {}, parseLeads, repository);
}

async function fetchAndSaveOpportunitiesAsync(source: CopperSource): Promise<void> {
    const repository = connection.getRepository(CopperOpportunity);
    const startTime = await getMaxAsync(connection, 'date_modified', 'raw.copper_opportunities');
    logUtils.log(`Fetching Copper opportunities starting from ${startTime}...`);
    await fetchAndSaveAsync(
        CopperEndpoint.Opportunities,
        source,
        startTime,
        { sort_by: 'name' },
        parseOpportunities,
        repository,
    );
}

async function fetchAndSaveActivitiesAsync(source: CopperSource): Promise<void> {
    const repository = connection.getRepository(CopperActivity);
    const startTime = await getMaxAsync(connection, 'date_modified', 'raw.copper_activities');
    const searchParams = {
        minimum_activity_date: Math.floor(startTime / ONE_SECOND),
    };
    logUtils.log(`Fetching Copper activities starting from ${startTime}...`);
    await fetchAndSaveAsync(CopperEndpoint.Activities, source, startTime, searchParams, parseActivities, repository);
}

async function getMaxAsync(conn: Connection, sortColumn: string, tableName: string): Promise<number> {
    const queryResult = await conn.query(`SELECT MAX(${sortColumn}) as _max from ${tableName};`);
    if (R.isEmpty(queryResult)) {
        return 0;
    } else {
        return queryResult[0]._max;
    }
}

// (Xianny): Copper API doesn't allow queries to filter by date. To ensure that we are filling in ascending chronological
// order and not missing any records, we are scraping all available pages. If Copper data gets larger,
// it would make sense to search for and start filling from the first page that contains a new record.
// This search would increase our network calls and is not efficient to implement with our current small volume
// of Copper records.
async function fetchAndSaveAsync<T extends CopperSearchResponse, E>(
    endpoint: CopperEndpoint,
    source: CopperSource,
    startTime: number,
    searchParams: CopperSearchParams,
    parseFn: (recs: T[]) => E[],
    repository: Repository<E>,
): Promise<void> {
    let saved = 0;
    const numPages = await source.fetchNumberOfPagesAsync(endpoint);
    try {
        for (let i = numPages; i > 0; i--) {
            logUtils.log(`Fetching page ${i}/${numPages} of ${endpoint}...`);
            const raw = await source.fetchSearchResultsAsync<T>(endpoint, {
                ...searchParams,
                page_number: i,
            });
            const newRecords = raw.filter(rec => rec.date_modified * ONE_SECOND > startTime);
            const parsed = parseFn(newRecords);
            await repository.save<any>(parsed);
            saved += newRecords.length;
        }
    } catch (err) {
        logUtils.log(`Error fetching ${endpoint}, stopping: ${err.stack}`);
    } finally {
        logUtils.log(`Saved ${saved} items from ${endpoint}, done.`);
    }
}

async function fetchAndSaveActivityTypesAsync(source: CopperSource): Promise<void> {
    logUtils.log(`Fetching Copper activity types...`);
    const activityTypes = await source.fetchActivityTypesAsync();
    const repository = connection.getRepository(CopperActivityType);
    await repository.save(parseActivityTypes(activityTypes));
}

async function fetchAndSaveCustomFieldsAsync(source: CopperSource): Promise<void> {
    logUtils.log(`Fetching Copper custom fields...`);
    const customFields = await source.fetchCustomFieldsAsync();
    const repository = connection.getRepository(CopperCustomField);
    await repository.save(parseCustomFields(customFields));
}
