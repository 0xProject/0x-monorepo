/* tslint:disable max-classes-per-file */
import { DataItem, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

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

/* tslint:disable no-construct */
export class EvmDataTypeFactory implements DataTypeFactory {
    private static _instance: DataTypeFactory;

    public static getInstance(): DataTypeFactory {
        if (!EvmDataTypeFactory._instance) {
            EvmDataTypeFactory._instance = new EvmDataTypeFactory();
        }
        return EvmDataTypeFactory._instance;
    }

    /* tslint:disable prefer-function-over-method */
    public create(dataItem: DataItem, parentDataType?: DataType): DataType {
        // Create data type
        let dataType: undefined | DataType;
        if (Array.matchType(dataItem.type)) {
            dataType = new Array(dataItem);
        } else if (Address.matchType(dataItem.type)) {
            dataType = new Address(dataItem);
        } else if (Bool.matchType(dataItem.type)) {
            dataType = new Bool(dataItem);
        } else if (Int.matchType(dataItem.type)) {
            dataType = new Int(dataItem);
        } else if (UInt.matchType(dataItem.type)) {
            dataType = new UInt(dataItem);
        } else if (StaticBytes.matchType(dataItem.type)) {
            dataType = new StaticBytes(dataItem);
        } else if (Tuple.matchType(dataItem.type)) {
            dataType = new Tuple(dataItem);
        } else if (DynamicBytes.matchType(dataItem.type)) {
            dataType = new DynamicBytes(dataItem);
        } else if (String.matchType(dataItem.type)) {
            dataType = new String(dataItem);
        }
        // @TODO: Implement Fixed/UFixed types
        if (_.isUndefined(dataType)) {
            throw new Error(`Unrecognized data type: '${dataItem.type}'`);
        } else if (!_.isUndefined(parentDataType) && !dataType.isStatic()) {
            const pointerToDataType = new Pointer(dataType, parentDataType);
            return pointerToDataType;
        }
        return dataType;
    }
    /* tslint:enable prefer-function-over-method */

    private constructor() {}
}
/* tslint:enable no-construct */
