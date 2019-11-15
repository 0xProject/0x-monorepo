import * as changeCase from 'change-case';
import * as cliFormat from 'cli-format';
import * as Handlebars from 'handlebars';
import toposort = require('toposort');

import { AbiDefinition, DataItem, MethodAbi } from 'ethereum-types';

import { utils } from './utils';

/**
 * Register all Python-related Handlebars helpers
 */
export function registerPythonHelpers(): void {
    Handlebars.registerHelper('equal', (lhs: any, rhs: any) => {
        return lhs === rhs;
    });
    Handlebars.registerHelper('safeString', (str: string) => new Handlebars.SafeString(str));
    Handlebars.registerHelper('parameterType', utils.solTypeToPyType.bind(utils));
    Handlebars.registerHelper('returnType', utils.solTypeToPyType.bind(utils));
    Handlebars.registerHelper('toPythonIdentifier', utils.toPythonIdentifier.bind(utils));
    Handlebars.registerHelper('sanitizeDevdocDetails', (_methodName: string, devdocDetails: string, indent: number) => {
        // wrap to 80 columns, assuming given indent, so that generated
        // docstrings can pass pycodestyle checks.  also, replace repeated
        // spaces, likely caused by leading indents in the Solidity, because
        // they cause repeated spaces in the output, and in particular they may
        // cause repeated spaces at the beginning of a line in the docstring,
        // which leads to "unexpected indent" errors when generating
        // documentation.
        if (devdocDetails === undefined || devdocDetails.length === 0) {
            return '';
        }
        const columnsPerRow = 80;
        return new Handlebars.SafeString(
            `\n${cliFormat.wrap(devdocDetails.replace(/  +/g, ' ') || '', {
                paddingLeft: ' '.repeat(indent),
                width: columnsPerRow,
                ansi: false,
            })}\n`,
        );
    });
    Handlebars.registerHelper('makeParameterDocstringRole', (name: string, description: string, indent: number) => {
        let docstring = `:param ${name}:`;
        if (description && description.length > 0) {
            docstring = `${docstring} ${description}`;
        }
        return new Handlebars.SafeString(utils.wrapPythonDocstringRole(docstring, indent));
    });
    Handlebars.registerHelper(
        'makeReturnDocstringRole',
        (description: string, indent: number) =>
            new Handlebars.SafeString(
                utils.wrapPythonDocstringRole(`:returns: ${description.replace(/  +/g, ' ')}`, indent),
            ),
    );
    Handlebars.registerHelper(
        'makeEventParameterDocstringRole',
        (eventName: string, indent: number) =>
            new Handlebars.SafeString(
                utils.wrapPythonDocstringRole(
                    `:param tx_hash: hash of transaction emitting ${eventName} event`,
                    indent,
                ),
            ),
    );
    Handlebars.registerHelper('tupleDefinitions', (abisJSON: string) => {
        const abis: AbiDefinition[] = JSON.parse(abisJSON);
        // build an array of objects, each of which has one key, the Python
        // name of a tuple, with a string value holding the body of a Python
        // class representing that tuple. Using a key-value object conveniently
        // filters duplicate references to the same tuple.
        const tupleBodies: { [pythonTupleName: string]: string } = {};
        // build an array of tuple dependencies, whose format conforms to the
        // expected input to toposort, a function to do a topological sort,
        // which will help us declare tuples in the proper order, avoiding
        // references to tuples that haven't been declared yet.
        const tupleDependencies: Array<[string, string]> = [];
        for (const abi of abis) {
            let parameters: DataItem[] = [];
            if (abi.hasOwnProperty('inputs')) {
                // HACK(feuGeneA): using "as MethodAbi" below, but abi
                // could just as well be ConstructorAbi, EventAbi, etc.  We
                // just need to tell the TypeScript compiler that it's NOT
                // FallbackAbi, or else it would complain, "Property
                // 'inputs' does not exist on type 'AbiDefinition'.
                // Property 'inputs' does not exist on type
                // 'FallbackAbi'.", despite the enclosing if statement.
                // tslint:disable:no-unnecessary-type-assertion
                parameters = parameters.concat((abi as MethodAbi).inputs);
            }
            if (abi.hasOwnProperty('outputs')) {
                // HACK(feuGeneA): same as described above, except here we
                // KNOW that it's a MethodAbi, given the enclosing if
                // statement, because that's the only AbiDefinition subtype
                // that actually has an outputs field.
                parameters = parameters.concat((abi as MethodAbi).outputs);
            }
            for (const parameter of parameters) {
                utils.extractTuples(parameter, tupleBodies, tupleDependencies);
            }
        }
        // build up a list of tuples to declare. the order they're pushed into
        // this array is the order they will be declared.
        const tuplesToDeclare = [];
        // first push the ones that have dependencies
        tuplesToDeclare.push(...toposort(tupleDependencies));
        // then push any remaining bodies (the ones that DON'T have
        // dependencies)
        for (const pythonTupleName in tupleBodies) {
            if (!tuplesToDeclare.includes(pythonTupleName)) {
                tuplesToDeclare.push(pythonTupleName);
            }
        }
        // now iterate over those ordered tuples-to-declare, and prefix the
        // corresponding class bodies with their class headers, to form full
        // class declarations.
        const tupleDeclarations = [];
        for (const pythonTupleName of tuplesToDeclare) {
            if (tupleBodies[pythonTupleName]) {
                tupleDeclarations.push(
                    `class ${pythonTupleName}(TypedDict):\n    """Python representation of a tuple or struct.\n\n    Solidity compiler output does not include the names of structs that appear\n    in method definitions.  A tuple found in an ABI may have been written in\n    Solidity as a literal, anonymous tuple, or it may have been written as a\n    named \`struct\`:code:, but there is no way to tell from the compiler\n    output.  This class represents a tuple that appeared in a method\n    definition.  Its name is derived from a hash of that tuple's field names,\n    and every method whose ABI refers to a tuple with that same list of field\n    names will have a generated wrapper method that refers to this class.\n\n    Any members of type \`bytes\`:code: should be encoded as UTF-8, which can be\n    accomplished via \`str.encode("utf_8")\`:code:\n    """${
                        tupleBodies[pythonTupleName]
                    }`,
                );
            }
        }
        // finally, join the class declarations together for the output file
        return new Handlebars.SafeString(tupleDeclarations.join('\n\n\n'));
    });
    Handlebars.registerHelper('docBytesIfNecessary', (abisJSON: string) => {
        const abis: AbiDefinition[] = JSON.parse(abisJSON);
        // see if any ABIs accept params of type bytes, and if so then emit
        // explanatory documentation string.
        for (const abi of abis) {
            if (abi.hasOwnProperty('inputs')) {
                // HACK(feuGeneA): using "as MethodAbi" below, but abi
                // could just as well be ConstructorAbi, EventAbi, etc.  We
                // just need to tell the TypeScript compiler that it's NOT
                // FallbackAbi, or else it would complain, "Property
                // 'inputs' does not exist on type 'AbiDefinition'.
                // Property 'inputs' does not exist on type
                // 'FallbackAbi'.", despite the enclosing if statement.
                // tslint:disable:no-unnecessary-type-assertion
                if ((abi as MethodAbi).inputs) {
                    for (const input of (abi as MethodAbi).inputs) {
                        if (input.type === 'bytes') {
                            return new Handlebars.SafeString(
                                '\n\n    All method parameters of type `bytes`:code: should be encoded as UTF-8,\n    which can be accomplished via `str.encode("utf_8")`:code:.\n    ',
                            );
                        }
                    }
                }
            }
        }
        return '';
    });
    Handlebars.registerHelper(
        'toPythonClassname',
        (sourceName: string) => new Handlebars.SafeString(changeCase.pascal(sourceName)),
    );
    Handlebars.registerHelper(
        'makeOutputsValue',
        /**
         * Produces a Python expression representing the return value from a
         * Solidity function.
         * @param pythonVariable the name of the Python variable holding the value
         *     to be used to populate the output expression.
         * @param abiOutputs the "outputs" object of the function's ABI.
         */
        (pythonVariable: string, abiOutputs: DataItem[]) => {
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
    );
}

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
