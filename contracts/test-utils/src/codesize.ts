import { ContractArtifact } from 'ethereum-types';

/**
 * Get the codesize of a provided artifact.
 */
export function getCodesizeFromArtifact(artifact: ContractArtifact): number {
    return (artifact.compilerOutput.evm.bytecode.object.length - 2) / 2;
}
