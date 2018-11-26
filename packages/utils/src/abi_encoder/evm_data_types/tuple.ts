import { DataItem } from 'ethereum-types';

import { DataTypeFactory, MemberDataType } from '../abstract_data_types';

export class Tuple extends MemberDataType {
    private readonly _signature: string;

    public static matchType(type: string): boolean {
        return type === 'tuple';
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory);
        if (!Tuple.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Tuple with bad input: ${dataItem}`);
        }
        this._signature = this._computeSignatureOfMembers();
    }

    public getSignature(): string {
        return this._signature;
    }
}
