import { DataItem, SolidityTypes } from 'ethereum-types';
import * as _ from 'lodash';

import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractSetDataType } from '../abstract_data_types/types/set';

export class TupleDataType extends AbstractSetDataType {
    public static matchType(type: string): boolean {
        return type === SolidityTypes.Tuple;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory);
        if (!TupleDataType.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Tuple with bad input: ${dataItem}`);
        }
    }

    public getSignatureType(): string {
        return this._computeSignatureOfMembers(false);
    }

    public getSignature(isDetailed?: boolean): string {
        if (_.isEmpty(this.getDataItem().name) || !isDetailed) {
            return this.getSignatureType();
        }
        const name = this.getDataItem().name;
        const lastIndexOfScopeDelimiter = name.lastIndexOf('.');
        const isScopedName = lastIndexOfScopeDelimiter !== undefined && lastIndexOfScopeDelimiter > 0;
        const shortName = isScopedName ? name.substr((lastIndexOfScopeDelimiter as number) + 1) : name;
        const detailedSignature = `${shortName} ${this._computeSignatureOfMembers(isDetailed)}`;
        return detailedSignature;
    }
}
