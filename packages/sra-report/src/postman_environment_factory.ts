import { SignedOrder, ZeroEx } from '0x.js';
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
    createGlobalEnvironment(url: string, order: SignedOrder) {
        const schemas: Schema[] = _.values(schemasByName);
        const schemaEnvironmentValues = _.compact(
            _.map(schemas, (schema: Schema) => {
                if (_.isUndefined(schema.id)) {
                    return undefined;
                } else {
                    const schemaKey = convertSchemaIdToKey(schema.id);
                    const stringifiedSchema = JSON.stringify(schema);
                    const schemaEnvironmentValue = createEnvironmentValue(schemaKey, stringifiedSchema);
                    return schemaEnvironmentValue;
                }
            }),
        );
        const schemaKeys = _.map(schemaEnvironmentValues, (environmentValue: EnvironmentValue) => {
            return environmentValue.key;
        });
        const allEnvironmentValues = _.concat(
            schemaEnvironmentValues,
            createEnvironmentValue('schemaKeys', JSON.stringify(schemaKeys)),
            createEnvironmentValue('url', url),
            createEnvironmentValue('order', JSON.stringify(order)),
            createEnvironmentValue('orderMaker', order.maker),
            createEnvironmentValue('orderTaker', order.taker),
            createEnvironmentValue('orderFeeRecipient', order.feeRecipient),
            createEnvironmentValue('orderHash', ZeroEx.getOrderHashHex(order)),
        );
        const environment = {
            values: allEnvironmentValues,
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
function createEnvironmentValue(key: string, value: string) {
    return {
        key,
        value,
        enabled: true,
        type: 'text',
    };
}
