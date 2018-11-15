import * as S from 'solidity-parser-antlr';

import { linearize, linearizeAsync } from './linearization';
import * as utils from './utils';

// See:  https://solidity.readthedocs.io/en/v0.4.25/contracts.html#inheritance

// Merge a base contract into a derived contract
function merge(base: S.ContractMember[], derived: S.ContractMember[]): S.ContractMember[] {
    // Extracts functions by name from contract members
    const functions = (contract: S.ContractMember[]): { [name: string]: S.FunctionDefinition } =>
        (contract.filter(
            node => node.type === S.NodeType.FunctionDefinition && !node.isConstructor,
        ) as S.FunctionDefinition[]).reduce(
            (a, func: S.FunctionDefinition) => ({ ...a, [func.name as string]: func }),
            {},
        );

    const modifiers = (contract: S.ContractMember[]): { [name: string]: S.FunctionDefinition } =>
        (contract.filter(({ type }) => type === S.NodeType.ModifierDefinition) as S.ModifierDefinition[]).reduce(
            (a, mod: S.ModifierDefinition) => ({ ...a, [mod.name]: mod }),
            {},
        );

    const others = (contract: S.ContractMember[]): S.ContractMember[] =>
        contract.filter(({ type }) => type !== S.NodeType.ModifierDefinition && type !== S.NodeType.FunctionDefinition);

    // Solidity method lookup is as if all functions are virtual. The most
    // derived version is always called. We can implement this by overriding
    // the base implementation.
    const mergedFunctions = {
        ...functions(base),
        ...functions(derived),
    };

    // The same applies to modifiers
    const mergedModifiers = {
        ...modifiers(base),
        ...modifiers(derived),
    };

    // TODO: Merge constructors
    // TODO: Implement rules that enforce type signature and visibility etc.
    //       to be preserved when overriding.
    // TODO: Check other objects than functions.
    // TODO: Sort members by type
    // TODO: Less derived functions remain available through `super`
    //       and `SomeBase.functionName(...)`.
    return [...others(base), ...others(derived), ...Object.values(mergedModifiers), ...Object.values(mergedFunctions)];
}

// Inline the inheritance hierarchy of a contract
export function flattenContract(
    contract: S.ContractDefinition,
    resolve: (name: string) => S.ContractDefinition,
): [S.ContractDefinition, S.ContractDefinition[]] {
    // Close over resolve to create a parents function
    const parents = (child: S.ContractDefinition) =>
        child.baseContracts.map(({ baseName: { namePath } }) => resolve(namePath));

    // Linearize the contract inheritance tree from least to most derived
    const linear = linearize(contract, parents);

    // Merge contract members according to linearization
    const members: S.ContractMember[] = linear.reduce((a: S.ContractMember[], { subNodes }) => merge(a, subNodes), []);

    // Concatenate contract bodies
    return [
        {
            ...contract,
            baseContracts: [],

            subNodes: members,
        },
        linear,
    ];
}
