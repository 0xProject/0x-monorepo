/* tslint:disable prefer-function-over-method */
/* tslint:disable max-classes-per-file */
/* tslint:disable no-construct */
import { DataItem, MethodAbi } from 'ethereum-types';

import { DataType, DataTypeFactory } from './abstract_data_types';
import * as Impl from './evm_data_types';

export class Address extends Impl.Address {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Bool extends Impl.Bool {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Int extends Impl.Int {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class UInt extends Impl.UInt {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class StaticBytes extends Impl.StaticBytes {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class DynamicBytes extends Impl.DynamicBytes {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class String extends Impl.String {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Pointer extends Impl.Pointer {
    public constructor(destDataType: DataType, parentDataType: DataType) {
        super(destDataType, parentDataType, EvmDataTypeFactory.getInstance());
    }
}

export class Tuple extends Impl.Tuple {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Array extends Impl.Array {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Method extends Impl.Method {
    public constructor(abi: MethodAbi) {
        super(abi, EvmDataTypeFactory.getInstance());
    }
}

export class EvmDataTypeFactory implements DataTypeFactory {
    private static _instance: DataTypeFactory;

    public static getInstance(): DataTypeFactory {
        if (!EvmDataTypeFactory._instance) {
            EvmDataTypeFactory._instance = new EvmDataTypeFactory();
        }
        return EvmDataTypeFactory._instance;
    }

    public mapDataItemToDataType(dataItem: DataItem): DataType {
        if (Array.matchType(dataItem.type)) {
            return new Array(dataItem);
        } else if (Address.matchType(dataItem.type)) {
            return new Address(dataItem);
        } else if (Bool.matchType(dataItem.type)) {
            return new Bool(dataItem);
        } else if (Int.matchType(dataItem.type)) {
            return new Int(dataItem);
        } else if (UInt.matchType(dataItem.type)) {
            return new UInt(dataItem);
        } else if (StaticBytes.matchType(dataItem.type)) {
            return new StaticBytes(dataItem);
        } else if (Tuple.matchType(dataItem.type)) {
            return new Tuple(dataItem);
        } else if (DynamicBytes.matchType(dataItem.type)) {
            return new DynamicBytes(dataItem);
        } else if (String.matchType(dataItem.type)) {
            return new String(dataItem);
        }
        // @TODO: Implement Fixed/UFixed types
        throw new Error(`Unrecognized data type: '${dataItem.type}'`);
    }

    public create(dataItem: DataItem, parentDataType?: DataType): DataType {
        const dataType = this.mapDataItemToDataType(dataItem);
        if (dataType.isStatic()) {
            return dataType;
        }

        if (parentDataType === undefined) {
            // @Todo -- will this work for return values?
            throw new Error(`Trying to create a pointer`);
        }
        const pointer = new Pointer(dataType, parentDataType);
        return pointer;
    }

    private constructor() {}
}
