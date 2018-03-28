import { DataItem } from '@0xproject/types';
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
