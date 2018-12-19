import * as _ from 'lodash';

import { DataItem } from 'ethereum-protocol';

/*
export function generateDataItemFromSignature(signature: string): DataItem {
    const dataItems = generateDataItemsFromSignature(signature);
    if (dataItems.length === 1) {
        return dataItems[0];
    }
    // signature represents a tuple
    return {
        name: '',
        type: 'tuple',
        components: dataItems
    };
}*/

export function generateDataItemsFromSignature(signature: string): DataItem[] {
    let trimmedSignature = signature;
    if (signature.startsWith('(')) {
        if(!signature.endsWith(')')) {
            throw new Error(`Failed to generate data item. Must end with ')'`);
        }
        trimmedSignature = signature.substr(1, signature.length - 2);
    }
    trimmedSignature += ',';
    let currTokenIsArray = false;
    let currTokenArrayModifier = "";
    let isParsingArrayModifier = false;
    let currToken = '';
    let parenCount = 0;
    let currTokenName = '';
    const dataItems: DataItem[] = [];
    for(const char of trimmedSignature) {
        // Tokenize the type string while keeping track of parentheses.
        switch (char) {
            case '(':
                parenCount += 1;
                currToken += char;
                break;
            case ')':
                parenCount -= 1;
                currToken += char;
                break;
            case '[':
                if (parenCount === 0) {
                    isParsingArrayModifier = true;
                    currTokenIsArray = true;
                    currTokenArrayModifier += "[";
                } else {
                    currToken += char;
                }
                break;
            case ']':
                if (parenCount === 0) {
                    isParsingArrayModifier = false;
                    currTokenArrayModifier += ']';
                } else {
                    currToken += char;
                }
                break;
            case ' ':
                if (parenCount === 0) {
                    currTokenName = currToken;
                    currToken = "";
                } else {
                    currToken += char;
                }
                break;
            case ',':
                if (parenCount === 0) {
                    //throw new Error(`Generating Data Items`);
                    const components = currToken.startsWith('(') ? generateDataItemsFromSignature(currToken) : [];
                    const isTuple = !_.isEmpty(components);
                    const isArray = currTokenIsArray;
                    let dataItem: DataItem = {name: currTokenName, type: ''};
                    if (isTuple) {
                        dataItem.type = 'tuple';
                        dataItem.components = components;
                    } else {
                        dataItem.type = currToken;
                    }
                    if (isArray) {
                        dataItem.type += currTokenArrayModifier;
                    }
                    
                    dataItems.push(dataItem);

                    currTokenName = '';
                    currToken = '';
                    currTokenIsArray = false;
                    currTokenArrayModifier = "";
                    break;
                } else {
                    currToken += char;
                    break;
                }
            default:
                if (isParsingArrayModifier) {
                    currTokenArrayModifier += char;
                } else {
                    currToken += char;
                }
                break;
        }
    }
    return dataItems;
}