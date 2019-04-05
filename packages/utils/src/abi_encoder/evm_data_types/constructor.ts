import { ConstructorAbi, DataItem, MethodAbi } from 'ethereum-types';

import { DataType } from '../abstract_data_types/data_type';
import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { DecodingRules, EncodingRules } from '../utils/rules';

import { TupleDataType } from './tuple';

export class ConstructorDataType {
    private readonly _returnDataType: DataType;
    public constructor(abi: ConstructorAbi, dataTypeFactory: DataTypeFactory) {
        const returnDataItem: DataItem = { type: 'tuple', name: 'constructor', components: abi.inputs };
        this._returnDataType = new TupleDataType(returnDataItem, dataTypeFactory);
    }
    public encode(bytecode: string, value: any, rules?: EncodingRules): string {
        const encodedArgs = this._returnDataType.encode(value, rules);
        const returnData = `${bytecode}${encodedArgs.slice(2)}`;
        return returnData;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public decode(calldata: string, rules?: DecodingRules): any[] | object {
        // const value = super.decode(calldata, rules, this.getSelector());
        // return value;
        return {};
    }
}
