import * as S from 'solidity-parser-antlr';
import { linearize, linearizeAsync } from './linearization'
import { flatMap } from './utils'

// See:  https://solidity.readthedocs.io/en/v0.4.25/contracts.html#inheritance

// Merge a base contract in a derived contract
function merge(
    base: S.ContractMember[],
    derived: S.ContractMember[]
): S.ContractMember[] {
    // Solidity method lookup is as if all functions are virtual. The most
    // derived version is always called. We can implement this by overriding
    // the base implementation.
    const functions: S.FunctionDefinition[] = Object.values(
        derived
        .filter(({type}) => type === S.NodeType.FunctionDefinition)
        .reduce(
            (a, func: S.FunctionDefinition) => ({...a, [func.name]: func}),
            base
            .filter(({type}) => type === S.NodeType.FunctionDefinition)
            .reduce(
                (a, func: S.FunctionDefinition) => ({...a, [func.name]: func}),
                {})));
    
    // TODO: Merge constructors
    // TODO: Implement rules that enforce type signature and visibility e.d.
    //       to be preserbed.
    // TODO: Check other objects than functions.
    // TODO: Sort members by type
    return [
        ...base.filter(({type}) => type !== S.NodeType.FunctionDefinition),
        ...derived.filter(({type}) => type !== S.NodeType.FunctionDefinition),
        ...functions
    ]
}

// Inline all inheritance for a contract
function flattenContract(
    contract: S.ContractDefinition,
    resolve: (name: string) => S.ContractDefinition
): S.ContractDefinition {
    
    // Close over resolve to create a parents function
    const parents = (contract: S.ContractDefinition)  =>
        contract.baseContracts.map(({baseName: {namePath}}) =>
            resolve(namePath));
    
    // Linearize the contract inheritance tree from least to most derived
    const linear = linearize(contract, parents);
    
    // TODO: Implement `super()` and `SomeBase.functionName(...)`.
    
    // Concatenate contract bodies
    return {
        ...contract,
        baseContracts: [],
        subNodes: linear.reduce((a, {subNodes}) => merge(a, subNodes), [])
    }
}

function sourceResolver(
    source: S.SourceUnit
): (string) => S.ContractDefinition {
    return function (name) {
        const result = source.children.find(x =>
            x.type === S.NodeType.ContractDefinition &&
            x.name === name);
        if (result === undefined) {
            throw new Error(`Could not resolve ${name}`);
        }
        return result;
    }
}

export function flattenSource(
    source: S.SourceUnit,
    contractName: string
): S.ContractDefinition {
    const resolver = sourceResolver(source);
    return flattenContract(resolver(contractName), resolver);
}

// Chase down import statements and produce a single source unit.
/*function flattenFile(
    contract: S.SourceUnit,
    resolver: (string) => S.SourceUnit
): S.SourceUnit {
    // TODO: symbolAliases
}
*/
