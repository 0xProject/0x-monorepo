import * as _ from 'lodash';

export interface SchemaParameterDefinition {
    name: string;
    type: string;
}

export interface SchemaDefinition {
    name: string;
    parameters: SchemaParameterDefinition[];
}

/**
 * Convert a schema definition into a function string.
 * @param The schema definition.
 * @return The function string of the schema definition..
 */
export function stringifySchema(schema: SchemaDefinition): string {
    const parameters = [];
    for (const parameter of schema.parameters) {
        parameters.push(`${parameter.type} ${parameter.name}`);
    }
    return `${schema.name}(${parameters.join(',')})`;
}
