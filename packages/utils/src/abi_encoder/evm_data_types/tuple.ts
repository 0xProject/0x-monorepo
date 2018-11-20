import { DataItem } from 'ethereum-types';

import { DataTypeFactory, MemberDataType } from '../data_type';

export class Tuple extends MemberDataType {
    private readonly _tupleSignature: string;

    public static matchType(type: string): boolean {
        return type === 'tuple';
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory);
        if (!Tuple.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Tuple with bad input: ${dataItem}`);
        }
        this._tupleSignature = this._computeSignatureOfMembers();
    }

    public getSignature(): string {
        return this._tupleSignature;
    }
}
