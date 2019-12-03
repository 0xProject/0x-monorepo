import { AbiEncoder } from '@0x/utils';
import { DataItem, MethodAbi } from 'ethereum-types';

// tslint:disable-next-line:completed-docs
export function formatABIDataItem(abi: DataItem, value: any, formatter: (type: string, value: any) => any): any {
    const trailingArrayRegex = /\[\d*\]$/;
    if (abi.type.match(trailingArrayRegex)) {
        const arrayItemType = abi.type.replace(trailingArrayRegex, '');
        return value.map((val: any) => {
            const arrayItemAbi = {
                ...abi,
                type: arrayItemType,
            };
            return formatABIDataItem(arrayItemAbi, val, formatter);
        });
    } else if (abi.type === 'tuple') {
        const formattedTuple: { [componentName: string]: DataItem } = {};
        if (abi.components) {
            abi.components.forEach(componentABI => {
                formattedTuple[componentABI.name] = formatABIDataItem(
                    componentABI,
                    value[componentABI.name],
                    formatter,
                );
            });
        }
        return formattedTuple;
    } else {
        return formatter(abi.type, value);
    }
}

/**
 * Takes a MethodAbi and returns a function signature for ABI encoding/decoding
 * @return a function signature as a string, e.g. 'functionName(uint256, bytes[])'
 */
export function methodAbiToFunctionSignature(methodAbi: MethodAbi): string {
    const method = AbiEncoder.createMethod(methodAbi.name, methodAbi.inputs);
    return method.getSignature();
}
