import { ContractArtifact } from 'ethereum-types';

import * as LibAbiEncoder from '../../generated-artifacts/LibAbiEncoder.json';
import * as LibEIP721 from '../../generated-artifacts/LibEIP712.json';
import * as LibFillResults from '../../generated-artifacts/LibFillResults.json';
import * as LibMath from '../../generated-artifacts/LibMath.json';
import * as LibOrder from '../../generated-artifacts/LibOrder.json';
import * as TestLibs from '../../generated-artifacts/TestLibs.json';

export const artifacts = {
    TestLibs: TestLibs as ContractArtifact,
    LibAbiEncoder: LibAbiEncoder as ContractArtifact,
    LibFillResults: LibFillResults as ContractArtifact,
    LibMath: LibMath as ContractArtifact,
    LibOrder: LibOrder as ContractArtifact,
    LibEIP721: LibEIP721 as ContractArtifact,
};
