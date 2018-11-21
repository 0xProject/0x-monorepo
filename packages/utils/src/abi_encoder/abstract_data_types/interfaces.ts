import { DataItem } from 'ethereum-types';

import { RawCalldata } from '../calldata';

import { DataType } from './data_type';

export interface DataTypeFactory {
    create: (dataItem: DataItem, parentDataType?: DataType) => DataType;
    mapDataItemToDataType: (dataItem: DataItem) => DataType;
}

export interface DataTypeStaticInterface {
    matchType: (type: string) => boolean;
    encodeValue: (value: any) => Buffer;
    decodeValue: (rawCalldata: RawCalldata) => any;
}

export interface MemberIndexByName {
    [key: string]: number;
}
