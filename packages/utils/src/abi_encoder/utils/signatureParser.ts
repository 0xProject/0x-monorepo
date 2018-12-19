import * as _ from 'lodash';

import { DataType } from '../abstract_data_types/data_type';
import { DataItem } from 'ethereum-protocol';
import { MethodAbi } from 'ethereum-types';
import * as EvmDataTypes from '../evm_data_type_factory';

// Valid signatures:
//   functionName(param1, param2, ...): (output1, output2, ...)
//   functionName(param1, param2, ...)
//   (param1, param2, ...)
/*
export function fromSignature(signature: string): DataType {
    const maxSignatureIndex = signature.length - 1;
    // Function name
    const isFunction = signature.startsWith('function ');
    // Output components
    const outputComponentsBeginIndex = signature.indexOf(':');
    const outputComponentsEndIndex = outputComponentsBeginIndex >= 0 ? maxSignatureIndex : 0;
    const hasOutputComponents = outputComponentsBeginIndex >= 0;
    const outputComponentsSignature = hasOutputComponents ? signature.substring(outputComponentsBeginIndex, outputComponentsEndIndex + 1) : "";
    // Input components
    const inputComponentsBeginIndex = signature.indexOf('(');
    const inputComponentsEndIndex = hasOutputComponents ? outputComponentsBeginIndex : maxSignatureIndex;
    const inputComponentsSignature = signature.substring(inputComponentsBeginIndex, inputComponentsEndIndex + 1);
    // Function anme
    const functionName = signature.substr(0, inputComponentsBeginIndex);
    const isFunction = !_.isEmpty(functionName);

    console.log(`sig - ` + inputComponentsSignature);
    // Create data type
    let dataType: DataType;
    if (isFunction) {
        const methodAbi = {
            type: 'function',
            name: functionName,
            inputs: generateDataItems(inputComponentsSignature),
            outputs: !_.isEmpty(outputComponentsSignature) ? generateDataItems(outputComponentsSignature) : [],
        } as MethodAbi;
        dataType = new EvmDataTypes.Method(methodAbi);
    } else if(hasOutputComponents) {
        throw new Error(`Invalid signature: Contains outputs but no function name.`);
    } else {
        const inputDataItem = generateDataItem(inputComponentsSignature);
        console.log(JSON.stringify(inputDataItem));
        dataType = EvmDataTypes.EvmDataTypeFactory.getInstance().create(inputDataItem);
    }
    return dataType;
}*/

export function fromSignature(signature: string): DataType {
    const dataItems = generateDataItems(signature);
    if (dataItems.length === 1) {
        return EvmDataTypes.EvmDataTypeFactory.getInstance().create(dataItems[0]);
    }
    // this is a tuple
    return EvmDataTypes.EvmDataTypeFactory.getInstance().create({
        name: '',
        type: 'tuple',
        components: dataItems
    });
}

function generateDataItems(signature: string): DataItem[] {
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
                    const components = currToken.startsWith('(') ? generateDataItems(currToken) : [];
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