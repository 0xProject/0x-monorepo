/* tslint:disable max-classes-per-file */
import { DataItem, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { generateDataItemFromSignature } from './utils/signature_parser';

import { DataType } from './abstract_data_types/data_type';
import { DataTypeFactory } from './abstract_data_types/interfaces';
import { AddressDataType } from './evm_data_types/address';
import { ArrayDataType } from './evm_data_types/array';
import { BoolDataType } from './evm_data_types/bool';
import { DynamicBytesDataType } from './evm_data_types/dynamic_bytes';
import { IntDataType } from './evm_data_types/int';
import { MethodDataType } from './evm_data_types/method';
import { PointerDataType } from './evm_data_types/pointer';
import { StaticBytesDataType } from './evm_data_types/static_bytes';
import { StringDataType } from './evm_data_types/string';
import { TupleDataType } from './evm_data_types/tuple';
import { UIntDataType } from './evm_data_types/uint';

export class Address extends AddressDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Bool extends BoolDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Int extends IntDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class UInt extends UIntDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class StaticBytes extends StaticBytesDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class DynamicBytes extends DynamicBytesDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class String extends StringDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Pointer extends PointerDataType {
    public constructor(destDataType: DataType, parentDataType: DataType) {
        super(destDataType, parentDataType, EvmDataTypeFactory.getInstance());
    }
}

export class Tuple extends TupleDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Array extends ArrayDataType {
    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
    }
}

export class Method extends MethodDataType {
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
        // @TODO: DataTypeement Fixed/UFixed types
        if (dataType === undefined) {
            throw new Error(`Unrecognized data type: '${dataItem.type}'`);
        } else if (parentDataType !== undefined && !dataType.isStatic()) {
            const pointerToDataType = new Pointer(dataType, parentDataType);
            return pointerToDataType;
        }
        return dataType;
    }
    /* tslint:enable prefer-function-over-method */

    private constructor() {}
}

/**
 * Convenience function for creating a DataType from different inputs.
 * @param input A single or set of DataItem or a signature for an EVM data type.
 * @return DataType corresponding to input.
 */
export function create(input: DataItem | DataItem[] | string): DataType {
    const dataItem = consolidateDataItemsIntoSingle(input);
    const dataType = EvmDataTypeFactory.getInstance().create(dataItem);
    return dataType;
}

/**
 * Convenience function to aggregate a single input or a set of inputs into a single DataItem.
 * An array of data items is grouped into a single tuple.
 * @param input A single data item; a set of data items; a signature.
 * @return A single data item corresponding to input.
 */
function consolidateDataItemsIntoSingle(input: DataItem | DataItem[] | string): DataItem {
    let dataItem: DataItem;
    if (_.isArray(input)) {
        const dataItems = input as DataItem[];
        dataItem = {
            name: '',
            type: 'tuple',
            components: dataItems,
        };
    } else {
        dataItem = _.isString(input) ? generateDataItemFromSignature(input) : (input as DataItem);
    }
    return dataItem;
}

/**
 * Convenience function for creating a Method encoder from different inputs.
 * @param methodName name of method.
 * @param input A single data item; a set of data items; a signature; or an array of signatures (optional).
 * @param output A single data item; a set of data items; a signature; or an array of signatures (optional).
 * @return Method corresponding to input.
 */
export function createMethod(
    methodName: string,
    input?: DataItem | DataItem[] | string | string[],
    output?: DataItem | DataItem[] | string | string[],
): Method {
    const methodInput = input === undefined ? [] : consolidateDataItemsIntoArray(input);
    const methodOutput = output === undefined ? [] : consolidateDataItemsIntoArray(output);
    const methodAbi: MethodAbi = {
        name: methodName,
        inputs: methodInput,
        outputs: methodOutput,
        type: 'function',
        // default fields not used by ABI
        constant: false,
        payable: false,
        stateMutability: 'nonpayable',
    };
    const dataType = new Method(methodAbi);
    return dataType;
}

/**
 * Convenience function that aggregates a single input or a set of inputs into an array of DataItems.
 * @param input A single data item; a set of data items; a signature; or an array of signatures.
 * @return Array of data items corresponding to input.
 */
function consolidateDataItemsIntoArray(input: DataItem | DataItem[] | string | string[]): DataItem[] {
    let dataItems: DataItem[];
    if (_.isArray(input) && _.isEmpty(input)) {
        dataItems = [];
    } else if (_.isArray(input) && _.isString(input[0])) {
        dataItems = [];
        _.each(input as string[], (signature: string) => {
            const dataItem = generateDataItemFromSignature(signature);
            dataItems.push(dataItem);
        });
    } else if (_.isArray(input)) {
        dataItems = input as DataItem[];
    } else if (typeof input === 'string') {
        const dataItem = generateDataItemFromSignature(input);
        dataItems = [dataItem];
    } else {
        dataItems = [input as DataItem];
    }
    return dataItems;
}
/* tslint:enable no-construct */
