import * as chai from 'chai';
import { get } from 'lodash';
import 'mocha';

import * as artifacts from '../src/index';

import { ObjectMap } from '../../types/lib';
import { FORBIDDEN_PROPERTIES, REQUIRED_PROPERTIES } from '../src/transform';

const expect = chai.expect;

const CONTRACTS_WITH_PURE_FNS = [
    // 'Coordinator', // missing deployedBytecode
    'DevUtils',
    'ERC1155Proxy',
    'ERC20Proxy',
    'ERC721Proxy',
    'IAssetProxy',
    'MultiAssetProxy',
    'StaticCallProxy',
];

describe('Contract Artifacts', () => {
    it('should not include forbidden attributes', () => {
        const forbiddenPropertiesByArtifact: { [name: string]: string[] } = {};
        for (const [artifactName, artifact] of Object.entries(artifacts)) {
            for (const forbiddenProperty of FORBIDDEN_PROPERTIES) {
                const rejectedValue = get(artifact, forbiddenProperty);
                if (rejectedValue) {
                    const previousForbidden = forbiddenPropertiesByArtifact[artifactName];
                    forbiddenPropertiesByArtifact[artifactName] = previousForbidden
                        ? [...previousForbidden, forbiddenProperty]
                        : [forbiddenProperty];
                }
            }
        }
        expect(forbiddenPropertiesByArtifact).to.eql({});
    });
    it('should include all required attributes', () => {
        const missingRequiredPropertiesByArtifact: ObjectMap<string[]> = {};
        for (const [artifactName, artifact] of Object.entries(artifacts)) {
            for (const requiredProperty of REQUIRED_PROPERTIES) {
                // HACK (xianny): Remove after `compiler` field is added in v3.
                if (requiredProperty === 'compiler' && artifact.schemaVersion === '2.0.0') {
                    continue;
                }
                if (requiredProperty === 'compilerOutput.evm.deployedBytecode.object') {
                    if (!CONTRACTS_WITH_PURE_FNS.includes(artifactName)) {
                        continue;
                    }
                }
                const requiredValue = get(artifact, requiredProperty);
                if (requiredValue === undefined || requiredValue === '') {
                    const previousMissing = missingRequiredPropertiesByArtifact[artifactName];
                    missingRequiredPropertiesByArtifact[artifactName] = previousMissing
                        ? [...previousMissing, requiredProperty]
                        : [requiredProperty];
                }
            }
        }
        expect(missingRequiredPropertiesByArtifact).to.eql({});
    });
});
