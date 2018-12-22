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
import * as activityTypesData from '../fixtures/copper/api_v1_activity_types.parsed.json';
import * as customFieldsData from '../fixtures/copper/api_v1_custom_field_definitions.parsed.json';
import * as activitiesData from '../fixtures/copper/api_v1_list_activities.parsed.json';
import * as leadsData from '../fixtures/copper/api_v1_list_leads.parsed.json';
import * as opportunitiesData from '../fixtures/copper/api_v1_list_opportunities.parsed.json';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

// tslint:disable:custom-no-magic-numbers
describe('Copper entities', () => {
    describe('save and find', async () => {
        it('Copper lead', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperLead);
            const entity = (leadsData[0] as unknown) as CopperLead;
            await testSaveAndFindEntityAsync(repository, entity);
        });
        it('Copper activity', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperActivity);
            const entity = (activitiesData[0] as unknown) as CopperActivity;
            await testSaveAndFindEntityAsync(repository, entity);
        });
        // searching on jsonb fields is broken in typeorm
        it.skip('Copper opportunity', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperOpportunity);
            const entity = (opportunitiesData[0] as unknown) as CopperOpportunity;
            await testSaveAndFindEntityAsync(repository, entity);
        });
        it('Copper activity type', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperActivityType);
            const entity = (activityTypesData[0] as unknown) as CopperActivityType;
            await testSaveAndFindEntityAsync(repository, entity);
        });
        it('Copper custom field', async () => {
            const connection = await createDbConnectionOnceAsync();
            const repository = connection.getRepository(CopperCustomField);
            const entity = (customFieldsData[0] as unknown) as CopperCustomField;
            await testSaveAndFindEntityAsync(repository, entity);
        });
    });
});
