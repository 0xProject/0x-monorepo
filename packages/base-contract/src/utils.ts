import { DataItem, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

// tslint:disable-next-line:completed-docs
export function formatABIDataItem(abi: DataItem, value: any, formatter: (type: string, value: any) => any): any {
    const trailingArrayRegex = /\[\d*\]$/;
    if (abi.type.match(trailingArrayRegex)) {
        const arrayItemType = abi.type.replace(trailingArrayRegex, '');
        return _.map(value, val => {
            const arrayItemAbi = {
                ...abi,
                type: arrayItemType,
            };
            return formatABIDataItem(arrayItemAbi, val, formatter);
        });
    } else if (abi.type === 'tuple') {
        const formattedTuple: { [componentName: string]: DataItem } = {};
        _.forEach(abi.components, componentABI => {
            formattedTuple[componentABI.name] = formatABIDataItem(componentABI, value[componentABI.name], formatter);
        });
        return formattedTuple;
    } else {
        return formatter(abi.type, value);
    }
}

function dataItemsToABIString(dataItems: DataItem[]): string {
    const types = dataItems.map(item => {
        if (item.components) {
            return `(${dataItemsToABIString(item.components)})`;
        } else {
            return item.type;
        }
    });
    return `${types.join(',')}`;
}
/**
 * Takes a MethodAbi and returns a function signature for ABI encoding/decoding
 * @return a function signature as a string, e.g. 'functionName(uint256, bytes[])'
 */
export function methodAbiToFunctionSignature(methodAbi: MethodAbi): string {
    const inputs = dataItemsToABIString(methodAbi.inputs);
    return `${methodAbi.name}(${inputs})`;
}
