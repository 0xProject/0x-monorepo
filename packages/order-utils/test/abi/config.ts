import { DataTypeFactory } from './data_type';
import { EvmDataTypeFactoryImpl } from './evm_data_types';

DataTypeFactory.setImpl(new EvmDataTypeFactoryImpl());