import { SignedOrder, ZeroEx } from '0x.js';
import { HttpClient } from '@0xproject/connect';
import { Schema, schemas as schemasByName } from '@0xproject/json-schemas';
import { logUtils } from '@0xproject/utils';
import chalk from 'chalk';
import * as _ from 'lodash';

import { addresses as kovanAddresses } from './contract_addresses/kovan_addresses';
import { addresses as mainnetAddresses } from './contract_addresses/mainnet_addresses';
import { addresses as rinkebyAddresses } from './contract_addresses/rinkeby_addresses';
import { addresses as ropstenAddresses } from './contract_addresses/ropsten_addresses';

const ENVIRONMENT_NAME = 'SRA Report';

export interface EnvironmentValue {
    key: string;
    value: string;
    enabled: true;
    type: 'text';
}

export interface Environment {
    name: string;
    values: EnvironmentValue[];
}

export interface Addresses {
    WETH: string;
    ZRX: string;
    EXCHANGE: string;
}

export const postmanEnvironmentFactory = {
    /**
     * Dynamically generates a postman environment (https://www.getpostman.com/docs/v6/postman/environments_and_globals/manage_environments)
     * When running the postman collection via newman, we provide it a set of environment variables
     * These variables include:
     *  - 0x JSON schemas for response body validation
     *  - Contract addresses based on the network id for making specific queries (ex. baseTokenAddress=ZRX_address)
     *  - Order properties for making specific queries (ex. maker=orderMaker)
     */
    async createPostmanEnvironmentAsync(url: string, networkId: number): Promise<Environment> {
        const orderEnvironmentValues = await createOrderEnvironmentValuesAsync(url);
        const allEnvironmentValues = _.concat(
            createSchemaEnvironmentValues(),
            createContractAddressEnvironmentValues(networkId),
            orderEnvironmentValues,
            createEnvironmentValue('url', url),
        );
        const environment = {
            name: ENVIRONMENT_NAME,
            values: allEnvironmentValues,
        };
        return environment;
    },
};
function createSchemaEnvironmentValues(): EnvironmentValue[] {
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
    const result = _.concat(schemaEnvironmentValues, createEnvironmentValue('schemaKeys', JSON.stringify(schemaKeys)));
    return result;
}
function createContractAddressEnvironmentValues(networkId: number): EnvironmentValue[] {
    const contractAddresses = getContractAddresses(networkId);
    return [
        createEnvironmentValue('tokenContractAddress1', contractAddresses.WETH),
        createEnvironmentValue('tokenContractAddress2', contractAddresses.ZRX),
        createEnvironmentValue('exchangeContractAddress', contractAddresses.EXCHANGE),
    ];
}
async function createOrderEnvironmentValuesAsync(url: string): Promise<EnvironmentValue[]> {
    const httpClient = new HttpClient(url);
    const orders = await httpClient.getOrdersAsync();
    const orderIfExists = _.head(orders);
    if (!_.isUndefined(orderIfExists)) {
        return [
            createEnvironmentValue('order', JSON.stringify(orderIfExists)),
            createEnvironmentValue('orderMaker', orderIfExists.maker),
            createEnvironmentValue('orderTaker', orderIfExists.taker),
            createEnvironmentValue('orderFeeRecipient', orderIfExists.feeRecipient),
            createEnvironmentValue('orderHash', ZeroEx.getOrderHashHex(orderIfExists)),
        ];
    } else {
        logUtils.log(`${chalk.red(`No orders from /orders found`)}`);
        return [
            createEnvironmentValue('order', ''),
            createEnvironmentValue('orderMaker', ''),
            createEnvironmentValue('orderTaker', ''),
            createEnvironmentValue('orderFeeRecipient', ''),
            createEnvironmentValue('orderHash', ''),
        ];
    }
}
function getContractAddresses(networkId: number): Addresses {
    switch (networkId) {
        case 1:
            return mainnetAddresses;
        case 3:
            return ropstenAddresses;
        case 4:
            return rinkebyAddresses;
        case 42:
            return kovanAddresses;
        default:
            throw new Error('Unsupported network id');
    }
}
function convertSchemaIdToKey(schemaId: string): string {
    let result = schemaId;
    if (_.startsWith(result, '/')) {
        result = result.substr(1);
    }
    result = `${result}Schema`;
    return result;
}

function createEnvironmentValue(key: string, value: string): EnvironmentValue {
    return {
        key,
        value,
        enabled: true,
        type: 'text',
    };
}
