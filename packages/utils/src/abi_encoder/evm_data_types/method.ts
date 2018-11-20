import { DataItem, MethodAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DecodingRules, EncodingRules, RawCalldata } from '../calldata';
import * as Constants from '../constants';
import { DataType, DataTypeFactory, MemberDataType } from '../data_type';

import { StaticBytes } from './static_bytes';
import { Tuple } from './tuple';

export class Method extends MemberDataType {
    // TMP
    public selector: string;

    private readonly _methodSignature: string;
    private readonly _methodSelector: string;
    private readonly _returnDataTypes: DataType[];
    private readonly _returnDataItem: DataItem;

    public constructor(abi: MethodAbi, dataTypeFactory: DataTypeFactory) {
        super({ type: 'method', name: abi.name, components: abi.inputs }, dataTypeFactory);
        this._methodSignature = this._computeSignature();
        this.selector = this._methodSelector = this._computeSelector();
        this._returnDataTypes = [];
        this._returnDataItem = { type: 'tuple', name: abi.name, components: abi.outputs };
        const dummy = new StaticBytes({ type: 'byte', name: 'DUMMY' }, dataTypeFactory); // @TODO TMP
        _.each(abi.outputs, (dataItem: DataItem) => {
            this._returnDataTypes.push(this.getFactory().create(dataItem, dummy));
        });
    }

    public encode(value: any, rules?: EncodingRules): string {
        const calldata = super.encode(value, rules, this.selector);
        return calldata;
    }

    public decode(calldata: string, rules?: DecodingRules): any[] | object {
        if (!calldata.startsWith(this.selector)) {
            throw new Error(
                `Tried to decode calldata, but it was missing the function selector. Expected '${this.selector}'.`,
            );
        }
        const hasSelector = true;
        const value = super.decode(calldata, rules, hasSelector);
        return value;
    }

    public encodeReturnValues(value: any, rules?: EncodingRules): string {
        const returnDataType = new Tuple(this._returnDataItem, this.getFactory());
        const returndata = returnDataType.encode(value, rules);
        return returndata;
    }

    public decodeReturnValues(returndata: string, rules?: DecodingRules): any {
        const returnValues: any[] = [];
        const rules_: DecodingRules = rules ? rules : { structsAsObjects: false };
        const rawReturnData = new RawCalldata(returndata, false);
        _.each(this._returnDataTypes, (dataType: DataType) => {
            returnValues.push(dataType.generateValue(rawReturnData, rules_));
        });
        return returnValues;
    }

    public getSignature(): string {
        return this._methodSignature;
    }

    public getSelector(): string {
        return this._methodSelector;
    }

    private _computeSignature(): string {
        const memberSignature = this._computeSignatureOfMembers();
        const methodSignature = `${this.getDataItem().name}${memberSignature}`;
        return methodSignature;
    }

    private _computeSelector(): string {
        const signature = this._computeSignature();
        const selector = ethUtil.bufferToHex(
            ethUtil.toBuffer(
                ethUtil
                    .sha3(signature)
                    .slice(Constants.HEX_SELECTOR_BYTE_OFFSET_IN_CALLDATA, Constants.HEX_SELECTOR_LENGTH_IN_BYTES),
            ),
        );
        return selector;
    }
}
