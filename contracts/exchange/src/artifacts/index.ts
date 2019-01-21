import { ContractArtifact } from 'ethereum-types';

import * as Exchange from '../../generated-artifacts/Exchange.json';
import * as TestAssetProxyDispatcher from '../../generated-artifacts/TestAssetProxyDispatcher.json';
import * as TestExchangeInternals from '../../generated-artifacts/TestExchangeInternals.json';
import * as TestSignatureValidator from '../../generated-artifacts/TestSignatureValidator.json';
import * as TestStaticCallReceiver from '../../generated-artifacts/TestStaticCallReceiver.json';

export const artifacts = {
    Exchange: Exchange as ContractArtifact,
    TestAssetProxyDispatcher: TestAssetProxyDispatcher as ContractArtifact,
    TestExchangeInternals: TestExchangeInternals as ContractArtifact,
    TestSignatureValidator: TestSignatureValidator as ContractArtifact,
    TestStaticCallReceiver: TestStaticCallReceiver as ContractArtifact,
};
