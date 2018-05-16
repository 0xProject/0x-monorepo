import { Schema, SchemaValidator } from '@0xproject/json-schemas';
import { addressUtils, BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as validUrl from 'valid-url';

const HEX_REGEX = /^0x[0-9A-F]*$/i;

export const assert = {
    isBigNumber(variableName: string, value: BigNumber): void {
        const isBigNumber = _.isObject(value) && (value as any).isBigNumber;
        this.assert(isBigNumber, this.typeAssertionMessage(variableName, 'BigNumber', value));
    },
    isValidBaseUnitAmount(variableName: string, value: BigNumber): void {
        assert.isBigNumber(variableName, value);
        const isNegative = value.lessThan(0);
        this.assert(!isNegative, `${variableName} cannot be a negative number, found value: ${value.toNumber()}`);
        const hasDecimals = value.decimalPlaces() !== 0;
        this.assert(
            !hasDecimals,
            `${variableName} should be in baseUnits (no decimals), found value: ${value.toNumber()}`,
        );
    },
    isString(variableName: string, value: string): void {
        this.assert(_.isString(value), this.typeAssertionMessage(variableName, 'string', value));
    },
    isFunction(variableName: string, value: any): void {
        this.assert(_.isFunction(value), this.typeAssertionMessage(variableName, 'function', value));
    },
    isHexString(variableName: string, value: string): void {
        this.assert(
            _.isString(value) && HEX_REGEX.test(value),
            this.typeAssertionMessage(variableName, 'HexString', value),
        );
    },
    isETHAddressHex(variableName: string, value: string): void {
        this.assert(_.isString(value), this.typeAssertionMessage(variableName, 'string', value));
        this.assert(addressUtils.isAddress(value), this.typeAssertionMessage(variableName, 'ETHAddressHex', value));
    },
    doesBelongToStringEnum(
        variableName: string,
        value: string,
        stringEnum: any /* There is no base type for every string enum */,
    ): void {
        const doesBelongToStringEnum = !_.isUndefined(stringEnum[value]);
        const enumValues = _.keys(stringEnum);
        const enumValuesAsStrings = _.map(enumValues, enumValue => `'${enumValue}'`);
        const enumValuesAsString = enumValuesAsStrings.join(', ');
        assert.assert(
            doesBelongToStringEnum,
            `Expected ${variableName} to be one of: ${enumValuesAsString}, encountered: ${value}`,
        );
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
    isWeb3Provider(variableName: string, value: any): void {
        const isWeb3Provider = _.isFunction(value.send) || _.isFunction(value.sendAsync);
        this.assert(isWeb3Provider, this.typeAssertionMessage(variableName, 'Provider', value));
    },
    doesConformToSchema(variableName: string, value: any, schema: Schema, subSchemas?: Schema[]): void {
        const schemaValidator = new SchemaValidator();
        if (!_.isUndefined(subSchemas)) {
            _.map(subSchemas, schemaValidator.addSchema.bind(schemaValidator));
        }
        const validationResult = schemaValidator.validate(value, schema);
        const hasValidationErrors = validationResult.errors.length > 0;
        const msg = `Expected ${variableName} to conform to schema ${schema.id}
Encountered: ${JSON.stringify(value, null, '\t')}
Validation errors: ${validationResult.errors.join(', ')}`;
        this.assert(!hasValidationErrors, msg);
    },
    isWebUri(variableName: string, value: any): void {
        const isValidUrl = !_.isUndefined(validUrl.isWebUri(value));
        this.assert(isValidUrl, this.typeAssertionMessage(variableName, 'web uri', value));
    },
    isUri(variableName: string, value: any): void {
        const isValidUri = !_.isUndefined(validUrl.isUri(value));
        this.assert(isValidUri, this.typeAssertionMessage(variableName, 'uri', value));
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
