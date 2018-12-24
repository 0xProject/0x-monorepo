import { DataItem, SolidityTypes } from 'ethereum-types';
import * as _ from 'lodash';

import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractSetDataType } from '../abstract_data_types/types/set';

export class TupleDataType extends AbstractSetDataType {
    //private readonly _signature: string;

    public static matchType(type: string): boolean {
        return type === SolidityTypes.Tuple;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory);
        if (!TupleDataType.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Tuple with bad input: ${dataItem}`);
        }
        //this._signature =
    }

    public getSignatureType(): string {
        return this._computeSignatureOfMembers(false);
    }

    public getSignature(detailed?: boolean): string {
        if (_.isEmpty(this.getDataItem().name) || !detailed) return this.getSignatureType();
        const name = this.getDataItem().name;
        const shortName = name.indexOf('.') > 0 ? name.substr(name.lastIndexOf('.') + 1) : name;
        const detailedSignature = `${shortName} ${this._computeSignatureOfMembers(detailed)}`;
        return detailedSignature;
    }
}
