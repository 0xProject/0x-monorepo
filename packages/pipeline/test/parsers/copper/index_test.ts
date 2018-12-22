import * as chai from 'chai';
import 'mocha';

import {
    CopperActivity,
    CopperActivityType,
    CopperCustomField,
    CopperLead,
    CopperOpportunity,
} from '../../../src/entities';
import {
    CopperActivityResponse,
    CopperActivityTypeCategory,
    CopperActivityTypeResponse,
    CopperCustomFieldResponse,
    CopperSearchResponse,
    parseActivities,
    parseActivityTypes,
    parseCustomFields,
    parseLeads,
    parseOpportunities,
} from '../../../src/parsers/copper';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

type CopperResponse = CopperSearchResponse | CopperCustomFieldResponse;
type CopperEntity = CopperLead | CopperActivity | CopperOpportunity | CopperActivityType | CopperCustomField;

import * as activityTypesApiResponse from '../../fixtures/copper/api_v1_activity_types.json';
import * as activityTypesParsed from '../../fixtures/copper/api_v1_activity_types.parsed.json';
import * as customFieldsApiResponse from '../../fixtures/copper/api_v1_custom_field_definitions.json';
import * as customFieldsParsed from '../../fixtures/copper/api_v1_custom_field_definitions.parsed.json';
import * as listActivitiesApiResponse from '../../fixtures/copper/api_v1_list_activities.json';
import * as listActivitiesParsed from '../../fixtures/copper/api_v1_list_activities.parsed.json';
import * as listLeadsApiResponse from '../../fixtures/copper/api_v1_list_leads.json';
import * as listLeadsParsed from '../../fixtures/copper/api_v1_list_leads.parsed.json';
import * as listOpportunitiesApiResponse from '../../fixtures/copper/api_v1_list_opportunities.json';
import * as listOpportunitiesParsed from '../../fixtures/copper/api_v1_list_opportunities.parsed.json';

interface TestCase {
    input: CopperResponse[];
    expected: CopperEntity[];
    parseFn(input: CopperResponse[]): CopperEntity[];
}
const testCases: TestCase[] = [
    {
        input: listLeadsApiResponse,
        expected: (listLeadsParsed as unknown) as CopperLead[],
        parseFn: parseLeads,
    },
    {
        input: listActivitiesApiResponse as unknown as CopperActivityResponse[],
        expected: listActivitiesParsed as CopperActivity[],
        parseFn: parseActivities,
    },
    {
        input: listOpportunitiesApiResponse,
        expected: (listOpportunitiesParsed as unknown) as CopperOpportunity[],
        parseFn: parseOpportunities,
    },
    {
        input: customFieldsApiResponse,
        expected: customFieldsParsed,
        parseFn: parseCustomFields,
    },
];
describe('Copper parser', () => {
    it('parses API responses', () => {
        testCases.forEach(testCase => {
            const actual: CopperEntity[] = testCase.parseFn(testCase.input);
            expect(JSON.stringify(actual)).equal(JSON.stringify(testCase.expected));
        });
    });

    it('parses activity types API response', () => {
        const actual: CopperActivityType[] = parseActivityTypes((activityTypesApiResponse as unknown) as Map<
            CopperActivityTypeCategory,
            CopperActivityTypeResponse[]
        >);
        expect(actual).deep.equal(activityTypesParsed);
    });
});
