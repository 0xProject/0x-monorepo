import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { Calldata, CalldataBlock, RawCalldata } from '../calldata';
import { DecodingRules, EncodingRules } from '../utils/rules';

import { DataTypeFactory } from './interfaces';

export abstract class DataType {
    private static readonly _DEFAULT_ENCODING_RULES: EncodingRules = { optimize: false, annotate: false };
    private static readonly _DEFAULT_DECODING_RULES: DecodingRules = { structsAsObjects: false };
    private readonly _dataItem: DataItem;
    private readonly _factory: DataTypeFactory;

    constructor(dataItem: DataItem, factory: DataTypeFactory) {
        this._dataItem = dataItem;
        this._factory = factory;
    }

    public getDataItem(): DataItem {
        return this._dataItem;
    }

    public getFactory(): DataTypeFactory {
        return this._factory;
    }

    public encode(value: any, rules?: EncodingRules, selector?: string): string {
        const rules_ = rules ? rules : DataType._DEFAULT_ENCODING_RULES;
        const calldata = new Calldata(rules_);
        if (selector) {
            calldata.setSelector(selector);
        }
        const block = this.generateCalldataBlock(value);
        calldata.setRoot(block);
        const calldataHex = calldata.toHexString();
        return calldataHex;
    }

    public decode(calldata: string, rules?: DecodingRules, hasSelector: boolean = false): any {
        const rawCalldata = new RawCalldata(calldata, hasSelector);
        const rules_ = rules ? rules : DataType._DEFAULT_DECODING_RULES;
        const value = this.generateValue(rawCalldata, rules_);
        return value;
    }

    public abstract generateCalldataBlock(value: any, parentBlock?: CalldataBlock): CalldataBlock;
    public abstract generateValue(calldata: RawCalldata, rules: DecodingRules): any;
    public abstract getSignature(): string;
    public abstract isStatic(): boolean;
}
