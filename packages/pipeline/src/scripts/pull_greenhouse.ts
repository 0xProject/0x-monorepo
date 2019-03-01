import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { logUtils } from '@0x/utils';

import { GreenhouseSource } from '../data_sources/greenhouse';
import { GreenhouseApplication } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseApplications } from '../parsers/greenhouse';
import { handleError } from '../utils';
let connection: Connection;

const GREENHOUSE_FALLBACK_DATE = '2018-09-01';

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);

    const accessToken = process.env.GREENHOUSE_ACCESS_TOKEN;
    if (accessToken === undefined) {
        throw new Error('Missing required env var: GREENHOUSE_ACCESS_TOKEN');
    }
    const source = new GreenhouseSource(accessToken);

    await fetchAndSaveApplicationsAsync(source);
})().catch(handleError);

async function getStartDateAsync(conn: Connection, sortColumn: string, tableName: string): Promise<Date> {
    if (process.env.GREENHOUSE_START_DATE) {
        return new Date(process.env.GREENHOUSE_START_DATE);
    } else {
        const queryResult = await conn.query(`SELECT MAX(${sortColumn}) as _max from ${tableName};`);
        if (R.isEmpty(queryResult)) {
            return new Date(GREENHOUSE_FALLBACK_DATE);
        } else {
            return new Date(queryResult[0]._max);
        }
    }
}

function getEndDate(): Date {
    if (process.env.GREENHOUSE_END_DATE) {
        return new Date(process.env.GREENHOUSE_END_DATE);
    } else {
        return new Date();
    }
}
async function fetchAndSaveApplicationsAsync(source: GreenhouseSource): Promise<void> {
    const repository = connection.getRepository(GreenhouseApplication);
    const startTime = await getStartDateAsync(connection, 'last_activity_at', 'raw.greenhouse_applications');
    const endTime = getEndDate();
    logUtils.log(`Fetching Greenhouse applications starting from ${startTime}...`);
    const allApplications = await source.fetchApplicationsAsync(startTime);
    const applications = allApplications.filter(app => {
        const date = new Date(app.last_activity_at);
        return date > startTime && date < endTime;
    });
    logUtils.log(
        `Found ${
            applications.length
        } updated Greenhouse applications between ${startTime.toISOString()} and ${endTime.toISOString()}...`,
    );
    const parsed = applications.map(a => parseApplications(a));
    await repository.save(parsed);
    logUtils.log(`Saved ${parsed.length} Greenhouse applications`);
}
