import * as _ from 'lodash';
import * as S from 'solidity-parser-antlr';

import { linearize } from './linearization';

// See:  https://solidity.readthedocs.io/en/v0.4.25/contracts.html#inheritance

// Merge a base contract into a derived contract
function merge(base: S.ContractMember[], derived: S.ContractMember[]): S.ContractMember[] {
    // Extracts functions by name from contract members
    const functions = (contract: S.ContractMember[]) =>
        (contract.filter(
            node => node.type === S.NodeType.FunctionDefinition && !node.isConstructor,
        ) as S.FunctionDefinition[]).reduce<{ [name: string]: S.FunctionDefinition }>(
            (a, func: S.FunctionDefinition) => ({ ...a, [func.name as string]: func }),
            {},
        );

    const modifiers = (contract: S.ContractMember[]) =>
        (contract.filter(({ type }) => type === S.NodeType.ModifierDefinition) as S.ModifierDefinition[]).reduce<{
            [name: string]: S.ModifierDefinition;
        }>((a, mod: S.ModifierDefinition) => ({ ...a, [mod.name]: mod }), {});

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

    // TODO(recmo): Merge constructors
    // TODO(recmo): Implement rules that enforce type signature and visibility etc.
    //       to be preserved when overriding.
    // TODO(recmo): Check other objects than functions.
    // TODO(recmo): Sort members by type
    // TODO(recmo): Less derived functions remain available through `super`
    //       and `SomeBase.functionName(...)`.
    return [...others(base), ...others(derived), ...Object.values(mergedModifiers), ...Object.values(mergedFunctions)];
}

/**
 * Inline the inheritance hierarchy of a contract
 * @param contract Contract to flatten
 * @param resolve Function to lookup contract definition by name
 */
export function flattenContract(
    contract: S.ContractDefinition,
    resolve: (name: string) => S.ContractDefinition,
): [S.ContractDefinition, S.ContractDefinition[]] {
    // Close over resolve to create a parents function
    const parents = (child: S.ContractDefinition) =>
        _.map(child.baseContracts, ({ baseName: { namePath } }) => resolve(namePath));

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
