import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import * as Web3 from 'web3';
import {Web3Wrapper} from '../web3_wrapper';
import {SchemaValidator, Schema} from '0x-json-schemas';

const HEX_REGEX = /^0x[0-9A-F]*$/i;

export const assert = {
    isBigNumber(variableName: string, value: BigNumber.BigNumber): void {
        const isBigNumber = _.isObject(value) && value.isBigNumber;
        this.assert(isBigNumber, this.typeAssertionMessage(variableName, 'BigNumber', value));
    },
    isUndefined(value: any, variableName?: string): void {
        this.assert(_.isUndefined(value), this.typeAssertionMessage(variableName, 'undefined', value));
    },
    isString(variableName: string, value: string): void {
        this.assert(_.isString(value), this.typeAssertionMessage(variableName, 'string', value));
    },
    isFunction(variableName: string, value: any): void {
        this.assert(_.isFunction(value), this.typeAssertionMessage(variableName, 'function', value));
    },
    isHexString(variableName: string, value: string): void {
        this.assert(_.isString(value) && HEX_REGEX.test(value),
            this.typeAssertionMessage(variableName, 'HexString', value));
    },
    isETHAddressHex(variableName: string, value: string): void {
        const web3 = new Web3();
        this.assert(web3.isAddress(value), this.typeAssertionMessage(variableName, 'ETHAddressHex', value));
        this.assert(
            web3.isAddress(value) && value.toLowerCase() === value,
            `Checksummed addresses are not supported. Convert ${variableName} to lower case before passing`,
        );
    },
    doesBelongToStringEnum(variableName: string, value: string,
                           stringEnum: any /* There is no base type for every string enum */): void {
        const doesBelongToStringEnum = !_.isUndefined(stringEnum[value]);
        const enumValues = _.keys(stringEnum);
        const enumValuesAsStrings = _.map(enumValues, enumValue => `'${enumValue}'`);
        const enumValuesAsString = enumValuesAsStrings.join(', ');
        assert.assert(
            doesBelongToStringEnum,
            `Expected ${variableName} to be one of: ${enumValuesAsString}, encountered: ${value}`,
        );
    },
    async isSenderAddressAsync(variableName: string, senderAddressHex: string,
                               web3Wrapper: Web3Wrapper): Promise<void> {
        assert.isETHAddressHex(variableName, senderAddressHex);
        const isSenderAddressAvailable = await web3Wrapper.isSenderAddressAvailableAsync(senderAddressHex);
        assert.assert(isSenderAddressAvailable,
            `Specified ${variableName} ${senderAddressHex} isn't available through the supplied web3 provider`,
        );
    },
    async isUserAddressAvailableAsync(web3Wrapper: Web3Wrapper): Promise<void> {
        const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
        this.assert(!_.isEmpty(availableAddresses), 'No addresses were available on the provided web3 provider');
    },
    hasAtMostOneUniqueValue(value: any[], errMsg: string): void {
        this.assert(_.uniq(value).length <= 1, errMsg);
    },
    isNumber(variableName: string, value: number): void {
        this.assert(_.isFinite(value), this.typeAssertionMessage(variableName, 'number', value));
    },
    isBoolean(variableName: string, value: boolean): void {
        this.assert(_.isBoolean(value), this.typeAssertionMessage(variableName, 'boolean', value));
    },
    isWeb3Provider(variableName: string, value: Web3.Provider): void {
        const isWeb3Provider = _.isFunction((value as any).send) || _.isFunction((value as any).sendAsync);
        this.assert(isWeb3Provider, this.typeAssertionMessage(variableName, 'Web3.Provider', value));
    },
    doesConformToSchema(variableName: string, value: any, schema: Schema): void {
        const schemaValidator = new SchemaValidator();
        const validationResult = schemaValidator.validate(value, schema);
        const hasValidationErrors = validationResult.errors.length > 0;
        const msg = `Expected ${variableName} to conform to schema ${schema.id}
Encountered: ${JSON.stringify(value, null, '\t')}
Validation errors: ${validationResult.errors.join(', ')}`;
        this.assert(!hasValidationErrors, msg);
    },
    assert(condition: boolean, message: string): void {
        if (!condition) {
            throw new Error(message);
        }
    },
    typeAssertionMessage(variableName: string, type: string, value: any): string {
        return `Expected ${variableName} to be of type ${type}, encountered: ${value}`;
    },
};
