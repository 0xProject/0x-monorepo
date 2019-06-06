import { logUtils } from '@0x/utils';
import * as fs from 'fs';

// xianny: hack, copied from contract-artifacts to avoid changing contract-artifacts exports
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

function removeForbiddenProperties(filePaths: string[]): void {
    for (const filePath of filePaths) {
        const artifact = JSON.parse(fs.readFileSync(filePath).toString()) as { [name: string]: any };
        for (const property of ForbiddenProperties) {
            deleteNestedProperty(artifact, property);
        }
        fs.writeFileSync(filePath, JSON.stringify(artifact));
    }
}

function deleteNestedProperty(obj: any, propPath: string): void {
    if (!obj || !propPath) {
        return;
    }

    const propPathParts = propPath.split('.');

    let _obj = obj;
    for (let i = 0; i < propPathParts.length - 1; i++) {
        _obj = _obj[propPathParts[i]];

        if (typeof _obj === 'undefined') {
            return;
        }
    }

    while (propPathParts.length > 0) {
        delete _obj[propPathParts.pop() as string];
    }
}

if (require.main === module) {
    const artifactsPath = process.argv[2];
    logUtils.log(`Deleting forbidden properties from artifacts in ${artifactsPath}.`);
    const artifactFiles = fs.readdirSync(artifactsPath)
        .filter(filename => filename.indexOf('.json') !== -1)
        .map(filename => `./${artifactsPath}/${filename}`);
    removeForbiddenProperties(artifactFiles);
}
