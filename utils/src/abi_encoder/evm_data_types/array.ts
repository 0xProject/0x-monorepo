import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractSetDataType } from '../abstract_data_types/types/set';
import { constants } from '../utils/constants';

export class ArrayDataType extends AbstractSetDataType {
    private static readonly _MATCHER = RegExp('^(.+)\\[([0-9]*)\\]$');
    private readonly _elementType: string;

    public static matchType(type: string): boolean {
        return ArrayDataType._MATCHER.test(type);
    }

    private static _decodeElementTypeAndLengthFromType(type: string): [string, undefined | number] {
        const matches = ArrayDataType._MATCHER.exec(type);
        if (matches === null || matches.length !== 3) {
            throw new Error(`Could not parse array: ${type}`);
        } else if (matches[1] === undefined) {
            throw new Error(`Could not parse array type: ${type}`);
        } else if (matches[2] === undefined) {
            throw new Error(`Could not parse array length: ${type}`);
        }
        const arrayElementType = matches[1];
        const arrayLength = _.isEmpty(matches[2]) ? undefined : parseInt(matches[2], constants.DEC_BASE);
        return [arrayElementType, arrayLength];
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        // Construct parent
        const isArray = true;
        const [arrayElementType, arrayLength] = ArrayDataType._decodeElementTypeAndLengthFromType(dataItem.type);
        super(dataItem, dataTypeFactory, isArray, arrayLength, arrayElementType);
        // Set array properties
        this._elementType = arrayElementType;
    }

    public getSignatureType(): string {
        return this._computeSignature(false);
    }

    public getSignature(isDetailed?: boolean): string {
        if (_.isEmpty(this.getDataItem().name) || !isDetailed) {
            return this.getSignatureType();
        }
        const name = this.getDataItem().name;
        const lastIndexOfScopeDelimiter = name.lastIndexOf('.');
        const isScopedName = lastIndexOfScopeDelimiter !== undefined && lastIndexOfScopeDelimiter > 0;
        const shortName = isScopedName ? name.substr((lastIndexOfScopeDelimiter as number) + 1) : name;
        const detailedSignature = `${shortName} ${this._computeSignature(isDetailed)}`;
        return detailedSignature;
    }

    private _computeSignature(isDetailed?: boolean): string {
        // Compute signature for a single array element
        const elementDataItem: DataItem = {
            type: this._elementType,
            name: '',
        };
        const elementComponents = this.getDataItem().components;
        if (elementComponents !== undefined) {
            elementDataItem.components = elementComponents;
        }
        const elementDataType = this.getFactory().create(elementDataItem);
        const elementSignature = elementDataType.getSignature(isDetailed);
        // Construct signature for array of type `element`
        if (this._arrayLength === undefined) {
            return `${elementSignature}[]`;
        } else {
            return `${elementSignature}[${this._arrayLength}]`;
        }
    }
}
