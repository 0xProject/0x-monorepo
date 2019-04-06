import {
    DataItem,
    DecodedLogArgs,
    EventAbi,
    EventParameter,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
    SolidityTypes,
} from 'ethereum-types';
import * as _ from 'lodash';

import { addressUtils, BigNumber } from '../..';
import { DataType } from '../abstract_data_types/data_type';
import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { DecodingRules, EncodingRules } from '../utils/rules';

import { TupleDataType } from './tuple';

export class EventDataType {
    private readonly _abi: EventAbi;
    private readonly _nonIndexedDataType: DataType;
    public constructor(abi: EventAbi, dataTypeFactory: DataTypeFactory) {
        this._abi = abi;
        const nonIndexedParams = _.filter(this._abi.inputs, i => i.indexed === false);
        const nonIndexDataItem = { type: 'tuple', name: 'constructor', components: nonIndexedParams };
        this._nonIndexedDataType = new TupleDataType(nonIndexDataItem, dataTypeFactory);
    }
    // tslint:disable-next-line:prefer-function-over-method
    public encode(bytecode: string, value: any, rules?: EncodingRules): string {
        throw new Error('Unimplemented');
    }

    public decode<ArgsType extends DecodedLogArgs>(
        logEvent: LogEntry,
        rules?: DecodingRules,
    ): LogWithDecodedArgs<ArgsType> | RawLog {
        let decodedData: any[];
        decodedData = this._nonIndexedDataType.decode(logEvent.data);
        let didFailToDecode = false;
        let topicsIndex = 1;
        let decodedDataIndex = 0;
        const decodedParams: DecodedLogArgs = {};
        _.forEach(this._abi.inputs, (param: EventParameter, i: number) => {
            // Indexed parameters are stored in topics. Non-indexed ones in decodedData
            let value: BigNumber | string | number = param.indexed
                ? logEvent.topics[topicsIndex++]
                : _.values(decodedData)[decodedDataIndex++];
            if (_.isUndefined(value)) {
                didFailToDecode = true;
                return;
            }
            if (param.type === SolidityTypes.Address) {
                const baseHex = 16;
                value = addressUtils.padZeros(new BigNumber((value as string).toLowerCase()).toString(baseHex));
            } else if (param.type === SolidityTypes.Uint256 || param.type === SolidityTypes.Uint) {
                value = new BigNumber(value);
            } else if (param.type === SolidityTypes.Uint8) {
                value = new BigNumber(value).toNumber();
            }
            decodedParams[param.name] = value;
        });
        if (didFailToDecode) {
            return logEvent;
        }
        return {
            ...logEvent,
            event: this._abi.name,
            args: decodedParams,
        };
    }
}
