import { DataItem, EventAbi, EventParameter, MethodAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DataType } from '../abstract_data_types/data_type';
import { TupleDataType } from './tuple';
import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractSetDataType } from '../abstract_data_types/types/set';
import { constants } from '../utils/constants';
import { DecodingRules, EncodingRules } from '../utils/rules';
import { CommunicationCallMade } from 'material-ui/svg-icons';

export interface EncodedEvent {
    data: string;
    topics: string[];
};

export class EventDataType {
    private readonly _eventSignature: string;
    private readonly _eventSelector: string;

    private readonly _dataType: TupleDataType;
    private readonly _unindexedDataType: TupleDataType;
    private readonly _indexedDataTypes: DataType[];

    public static matchType(type: string): boolean {
        return type === 'event';
    }

    public constructor(abi: EventAbi, dataTypeFactory: DataTypeFactory) {
        // complete data type
        const eventDataItem = { type: 'tuple', name: abi.name, components: abi.inputs };
        this._dataType = new TupleDataType(eventDataItem, dataTypeFactory);
        // unindexed data type
        const unindexedInputs = _.filter(abi.inputs, (input: EventParameter) => {return !input.indexed;});
        const unindexedDataItem = { type: 'tuple', name: abi.name, components: unindexedInputs };
        this._unindexedDataType = new TupleDataType(unindexedDataItem, dataTypeFactory);
        // undexed data type
        const indexedInputs = _.filter(abi.inputs, (input: EventParameter) => {return input.indexed;});
        this._indexedDataTypes = _.map(indexedInputs, (input: EventParameter) => {return dataTypeFactory.create(input)});
        // signature / selector
        this._eventSignature = this._computeSignature();
        this._eventSelector = this._computeSelector();
    }

    public encode(value: any[] | object, rules?: EncodingRules): EncodedEvent {
        const dataItem = this._dataType.getDataItem();
        if (typeof value === 'object') {
            const data = this._unindexedDataType.encode(value, rules);
            let topics = [this._eventSelector];
            _.each(this._indexedDataTypes, (dataType: DataType) => {
                console.log(dataType.getDataItem());
                const calldata = dataType.encode((value as any)[dataType.getDataItem().name]);
                console.log(calldata);
                const calldataHash = ethUtil.sha256(calldata);
                const calldataHashHex = ethUtil.bufferToHex(calldataHash);
                topics.push(calldataHashHex);
            });

            return {
                data: data,
                topics: topics
            }
        } else {
            throw new Error(`as`);
        }
    }

    /*
    public decode(data: string, topics?: string[], rules?: DecodingRules): any[] | object {
        const value = super.decode(data, rules);
        return value;
    }
*/
    private _computeSignature(): string {
        const memberSignature = this._dataType.getSignature();
        const methodSignature = `${this._dataType.getDataItem().name}${memberSignature}`;
        return methodSignature;
    }

    private _computeSelector(): string {
        const signature = this._computeSignature();
        const selector = ethUtil.bufferToHex(
            ethUtil.toBuffer(
                ethUtil
                    .sha3(signature)
            ),
        );
        return selector;
    }
}
