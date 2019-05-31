import * as fs from 'fs';
import * as path from 'path';

import * as artifacts from './index';

export const RequiredProperties: string[] = [
    'compilerOutput.evm.bytecode.object',
    'compilerOutput.evm.deployedBytecode.object',
    'compilerOutput.abi',
];

export const ForbiddenProperties: string[] = [
    'compilerOutput.evm.bytecode.sourceMap',
    'compilerOutput.evm.bytecode.opcodes',
    'compilerOutput.evm.deployedBytecode.sourceMap',
    'compilerOutput.evm.deployedBytecode.opcodes',
    'compilerOutput.evm.assembly',
    'compilerOutput.evm.legacyAssembly',
    'sourceCodes',
    'sources',
    'sourceTreeHashHex',
    'compiler',
];

function removeForbiddenProperties(): void {
    for (const [artifactName, artifact] of Object.entries(artifacts)) {
        for (const property of ForbiddenProperties) {
            const _artifact = artifact as { [name: string]: any };
            deleteNestedProperty(_artifact, property);

            const filePath = path.join(__dirname, `../../artifacts/${artifactName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(_artifact));
        }
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
    console.log(`Deleting forbidden properties from contract-artifacts. May need to run 'yarn prettier' after.`); // tslint:disable-line:no-console
    removeForbiddenProperties();
}
