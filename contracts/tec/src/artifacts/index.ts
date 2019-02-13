import { ContractArtifact } from 'ethereum-types';

import * as TEC from '../../generated-artifacts/TEC.json';
import * as TestInternals from '../../generated-artifacts/TestInternals.json';
import * as TestLibs from '../../generated-artifacts/TestLibs.json';

export const artifacts = {
    TEC: TEC as ContractArtifact,
    TestLibs: TestLibs as ContractArtifact,
    TestInternals: TestInternals as ContractArtifact,
};
