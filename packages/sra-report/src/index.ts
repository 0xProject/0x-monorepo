#!/usr/bin/env node

import { assert } from '@0xproject/assert';
import { Schema, schemas } from '@0xproject/json-schemas';
import chalk from 'chalk';
import * as _ from 'lodash';
import * as newman from 'newman';
import * as yargs from 'yargs';

import * as sraReportCollectionJSON from '../postman_configs/collections/sra_report.postman_collection.json';
import * as kovanTokensEnvironmentJSON from '../postman_configs/environments/kovan_tokens.postman_environment.json';
import * as mainnetTokensEnvironmentJSON from '../postman_configs/environments/mainnet_tokens.postman_environment.json';

import { utils } from './utils';

interface GlobalsValue {
    key: string;
    value: string;
    enabled: boolean;
    type: string;
}

const DEFAULT_NETWORK_ID = 1;
const SUPPORTED_NETWORK_IDS = [1, 42];

// extract command line arguments
const args = yargs
    .option('url', {
        alias: ['u'],
        describe: 'API endpoint to test for standard relayer API compliance',
        type: 'string',
        demandOption: true,
    })
    .option('output', {
        alias: ['o', 'out'],
        describe: 'Folder where to write the reports',
        type: 'string',
        normalize: true,
        demandOption: false,
    })
    .option('network-id', {
        alias: ['n'],
        describe: 'ID of the network that the API is serving orders from',
        type: 'number',
        default: DEFAULT_NETWORK_ID,
    })
    .example("$0 --url 'http://api.example.com' --out 'src/contracts/generated/' --network-id 42", 'Full usage example')
    .argv;
// perform extra validation on command line arguments
try {
    assert.isHttpUrl('args', args.url);
} catch (err) {
    utils.log(`${chalk.red(`Invalid url format:`)} ${args.url}`);
    process.exit(1);
}
if (!_.includes(SUPPORTED_NETWORK_IDS, args.networkId)) {
    utils.log(`${chalk.red(`Unsupported network id:`)} ${args.networkId}`);
    utils.log(`${chalk.bold(`Supported network ids:`)} ${SUPPORTED_NETWORK_IDS}`);
    process.exit(1);
}
// run newman
newman.run(
    {
        collection: sraReportCollectionJSON,
        reporters: 'cli',
        globals: createGlobals(args.url, _.values(schemas)),
        environment: getEnvironment(args.networkId),
    },
    (err: Error) => {
        if (err) {
            throw err;
        }
        utils.log('collection run complete!');
    },
);
function createGlobals(url: string, schemaList: Schema[]) {
    const urlGlobalsValue = {
        key: 'url',
        value: args.url,
        enabled: true,
        type: 'text',
    };
    const schemaGlobalsValues = _.compact(
        _.map(schemaList, (schema: Schema) => {
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
    const schemaKeys = _.map(schemaGlobalsValues, (globalsValue: GlobalsValue) => {
        return globalsValue.key;
    });
    const schemaKeysGlobalsValue = {
        key: 'schemaKeys',
        value: JSON.stringify(schemaKeys),
        enabled: true,
        type: 'text',
    };
    const globalsValues = _.concat(schemaGlobalsValues, urlGlobalsValue, schemaKeysGlobalsValue);
    const globals = {
        values: globalsValues,
    };
    return globals;
}
function convertSchemaIdToKey(schemaId: string) {
    let result = schemaId;
    if (_.startsWith(result, '/')) {
        result = result.substr(1);
    }
    result = `${result}Schema`;
    return result;
}
function getEnvironment(networkId: number) {
    switch (networkId) {
        case 1:
            return mainnetTokensEnvironmentJSON;
        case 42:
            return kovanTokensEnvironmentJSON;
        default:
            return {};
    }
}
