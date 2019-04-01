import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import { get } from 'lodash';
import 'mocha';

import * as artifacts from '../src/index';

chai.use(dirtyChai);

const expect = chai.expect;

describe('Contract Artifacts', () => {
    const forbiddenProperties = [
        'compilerOutput.evm.bytecode.sourceMap',
        'compilerOutput.evm.bytecode.opcodes',
        'sourceCodes',
        'sources',
        'compiler',
    ];
    it('should not include forbidden attributes', () => {
        const forbiddenPropertiesByArtifact: { [name: string]: string[] } = {};
        for (const [artifactName, artifact] of Object.entries(artifacts)) {
            for (const forbiddenProperty of forbiddenProperties) {
                const rejectedValue = get(artifact, forbiddenProperty);
                if (rejectedValue) {
                    const previousForbidden = forbiddenPropertiesByArtifact[artifactName];
                    forbiddenPropertiesByArtifact[artifactName] = previousForbidden
                        ? [...previousForbidden, forbiddenProperty]
                        : [forbiddenProperty];
                }
            }
        }
        expect(forbiddenPropertiesByArtifact).to.be.eq({});
    });
});
