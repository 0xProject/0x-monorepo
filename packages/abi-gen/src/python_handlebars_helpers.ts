import * as Handlebars from 'handlebars';

import { DataItem } from 'ethereum-types';

import { utils } from './utils';

export const pythonHandlebarsHelpers = {
    /**
     * Produces a Python expression representing the return value from a
     * Solidity function.
     * @param pythonVariable the name of the Python variable holding the value
     *     to be used to populate the output expression.
     * @param abiOutputs the "outputs" object of the function's ABI.
     */
    makeOutputsValue: (pythonVariable: string, abiOutputs: DataItem[]) => {
        if (abiOutputs.length === 1) {
            return new Handlebars.SafeString(solValueToPyValue(pythonVariable, abiOutputs[0]));
        } else {
            let tupleValue = '(';
            for (let i = 0; i < abiOutputs.length; i++) {
                tupleValue += `${pythonVariable}[${i}],`;
            }
            tupleValue += ')';
            return new Handlebars.SafeString(tupleValue);
        }
    },
};

function solValueToPyValue(pythonVariable: string, abiItem: DataItem): string {
    const pythonTypeName = utils.solTypeToPyType(abiItem.type, abiItem.components);
    if (pythonTypeName.match(/List\[.*\]/) !== null) {
        return `[${solValueToPyValue('element', {
            ...abiItem,
            type: abiItem.type.replace('[]', ''),
        })} for element in ${pythonVariable}]`;
    } else {
        let pyValue = `${pythonTypeName}(`;
        if (abiItem.components) {
            let i = 0;
            for (const component of abiItem.components) {
                pyValue += `${component.name}=${pythonVariable}[${i}],`;
                i++;
            }
        } else {
            pyValue += pythonVariable;
        }
        pyValue += ')';
        return pyValue;
    }
}
