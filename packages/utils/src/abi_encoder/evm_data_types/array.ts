import { DataItem } from 'ethereum-types';

import { AbstractDataTypes, DataTypeFactory } from '../abstract_data_types';
import * as Constants from '../utils/constants';

export class Array extends AbstractDataTypes.Set {
    private static readonly _MATCHER = RegExp('^(.+)\\[([0-9]*)\\]$');
    private readonly _arraySignature: string;
    private readonly _elementType: string;

    public static matchType(type: string): boolean {
        return Array._MATCHER.test(type);
    }

    private static _decodeElementTypeAndLengthFromType(type: string): [string, undefined | number] {
        const matches = Array._MATCHER.exec(type);
        if (matches === null || matches.length !== 3) {
            throw new Error(`Could not parse array: ${type}`);
        } else if (matches[1] === undefined) {
            throw new Error(`Could not parse array type: ${type}`);
        } else if (matches[2] === undefined) {
            throw new Error(`Could not parse array length: ${type}`);
        }
        const arrayElementType = matches[1];
        const arrayLength = matches[2] === '' ? undefined : parseInt(matches[2], Constants.DEC_BASE);
        return [arrayElementType, arrayLength];
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        // Construct parent
        const isArray = true;
        const [arrayElementType, arrayLength] = Array._decodeElementTypeAndLengthFromType(dataItem.type);
        super(dataItem, dataTypeFactory, isArray, arrayLength, arrayElementType);
        // Set array properties
        this._elementType = arrayElementType;
        this._arraySignature = this._computeSignature();
    }

    public getSignature(): string {
        return this._arraySignature;
    }

    private _computeSignature(): string {
        // Compute signature for a single array element
        const elementDataItem: DataItem = {
            type: this._elementType,
            name: 'N/A',
        };
        const elementComponents = this.getDataItem().components;
        if (elementComponents !== undefined) {
            elementDataItem.components = elementComponents;
        }
        const elementDataType = this.getFactory().create(elementDataItem);
        const elementSignature = elementDataType.getSignature();
        // Construct signature for array of type `element`
        if (this._arrayLength === undefined) {
            return `${elementSignature}[]`;
        } else {
            return `${elementSignature}[${this._arrayLength}]`;
        }
    }
}
