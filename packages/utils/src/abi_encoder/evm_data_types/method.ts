import { DataItem, MethodAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DataType } from '../abstract_data_types/data_type';
import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractSetDataType } from '../abstract_data_types/types/set';
import { constants } from '../utils/constants';
import { DecodingRules, EncodingRules } from '../utils/rules';

import { TupleDataType } from './tuple';

export class MethodDataType extends AbstractSetDataType {
    private readonly _methodSignature: string;
    private readonly _methodSelector: string;
    private readonly _returnDataType: DataType;

    public constructor(abi: MethodAbi, dataTypeFactory: DataTypeFactory) {
        const methodDataItem = { type: 'method', name: abi.name, components: abi.inputs };
        super(methodDataItem, dataTypeFactory);
        this._methodSignature = this._computeSignature();
        this._methodSelector = this._computeSelector();
        const returnDataItem: DataItem = { type: 'tuple', name: abi.name, components: abi.outputs };
        this._returnDataType = new TupleDataType(returnDataItem, this.getFactory());
    }

    public encode(value: any, rules?: EncodingRules): string {
        const calldata = super.encode(value, rules, this._methodSelector);
        return calldata;
    }

    public decode(calldata: string, rules?: DecodingRules): any[] | object {
        const value = super.decode(calldata, rules, this._methodSelector);
        return value;
    }

    public strictDecode<T>(calldata: string, rules?: DecodingRules): T {
        const value = super.decode(calldata, rules, this._methodSelector);
        const valueAsArray: any = _.isObject(value) ? _.values(value) : [value];
        switch (valueAsArray.length) {
            case 0:
                return undefined as any;
            case 1:
                return valueAsArray[0];
            default:
                return valueAsArray;
        }
    }

    public encodeReturnValues(value: any, rules?: EncodingRules): string {
        const returnData = this._returnDataType.encode(value, rules);
        return returnData;
    }

    public decodeReturnValues(returndata: string, rules?: DecodingRules): any {
        const returnValues = this._returnDataType.decode(returndata, rules);
        return returnValues;
    }

    public strictDecodeReturnValue<T>(returndata: string, rules?: DecodingRules): T {
        const returnValues = this._returnDataType.decode(returndata, rules);
        const returnValuesAsArray: any = _.isObject(returnValues) ? _.values(returnValues) : [returnValues];
        switch (returnValuesAsArray.length) {
            case 0:
                return undefined as any;
            case 1:
                return returnValuesAsArray[0];
            default:
                return returnValuesAsArray;
        }
    }

    public getSignatureType(): string {
        return this._methodSignature;
    }

    public getSelector(): string {
        return this._methodSelector;
    }

    public getReturnValueDataItem(): DataItem {
        const returnValueDataItem = this._returnDataType.getDataItem();
        return returnValueDataItem;
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
                    .slice(constants.HEX_SELECTOR_BYTE_OFFSET_IN_CALLDATA, constants.HEX_SELECTOR_LENGTH_IN_BYTES),
            ),
        );
        return selector;
    }
}
