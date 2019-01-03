import 'mocha';
import 'reflect-metadata';

import {
    CopperActivity,
    CopperActivityType,
    CopperCustomField,
    CopperLead,
    CopperOpportunity,
} from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import {
    ParsedActivities,
    ParsedActivityTypes,
    ParsedCustomFields,
    ParsedLeads,
    ParsedOpportunities,
} from '../fixtures/copper/parsed_entities';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

describe('Copper entities', () => {
    describe('save and find', async () => {
        it('Copper lead', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperLead);
            const entity = ParsedLeads[0];
            await testSaveAndFindEntityAsync(repository, entity);
        });
        it('Copper activity', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperActivity);
            const entity = ParsedActivities[0];
            await testSaveAndFindEntityAsync(repository, entity);
        });
        // searching on jsonb fields is broken in typeorm
        it.skip('Copper opportunity', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperOpportunity);
            const entity = ParsedOpportunities[0];
            await testSaveAndFindEntityAsync(repository, entity);
        });
        it('Copper activity type', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperActivityType);
            const entity = ParsedActivityTypes[0];
            await testSaveAndFindEntityAsync(repository, entity);
        });
        it('Copper custom field', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperCustomField);
            const entity = ParsedCustomFields[0];
            await testSaveAndFindEntityAsync(repository, entity);
        });
    });
});
