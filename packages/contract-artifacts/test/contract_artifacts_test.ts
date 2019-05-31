import * as chai from 'chai';
import { get } from 'lodash';
import 'mocha';

import * as artifacts from '../src/index';

import { ForbiddenProperties, RequiredProperties } from '../src/lint_properties';

const expect = chai.expect;

describe('Contract Artifacts', () => {
    it('should not include forbidden attributes', () => {
        const forbiddenPropertiesByArtifact: { [name: string]: string[] } = {};
        for (const [artifactName, artifact] of Object.entries(artifacts)) {
            for (const forbiddenProperty of ForbiddenProperties) {
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
        const missingRequiredPropertiesByArtifact: { [name: string]: string[] } = {};
        for (const [artifactName, artifact] of Object.entries(artifacts)) {
            for (const requiredProperty of RequiredProperties) {
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
