import { Schema, schemas as schemasByName } from '@0xproject/json-schemas';
import * as _ from 'lodash';

import * as kovanTokensEnvironmentJSON from '../postman_configs/environments/kovan_tokens.postman_environment.json';
import * as mainnetTokensEnvironmentJSON from '../postman_configs/environments/mainnet_tokens.postman_environment.json';

interface EnvironmentValue {
    key: string;
    value: string;
    enabled: boolean;
    type: string;
}

export const postmanEnvironmentFactory = {
    createGlobalEnvironment(url: string) {
        const urlEnvironmentValue = {
            key: 'url',
            value: url,
            enabled: true,
            type: 'text',
        };
        const schemas: Schema[] = _.values(schemasByName);
        const schemaEnvironmentValues = _.compact(
            _.map(schemas, (schema: Schema) => {
                if (_.isUndefined(schema.id)) {
                    return undefined;
                } else {
                    return {
                        key: convertSchemaIdToKey(schema.id),
                        value: JSON.stringify(schema),
                        enabled: true,
                        type: 'text',
                    };
                }
            }),
        );
        const schemaKeys = _.map(schemaEnvironmentValues, (environmentValue: EnvironmentValue) => {
            return environmentValue.key;
        });
        const schemaKeysEnvironmentValue = {
            key: 'schemaKeys',
            value: JSON.stringify(schemaKeys),
            enabled: true,
            type: 'text',
        };
        const environmentValues = _.concat(schemaEnvironmentValues, urlEnvironmentValue, schemaKeysEnvironmentValue);
        const environment = {
            values: environmentValues,
        };
        return environment;
    },
    createNetworkEnvironment(networkId: number) {
        switch (networkId) {
            case 1:
                return mainnetTokensEnvironmentJSON;
            case 42:
                return kovanTokensEnvironmentJSON;
            default:
                return {};
        }
    },
};

function convertSchemaIdToKey(schemaId: string) {
    let result = schemaId;
    if (_.startsWith(result, '/')) {
        result = result.substr(1);
    }
    result = `${result}Schema`;
    return result;
}
