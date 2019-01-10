import { DataItem } from 'ethereum-types';

import { RawCalldata } from '../calldata/raw_calldata';

import { DataType } from './data_type';

export interface DataTypeFactory {
    create: (dataItem: DataItem, parentDataType?: DataType) => DataType;
}

export interface DataTypeStaticInterface {
    matchType: (type: string) => boolean;
    encodeValue: (value: any) => Buffer;
    decodeValue: (rawCalldata: RawCalldata) => any;
}

export interface MemberIndexByName {
    [key: string]: number;
}
