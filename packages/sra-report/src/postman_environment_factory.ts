import { SignedOrder, ZeroEx } from '0x.js';
import { Schema, schemas as schemasByName } from '@0xproject/json-schemas';
import * as _ from 'lodash';

import { addresses as kovanAddresses} from './contract_addresses/kovan_addresses';
import { addresses as mainnetAddresses} from './contract_addresses/mainnet_addresses';

interface EnvironmentValue {
    key: string;
    value: string;
    enabled: boolean;
    type: string;
}

export const postmanEnvironmentFactory = {
    createPostmanEnvironment(url: string, networkId: number, order: SignedOrder) {
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
        const contractAddresses = getContractAddresses(networkId);
        const contractAddressEnvironmentValues = _.map(_.keys(contractAddresses), (key: string) => {
            const contractAddress = _.get(contractAddresses, key);
            return createEnvironmentValue(key, contractAddress);
        });
        const allEnvironmentValues = _.concat(
            schemaEnvironmentValues,
            contractAddressEnvironmentValues,
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
};
function getContractAddresses(networkId: number) {
    switch (networkId) {
        case 1:
            return mainnetAddresses;
        case 42:
            return kovanAddresses;
        default:
            throw new Error('Unsupported network id');
    }
}
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
