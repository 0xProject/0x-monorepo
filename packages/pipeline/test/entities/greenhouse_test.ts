import 'mocha';
import 'reflect-metadata';

import { GreenhouseApplication } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { ParsedApplications } from '../fixtures/greenhouse/api_v1_applications';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

describe('Greenhouse entities', () => {
    describe('save and find', async () => {
        it('Greenhouse application', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(GreenhouseApplication);
            ParsedApplications.forEach(async entity => {
                console.log('hey');
                await testSaveAndFindEntityAsync(repository, entity);
                console.log('ok');
            });
        });
    });
});
