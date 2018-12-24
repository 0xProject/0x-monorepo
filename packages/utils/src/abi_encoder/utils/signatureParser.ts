import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

/**
 * Returns an array of DataItem's corresponding to the input signature.
 * A signature can be in two forms: '<DataItem.type>' or '(<DataItem1.type>, <DataItem2.type>, ...)
 * An example of the first form would be 'address' or 'uint256'
 * An example of the second form would be '(address, uint256)'
 * Signatures can also include a name field, for example: 'foo address' or '(foo address, bar uint256)'
 * @param signature of input DataItems
 * @return DataItems derived from input signature
 */
export function generateDataItemsFromSignature(signature: string): DataItem[] {
    let trimmedSignature = signature;
    if (signature.startsWith('(')) {
        if (!signature.endsWith(')')) {
            throw new Error(`Failed to generate data item. Must end with ')'`);
        }
        trimmedSignature = signature.substr(1, signature.length - 2);
    }
    trimmedSignature += ',';
    let isCurrTokenArray = false;
    let currTokenArrayModifier = '';
    let isParsingArrayModifier = false;
    let currToken = '';
    let parenCount = 0;
    let currTokenName = '';
    const dataItems: DataItem[] = [];
    for (const char of trimmedSignature) {
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
                    isCurrTokenArray = true;
                    currTokenArrayModifier += '[';
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
                    currToken = '';
                } else {
                    currToken += char;
                }
                break;
            case ',':
                if (parenCount === 0) {
                    // Generate new DataItem from token
                    const components = currToken.startsWith('(') ? generateDataItemsFromSignature(currToken) : [];
                    const isTuple = !_.isEmpty(components);
                    const dataItem: DataItem = { name: currTokenName, type: '' };
                    if (isTuple) {
                        dataItem.type = 'tuple';
                        dataItem.components = components;
                    } else {
                        dataItem.type = currToken;
                    }
                    if (isCurrTokenArray) {
                        dataItem.type += currTokenArrayModifier;
                    }
                    dataItems.push(dataItem);
                    // reset token state
                    currTokenName = '';
                    currToken = '';
                    isCurrTokenArray = false;
                    currTokenArrayModifier = '';
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
