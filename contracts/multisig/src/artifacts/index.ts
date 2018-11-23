import { ContractArtifact } from 'ethereum-types';

import * as MultiSigWallet from '../../generated-artifacts/MultiSigWallet.json';
import * as MultiSigWalletWithTimeLock from '../../generated-artifacts/MultiSigWalletWithTimeLock.json';
import * as TestRejectEther from '../../generated-artifacts/TestRejectEther.json';

export const artifacts = {
    TestRejectEther: TestRejectEther as ContractArtifact,
    MultiSigWallet: MultiSigWallet as ContractArtifact,
    MultiSigWalletWithTimeLock: MultiSigWalletWithTimeLock as ContractArtifact,
};
