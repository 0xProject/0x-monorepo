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
    email: Map<string, string>;
    socials: Array<Map<string, string>>;
    websites: Array<Map<string, string>>;
    phone_numbers: Array<Map<string, string>>;
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
    user = 'user',
    system = 'system',
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
    value?: string;
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
    URL = 'URL',
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

export function parseLeads(leads: CopperLeadResponse[]): CopperLead[] {
    return leads.map(lead => {
        const entity = new CopperLead();
        entity.id = lead.id;
        entity.name = lead.name;
        entity.firstName = lead.first_name;
        entity.lastName = lead.last_name;
        entity.middleName = lead.middle_name;
        entity.assigneeId = lead.assignee_id;
        entity.companyName = lead.company_name;
        entity.customerSourceId = lead.customer_source_id;
        entity.monetaryValue = lead.monetary_value;
        entity.status = lead.status;
        entity.statusId = lead.status_id;
        entity.title = lead.title;

        entity.dateCreated = lead.date_created * ONE_SECOND;
        entity.dateModified = lead.date_modified * ONE_SECOND;

        entity.email = lead.email === null ? 0 : 1;

        // nullable fields
        entity.socials = 0;
        entity.websites = 0;
        entity.phoneNumbers = 0;
        try {
            entity.socials = lead.socials.length;
            entity.websites = lead.websites.length;
            entity.phoneNumbers = lead.phone_numbers.length;
        } catch (e) {
            return entity;
        }

        return entity;
    });
}

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

        // nullable fields
        try {
            entity.oldValueId = activity.old_value.id;
            entity.oldValueName = activity.old_value.name;
            entity.newValueId = activity.new_value.id;
            entity.newValueName = activity.new_value.name;
        } catch (e) {
            return entity;
        }
        return entity;
    });
}

export function parseOpportunities(opportunities: CopperOpportunityResponse[]): CopperOpportunity[] {
    return opportunities.map(opp => {
        const entity = new CopperOpportunity();
        entity.id = opp.id;
        entity.name = opp.name;
        entity.assigneeId = opp.assignee_id;
        entity.closeDate = opp.close_date;
        entity.companyId = opp.company_id;
        entity.companyName = opp.company_name;
        entity.customerSourceId = opp.customer_source_id;
        entity.lossReasonId = opp.loss_reason_id;
        entity.pipelineId = opp.pipeline_id;
        entity.pipelineStageId = opp.pipeline_stage_id;
        entity.primaryContactId = opp.primary_contact_id;
        entity.priority = opp.priority;
        entity.status = opp.status;
        entity.tags = opp.tags;
        entity.interactionCount = opp.interaction_count;
        entity.monetaryValue = opp.monetary_value;
        entity.winProbability = opp.win_probability;
        entity.dateCreated = opp.date_created * ONE_SECOND;
        entity.dateModified = opp.date_modified * ONE_SECOND;
        entity.customFields = opp.custom_fields.map(f => f.custom_field_definition_id);
        return entity;
    });
}

export function parseActivityTypes(
    activityTypeResponse: Map<CopperActivityTypeCategory, CopperActivityTypeResponse[]>,
): CopperActivityType[] {
    const values: CopperActivityTypeResponse[] = R.reduce(
        (acc, val) => acc.concat(val),
        [] as CopperActivityTypeResponse[],
        Object.values(activityTypeResponse),
    );
    return values.map(activityType => {
        const parsed: CopperActivityType = {
            id: activityType.id,
            name: activityType.name,
            category: activityType.category.toString(),
            isDisabled: activityType.is_disabled,
            countAsInteraction: activityType.count_as_interaction,
        };
        return parsed;
    });
}

export function parseCustomFields(customFieldResponse: CopperCustomFieldResponse[]): CopperCustomField[] {
    function parseTopLevelField(field: CopperCustomFieldResponse): CopperCustomField[] {
        const parsed: CopperCustomField = {
            id: field.id,
            name: field.name,
            dataType: field.data_type.toString(),
        };

        if (field.options !== undefined) {
            return R.reduce(
                (acc, option) => acc.concat({ ...option, dataType: field.name, fieldType: 'option' }),
                [parsed],
                field.options,
            );
        } else {
            return [parsed];
        }
    }
    return R.chain(parseTopLevelField, customFieldResponse);
}
