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
            ParsedLeads.forEach(async entity => testSaveAndFindEntityAsync(repository, entity));
        });
        it('Copper activity', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperActivity);
            ParsedActivities.forEach(async entity => testSaveAndFindEntityAsync(repository, entity));
        });
        // searching on jsonb fields is broken in typeorm
        it.skip('Copper opportunity', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperOpportunity);
            ParsedOpportunities.forEach(async entity => testSaveAndFindEntityAsync(repository, entity));
        });
        it('Copper activity type', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperActivityType);
            ParsedActivityTypes.forEach(async entity => testSaveAndFindEntityAsync(repository, entity));
        });
        it('Copper custom field', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperCustomField);
            ParsedCustomFields.forEach(async entity => testSaveAndFindEntityAsync(repository, entity));
        });
    });
});
