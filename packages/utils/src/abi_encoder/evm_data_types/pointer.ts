import { DataItem } from 'ethereum-types';

import { DataType, DataTypeFactory, DependentDataType } from '../data_type';

export class Pointer extends DependentDataType {
    constructor(destDataType: DataType, parentDataType: DataType, dataTypeFactory: DataTypeFactory) {
        const destDataItem = destDataType.getDataItem();
        const dataItem: DataItem = { name: `ptr<${destDataItem.name}>`, type: `ptr<${destDataItem.type}>` };
        super(dataItem, dataTypeFactory, destDataType, parentDataType);
    }

    public getSignature(): string {
        return this._dependency.getSignature();
    }
}
