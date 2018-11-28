import { DataItem } from 'ethereum-types';

import { AbstractDataTypes, DataType, DataTypeFactory } from '../abstract_data_types';

export class PointerDataType extends AbstractDataTypes.Pointer {
    constructor(destDataType: DataType, parentDataType: DataType, dataTypeFactory: DataTypeFactory) {
        const destDataItem = destDataType.getDataItem();
        const dataItem: DataItem = { name: `ptr<${destDataItem.name}>`, type: `ptr<${destDataItem.type}>` };
        super(dataItem, dataTypeFactory, destDataType, parentDataType);
    }

    public getSignature(): string {
        return this._destination.getSignature();
    }
}
