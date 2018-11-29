import { DataItem, SolidityTypes } from 'ethereum-types';

import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractSetDataType } from '../abstract_data_types/types/set';

export class TupleDataType extends AbstractSetDataType {
    private readonly _signature: string;

    public static matchType(type: string): boolean {
        return type === SolidityTypes.Tuple;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory);
        if (!TupleDataType.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Tuple with bad input: ${dataItem}`);
        }
        this._signature = this._computeSignatureOfMembers();
    }

    public getSignature(): string {
        return this._signature;
    }
}
