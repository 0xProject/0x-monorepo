import {
    AbiType,
    DecodedLogArgs,
    EventAbi,
    EventParameter,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
    SolidityTypes,
} from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { addressUtils, BigNumber } from '../..';
import { DataType } from '../abstract_data_types/data_type';
import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { DecodingRules, EncodingRules } from '../utils/rules';

import { AddressDataType } from './address';
import { IntDataType } from './int';
import { TupleDataType } from './tuple';
import { UIntDataType } from './uint';

export class EventDataType {
    private readonly _abi: EventAbi;
    private readonly _nonIndexedDataType: DataType;
    private readonly _signature: string;
    private readonly _selector: string;
    public static matchType(type: string): boolean {
        return type === AbiType.Event;
    }
    private static _normalizeValue(type: string, value: BigNumber | string | number): BigNumber | string | number {
        let normalizedValue = value;
        if (AddressDataType.matchType(type)) {
            const baseHex = 16;
            normalizedValue = addressUtils.padZeros(new BigNumber((value as string).toLowerCase()).toString(baseHex));
        } else if (type === SolidityTypes.Uint8) {
            normalizedValue = new BigNumber(value).toNumber();
        } else if (IntDataType.matchType(type) || UIntDataType.matchType(type)) {
            normalizedValue = new BigNumber(value);
        }
        return normalizedValue;
    }
    public constructor(abi: EventAbi, dataTypeFactory: DataTypeFactory) {
        this._abi = abi;
        if (!EventDataType.matchType(abi.type)) {
            throw new Error(`Invalid event ABI type ${abi.type}`);
        }
        const eventDataItem = { type: 'tuple', name: 'function', components: abi.inputs };
        this._signature = new TupleDataType(eventDataItem, dataTypeFactory).getSignature();
        const nonIndexedParams = _.filter(this._abi.inputs, i => i.indexed === false);
        this._nonIndexedDataType = new TupleDataType(
            { ...eventDataItem, components: nonIndexedParams },
            dataTypeFactory,
        );
        this._selector = ethUtil.bufferToHex(ethUtil.toBuffer(ethUtil.sha3(`${this._abi.name}${this._signature}`)));
    }

    public getSignatureType(): string {
        return this._signature;
    }

    public getSelector(): string {
        return this._selector;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public encode(bytecode: string, value: any, rules?: EncodingRules): string {
        throw new Error('Unimplemented');
    }

    public decode<ArgsType extends DecodedLogArgs>(
        logEvent: LogEntry,
        rules?: DecodingRules,
    ): LogWithDecodedArgs<ArgsType> | RawLog {
        if (logEvent.topics[0] !== this.getSelector()) {
            throw new Error(`Invalid log for event ABI, expected ${this.getSelector()}`);
        }
        const decodedData = this._nonIndexedDataType.decode(logEvent.data, rules);
        const decodedDataValues = _.values(decodedData);
        let topicsIndex = 1;
        let decodedDataIndex = 0;
        const decodedParams: DecodedLogArgs = {};
        _.forEach(this._abi.inputs, (param: EventParameter) => {
            // Indexed parameters are stored in topics. Non-indexed ones in decodedData
            const value = param.indexed ? logEvent.topics[topicsIndex++] : decodedDataValues[decodedDataIndex++];
            if (_.isUndefined(value)) {
                throw new Error(`Failed to decode ${param.name}`);
            }
            decodedParams[param.name] = EventDataType._normalizeValue(param.type, value);
        });
        return {
            ...logEvent,
            event: this._abi.name,
            args: decodedParams,
        };
    }
}
