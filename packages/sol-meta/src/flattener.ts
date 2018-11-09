import * as S from 'solidity-parser-antlr';

import { linearize, linearizeAsync } from './linearization';
import { flatMap } from './utils';

// See:  https://solidity.readthedocs.io/en/v0.4.25/contracts.html#inheritance

// Merge a base contract into a derived contract
function merge(
    base: S.ContractMember[],
    derived: S.ContractMember[],
): S.ContractMember[] {
    // Extracts functions by name from contract members
    const functions = (contract: S.ContractMember[]): { [name: string]: S.FunctionDefinition } =>
        (contract
            .filter(({ type }) => type === S.NodeType.FunctionDefinition) as S.FunctionDefinition[])
            .reduce((a, func: S.FunctionDefinition) => ({ ...a, [func.name]: func }), {});

    // Solidity method lookup is as if all functions are virtual. The most
    // derived version is always called. We can implement this by overriding
    // the base implementation.
    const mergedFunctions = {
        ...functions(base),
        ...functions(derived),
    };

    // TODO: Merge constructors
    // TODO: Implement rules that enforce type signature and visibility etc.
    //       to be preserved when overriding.
    // TODO: Check other objects than functions.
    // TODO: Sort members by type
    // TODO: Less derived functions remain available through `super`
    //       and `SomeBase.functionName(...)`.
    return [
        ...base.filter(({ type }) => type !== S.NodeType.FunctionDefinition),
        ...derived.filter(({ type }) => type !== S.NodeType.FunctionDefinition),
        ...Object.values(mergedFunctions),
    ];
}

// Inline all inheritance for a contract
function flattenContract(
    contract: S.ContractDefinition,
    resolve: (name: string) => S.ContractDefinition,
): S.ContractDefinition {

    // Close over resolve to create a parents function
    const parents = (child: S.ContractDefinition) =>
        child.baseContracts.map(({ baseName: { namePath } }) =>
            resolve(namePath));

    // Linearize the contract inheritance tree from least to most derived
    const linear = linearize(contract, parents);

    // Merge contract members according to linearization
    const members: S.ContractMember[] = linear.reduce(
        (a: S.ContractMember[], { subNodes }) => merge(a, subNodes), []);

    // Concatenate contract bodies
    return {
        ...contract,
        baseContracts: [],

        subNodes: members,
    };
}

function sourceResolver(
    source: S.SourceUnit,
): ((name: string) => S.ContractDefinition) {
    return (name: string): S.ContractDefinition => {
        const result = source.children.find(x =>
            x.type === S.NodeType.ContractDefinition &&
            x.name === name);
        if (result === undefined) {
            throw new Error(`Could not resolve ${name}`);
        }
        return result;
    };
}

export function flattenSource(
    source: S.SourceUnit,
    contractName: string,
): S.ContractDefinition {
    const resolver = sourceResolver(source);
    return flattenContract(resolver(contractName), resolver);
}

// Chase down import statements and produce a single source unit.
// NOTE: Does not support `import as` statements
function flattenFile(
    contract: S.SourceUnit,
    resolver: (name: string) => S.SourceUnit,
): S.SourceUnit {
    // TODO: symbolAliases

    return contract; // TODO
}
