import { ContractArtifact } from 'ethereum-types';

import * as TEC from '../../generated-artifacts/TEC.json';
import * as TestLibs from '../../generated-artifacts/TestLibs.json';

export const artifacts = {
    TEC: TEC as ContractArtifact,
    TestLibs: TestLibs as ContractArtifact,
};
