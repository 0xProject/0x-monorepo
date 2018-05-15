import { BaseContract } from '@0xproject/base-contract';
import { ContractArtifact } from '@0xproject/sol-compiler';
import * as fs from 'fs';
import * as path from 'path';

export class ArtifactWriter {
    private _artifactsDir: string;
    private _networkId: number;
    constructor(artifactsDir: string, networkId: number) {
        this._artifactsDir = artifactsDir;
        this._networkId = networkId;
    }
    // This updates the artifact file but does not update the `artifacts` module above. It will not
    // contain the saved artifact changes.
    public saveArtifact(contract: BaseContract): void {
        const contractName = contract.contractName;
        const artifactFile = path.join(this._artifactsDir, `${contractName}.json`);
        const artifact: ContractArtifact = JSON.parse(fs.readFileSync(artifactFile).toString());
        artifact.networks[this._networkId] = {
            address: contract.address,
            links: {},
            constructorArgs: JSON.stringify(contract.constructorArgs),
        };
        fs.writeFileSync(artifactFile, JSON.stringify(artifact, null, '\t'));
    }
}
