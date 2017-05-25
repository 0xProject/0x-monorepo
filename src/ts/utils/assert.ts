import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import Web3 = require('web3');

const HEX_REGEX = /^0x([0-9A-F]{2})*$/i;

export const assert = {
    isBigNumber(variableName: string, value: BigNumber.BigNumber) {
        const isBigNumber = _.isObject(value) && value.isBigNumber;
        this.assert(isBigNumber, this.typeAssertionMessage(variableName, 'BigNumber', value));
    },
    isString(variableName: string, value: string) {
        this.assert(_.isString(value), this.typeAssertionMessage(variableName, 'string', value));
    },
    isHexString(variableName: string, value: string) {
        this.assert(_.isString(value) && HEX_REGEX.test(value),
            this.typeAssertionMessage(variableName, 'HexString', value));
    },
    isETHAddressHex(variableName: string, value: ETHAddressHex) {
        const web3 = new Web3();
        this.assert(web3.isAddress(value), this.typeAssertionMessage(variableName, 'ETHAddressHex', value));
    },
    isObject(variableName: string, value: object) {
        this.assert(_.isObject(value), this.typeAssertionMessage(variableName, 'object', value));
    },
    isNumber(variableName: string, value: number) {
        this.assert(_.isFinite(value), this.typeAssertionMessage(variableName, 'number', value));
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
