import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { Calldata, CalldataBlock, RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';
import { DecodingRules, EncodingRules } from '../utils/rules';

import { DataTypeFactory } from './interfaces';

export abstract class DataType {
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
        const rules_ = rules ? rules : Constants.DEFAULT_ENCODING_RULES;
        const calldata = new Calldata(rules_);
        if (selector) {
            calldata.setSelector(selector);
        }
        const block = this.generateCalldataBlock(value);
        calldata.setRoot(block);
        const encodedCalldata = calldata.toString();
        return encodedCalldata;
    }

    public decode(calldata: string, rules?: DecodingRules, selector?: string): any {
        if (selector && !calldata.startsWith(selector)) {
            throw new Error(
                `Tried to decode calldata, but it was missing the function selector. Expected '${selector}'.`,
            );
        }
        const hasSelector = selector ? true : false;
        const rawCalldata = new RawCalldata(calldata, hasSelector);
        const rules_ = rules ? rules : Constants.DEFAULT_DECODING_RULES;
        const value = this.generateValue(rawCalldata, rules_);
        return value;
    }

    public abstract generateCalldataBlock(value: any, parentBlock?: CalldataBlock): CalldataBlock;
    public abstract generateValue(calldata: RawCalldata, rules: DecodingRules): any;
    public abstract getSignature(): string;
    public abstract isStatic(): boolean;
}
