export const RequiredProperties: string[] = [
    'schemaVersion',
    'contractName',
    'compilerOutput.evm.bytecode.object',
    'compilerOutput.abi',
];

export const ForbiddenProperties: string[] = [
    'compilerOutput.evm.bytecode.sourceMap',
    'compilerOutput.evm.bytecode.opcodes',
    'compilerOutput.evm.bytecode.linkReferences',
    'compilerOutput.evm.deployedBytecode',
    'compilerOutput.evm.assembly',
    'compilerOutput.evm.legacyAssembly',
    'compilerOutput.evm.gasEstimates',
    'compilerOutput.evm.methodIdentifiers',
    'compilerOutput.metadata',
    'compilerOutput.userdoc',
    'sourceCodes',
    'sources',
    'sourceTreeHashHex',
    'compiler',
];
