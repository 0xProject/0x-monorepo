import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import Web3 = require('web3');
import {SchemaValidator} from './schema_validator';

export const assert = {
    isBigNumber(variableName: string, value: BigNumber.BigNumber) {
        const isBigNumber = _.isObject(value) && value.isBigNumber;
        this.assert(isBigNumber, this.typeAssertionMessage(variableName, 'BigNumber', value));
    },
    isString(variableName: string, value: string) {
        this.assert(_.isString(value), this.typeAssertionMessage(variableName, 'string', value));
    },
    isETHAddressHex(variableName: string, value: ETHAddressHex) {
        const web3 = new Web3();
        this.assert(web3.isAddress(value), this.typeAssertionMessage(variableName, 'ETHAddressHex', value));
    },
    isNumber(variableName: string, value: number) {
        this.assert(_.isFinite(value), this.typeAssertionMessage(variableName, 'number', value));
    },
    doesConformToSchema(variableName: string, value: object, schema: Schema) {
        const schemaValidator = new SchemaValidator();
        const validationResult = schemaValidator.validate(value, schema);
        const hasValidationErrors = validationResult.errors.length > 0;
        const msg = `Expected ${variableName} to conform to schema ${schema.id}
Encountered: ${JSON.stringify(value, null, '\t')}
Validation errors: ${validationResult.errors.join(', ')}`;
        this.assert(!hasValidationErrors, msg);
    },
    assert(condition: boolean, message: string) {
        if (!condition) {
            throw new Error(message);
        }
    },
    typeAssertionMessage(variableName: string, type: string, value: any) {
        return `Expected ${variableName} to be of type ${type}, encountered: ${value}`;
    },
};
