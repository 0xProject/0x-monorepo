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
        const rules_ = _.isUndefined(rules) ? Constants.DEFAULT_ENCODING_RULES : rules;
        const calldata = new Calldata(rules_);
        if (!_.isUndefined(selector)) {
            calldata.setSelector(selector);
        }
        const block = this.generateCalldataBlock(value);
        calldata.setRoot(block);
        const encodedCalldata = calldata.toString();
        return encodedCalldata;
    }

    public decode(calldata: string, rules?: DecodingRules, selector?: string): any {
        if (!_.isUndefined(selector) && !_.startsWith(calldata, selector)) {
            throw new Error(
                `Tried to decode calldata, but it was missing the function selector. Expected prefix '${selector}'. Got '${calldata}'.`,
            );
        }
        const hasSelector = !_.isUndefined(selector);
        const rawCalldata = new RawCalldata(calldata, hasSelector);
        const rules_ = _.isUndefined(rules) ? Constants.DEFAULT_DECODING_RULES : rules;
        const value = this.generateValue(rawCalldata, rules_);
        return value;
    }

    public abstract generateCalldataBlock(value: any, parentBlock?: CalldataBlock): CalldataBlock;
    public abstract generateValue(calldata: RawCalldata, rules: DecodingRules): any;
    public abstract getSignature(): string;
    public abstract isStatic(): boolean;
}
