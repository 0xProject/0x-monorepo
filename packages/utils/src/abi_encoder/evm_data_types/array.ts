import { DataItem } from 'ethereum-types';

import * as Constants from '../constants';
import { DataTypeFactory, MemberDataType } from '../data_type';

export class Array extends MemberDataType {
    private static readonly _matcher = RegExp('^(.+)\\[([0-9]*)\\]$');
    private readonly _arraySignature: string;
    private readonly _elementType: string;

    public static matchType(type: string): boolean {
        return Array._matcher.test(type);
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        // Sanity check
        const matches = Array._matcher.exec(dataItem.type);
        if (matches === null || matches.length !== 3) {
            throw new Error(`Could not parse array: ${dataItem.type}`);
        } else if (matches[1] === undefined) {
            throw new Error(`Could not parse array type: ${dataItem.type}`);
        } else if (matches[2] === undefined) {
            throw new Error(`Could not parse array length: ${dataItem.type}`);
        }

        const isArray = true;
        const arrayElementType = matches[1];
        const arrayLength = matches[2] === '' ? undefined : parseInt(matches[2], Constants.DEC_BASE);
        super(dataItem, dataTypeFactory, isArray, arrayLength, arrayElementType);
        this._elementType = arrayElementType;
        this._arraySignature = this._computeSignature();
    }

    public getSignature(): string {
        return this._arraySignature;
    }

    private _computeSignature(): string {
        const dataItem: DataItem = {
            type: this._elementType,
            name: 'N/A',
        };
        const components = this.getDataItem().components;
        if (components !== undefined) {
            dataItem.components = components;
        }
        const elementDataType = this.getFactory().mapDataItemToDataType(dataItem);
        const type = elementDataType.getSignature();
        if (this._arrayLength === undefined) {
            return `${type}[]`;
        } else {
            return `${type}[${this._arrayLength}]`;
        }
    }
}
