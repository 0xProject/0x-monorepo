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
import * as customFieldsApiResponse from '../../fixtures/copper/api_v1_custom_field_definitions.json';
import * as listActivitiesApiResponse from '../../fixtures/copper/api_v1_list_activities.json';
import * as listLeadsApiResponse from '../../fixtures/copper/api_v1_list_leads.json';
import * as listOpportunitiesApiResponse from '../../fixtures/copper/api_v1_list_opportunities.json';
import {
    ParsedActivities,
    ParsedActivityTypes,
    ParsedCustomFields,
    ParsedLeads,
    ParsedOpportunities,
} from '../../fixtures/copper/parsed_entities';

interface TestCase {
    input: CopperResponse[];
    expected: CopperEntity[];
    parseFn(input: CopperResponse[]): CopperEntity[];
}
const testCases: TestCase[] = [
    {
        input: listLeadsApiResponse,
        expected: ParsedLeads,
        parseFn: parseLeads,
    },
    {
        input: (listActivitiesApiResponse as unknown) as CopperActivityResponse[],
        expected: ParsedActivities,
        parseFn: parseActivities,
    },
    {
        input: listOpportunitiesApiResponse,
        expected: ParsedOpportunities,
        parseFn: parseOpportunities,
    },
    {
        input: customFieldsApiResponse,
        expected: ParsedCustomFields,
        parseFn: parseCustomFields,
    },
];
describe('Copper parser', () => {
    it('parses API responses', () => {
        testCases.forEach(testCase => {
            const actual: CopperEntity[] = testCase.parseFn(testCase.input);
            expect(actual).deep.equal(testCase.expected);
        });
    });

    // special case because the API response is not an array
    it('parses activity types API response', () => {
        const actual: CopperActivityType[] = parseActivityTypes((activityTypesApiResponse as unknown) as Map<
            CopperActivityTypeCategory,
            CopperActivityTypeResponse[]
        >);
        expect(actual).deep.equal(ParsedActivityTypes);
    });
});
