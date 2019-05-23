import * as R from 'ramda';

import { CopperActivity, CopperActivityType, CopperCustomField, CopperLead, CopperOpportunity } from '../../entities';

const ONE_SECOND = 1000;
export type CopperSearchResponse = CopperLeadResponse | CopperActivityResponse | CopperOpportunityResponse;
export interface CopperLeadResponse {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    assignee_id?: number;
    company_name?: string;
    customer_source_id?: number;
    monetary_value?: number;
    status: string;
    status_id: number;
    title?: string;
    date_created: number; // in seconds
    date_modified: number; // in seconds
}

export interface CopperActivityResponse {
    id: number;
    parent: CopperActivityParentResponse;
    type: CopperActivityTypeResponse;
    user_id: number;
    activity_date: number;
    old_value: CopperActivityValueResponse;
    new_value: CopperActivityValueResponse;
    date_created: number; // in seconds
    date_modified: number; // in seconds
}

export interface CopperActivityValueResponse {
    id: number;
    name: string;
}
export interface CopperActivityParentResponse {
    id: number;
    type: string;
}

// custom activity types
export enum CopperActivityTypeCategory {
    User = 'user',
    System = 'system',
}
export interface CopperActivityTypeResponse {
    id: number;
    category: CopperActivityTypeCategory;
    name: string;
    is_disabled?: boolean;
    count_as_interaction?: boolean;
}

export interface CopperOpportunityResponse {
    id: number;
    name: string;
    assignee_id?: number;
    close_date?: string;
    company_id?: number;
    company_name?: string;
    customer_source_id?: number;
    loss_reason_id?: number;
    pipeline_id: number;
    pipeline_stage_id: number;
    primary_contact_id?: number;
    priority?: string;
    status: string;
    tags: string[];
    interaction_count: number;
    monetary_value?: number;
    win_probability?: number;
    date_created: number; // in seconds
    date_modified: number; // in seconds
    custom_fields: CopperNestedCustomFieldResponse[];
}
interface CopperNestedCustomFieldResponse {
    custom_field_definition_id: number;
    value: number | number[] | null;
}
// custom fields
export enum CopperCustomFieldType {
    String = 'String',
    Text = 'Text',
    Dropdown = 'Dropdown',
    MultiSelect = 'MultiSelect', // not in API documentation but shows up in results
    Date = 'Date',
    Checkbox = 'Checkbox',
    Float = 'Float',
    URL = 'URL', // tslint:disable-line:enum-naming
    Percentage = 'Percentage',
    Currency = 'Currency',
    Connect = 'Connect',
}
export interface CopperCustomFieldOptionResponse {
    id: number;
    name: string;
}
export interface CopperCustomFieldResponse {
    id: number;
    name: string;
    data_type: CopperCustomFieldType;
    options?: CopperCustomFieldOptionResponse[];
}
/**
 * Parse response from Copper API /search/leads/
 *
 * @param leads - The array of leads returned from the API
 * @returns Returns an array of Copper Lead entities
 */
export function parseLeads(leads: CopperLeadResponse[]): CopperLead[] {
    return leads.map(lead => {
        const entity = new CopperLead();
        entity.id = lead.id;
        entity.name = lead.name || undefined;
        entity.firstName = lead.first_name || undefined;
        entity.lastName = lead.last_name || undefined;
        entity.middleName = lead.middle_name || undefined;
        entity.assigneeId = lead.assignee_id || undefined;
        entity.companyName = lead.company_name || undefined;
        entity.customerSourceId = lead.customer_source_id || undefined;
        entity.monetaryValue = lead.monetary_value || undefined;
        entity.status = lead.status;
        entity.statusId = lead.status_id;
        entity.title = lead.title || undefined;
        entity.dateCreated = lead.date_created * ONE_SECOND;
        entity.dateModified = lead.date_modified * ONE_SECOND;
        return entity;
    });
}

/**
 * Parse response from Copper API /search/activities/
 *
 * @param activities - The array of activities returned from the API
 * @returns Returns an array of Copper Activity entities
 */
export function parseActivities(activities: CopperActivityResponse[]): CopperActivity[] {
    return activities.map(activity => {
        const entity = new CopperActivity();
        entity.id = activity.id;

        entity.parentId = activity.parent.id;
        entity.parentType = activity.parent.type;

        entity.typeId = activity.type.id;
        entity.typeCategory = activity.type.category.toString();
        entity.typeName = activity.type.name;

        entity.userId = activity.user_id;
        entity.dateCreated = activity.date_created * ONE_SECOND;
        entity.dateModified = activity.date_modified * ONE_SECOND;

        // nested nullable fields
        entity.oldValueId = R.path(['old_value', 'id'], activity);
        entity.oldValueName = R.path(['old_value', 'name'], activity);
        entity.newValueId = R.path(['new_value', 'id'], activity);
        entity.newValueName = R.path(['new_value', 'name'], activity);

        return entity;
    });
}

/**
 * Parse response from Copper API /search/opportunities/
 *
 * @param opportunities - The array of opportunities returned from the API
 * @returns Returns an array of Copper Opportunity entities
 */
export function parseOpportunities(opportunities: CopperOpportunityResponse[]): CopperOpportunity[] {
    return opportunities.map(opp => {
        const customFields: { [key: number]: number } = opp.custom_fields
            .filter(f => f.value !== null)
            .map(f => ({
                ...f,
                value: ([] as number[]).concat(f.value || []), // normalise all values to number[]
            }))
            .map(f => f.value.map(val => [f.custom_field_definition_id, val] as [number, number])) // pair each value with the custom_field_definition_id
            .reduce((acc, pair) => acc.concat(pair)) // flatten
            .reduce<{ [key: number]: number }>((obj, [key, value]) => {
                // transform into object literal
                obj[key] = value;
                return obj;
            }, {});

        const entity = new CopperOpportunity();
        entity.id = opp.id;
        entity.name = opp.name;
        entity.assigneeId = opp.assignee_id || undefined;
        entity.closeDate = opp.close_date || undefined;
        entity.companyId = opp.company_id || undefined;
        entity.companyName = opp.company_name || undefined;
        entity.customerSourceId = opp.customer_source_id || undefined;
        entity.lossReasonId = opp.loss_reason_id || undefined;
        entity.pipelineId = opp.pipeline_id;
        entity.pipelineStageId = opp.pipeline_stage_id;
        entity.primaryContactId = opp.primary_contact_id || undefined;
        entity.priority = opp.priority || undefined;
        entity.status = opp.status;
        entity.interactionCount = opp.interaction_count;
        entity.monetaryValue = opp.monetary_value || undefined;
        entity.winProbability = opp.win_probability === null ? undefined : opp.win_probability;
        entity.dateCreated = opp.date_created * ONE_SECOND;
        entity.dateModified = opp.date_modified * ONE_SECOND;
        entity.customFields = customFields;
        return entity;
    });
}

/**
 * Parse response from Copper API /activity_types/
 *
 * @param activityTypeResponse - Activity Types response from the API, keyed by "user" or "system"
 * @returns Returns an array of Copper Activity Type entities
 */
export function parseActivityTypes(
    activityTypeResponse: Map<CopperActivityTypeCategory, CopperActivityTypeResponse[]>,
): CopperActivityType[] {
    const values: CopperActivityTypeResponse[] = R.flatten(Object.values(activityTypeResponse));
    return values.map(activityType => ({
        id: activityType.id,
        name: activityType.name,
        category: activityType.category.toString(),
        isDisabled: activityType.is_disabled,
        countAsInteraction: activityType.count_as_interaction,
    }));
}

/**
 * Parse response from Copper API /custom_field_definitions/
 *
 * @param customFieldResponse - array of custom field definitions returned from the API, consisting of top-level fields and nested fields
 * @returns Returns an array of Copper Custom Field entities
 */
export function parseCustomFields(customFieldResponse: CopperCustomFieldResponse[]): CopperCustomField[] {
    function parseTopLevelField(field: CopperCustomFieldResponse): CopperCustomField[] {
        const topLevelField: CopperCustomField = {
            id: field.id,
            name: field.name,
            dataType: field.data_type.toString(),
        };

        if (field.options !== undefined) {
            const nestedFields: CopperCustomField[] = field.options.map(option => ({
                id: option.id,
                name: option.name,
                dataType: field.name,
                fieldType: 'option',
            }));
            return nestedFields.concat(topLevelField);
        } else {
            return [topLevelField];
        }
    }
    return R.chain(parseTopLevelField, customFieldResponse);
}
