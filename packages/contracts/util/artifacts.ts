import * as DummyTokenArtifact from '../build/artifacts/DummyToken.json';
import * as DummyTokenV2Artifact from '../build/artifacts/DummyToken_v2.json';
import * as ExchangeArtifact from '../build/artifacts/Exchange.json';
import * as MaliciousTokenArtifact from '../build/artifacts/MaliciousToken.json';
import * as MultiSigWalletWithTimeLockArtifact from '../build/artifacts/MultiSigWalletWithTimeLock.json';
import * as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact from '../build/artifacts/MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.json';
import * as TokenArtifact from '../build/artifacts/Token.json';
import * as TokenRegistryArtifact from '../build/artifacts/TokenRegistry.json';
import * as TokenTransferProxyArtifact from '../build/artifacts/TokenTransferProxy.json';
import * as EtherTokenArtifact from '../build/artifacts/WETH9.json';
import * as ZRXArtifact from '../build/artifacts/ZRXToken.json';

import { Artifact } from './types';

export const artifacts = {
    ZRXArtifact: (ZRXArtifact as any) as Artifact,
    DummyTokenArtifact: (DummyTokenArtifact as any) as Artifact,
    DummyTokenV2Artifact: (DummyTokenV2Artifact as any) as Artifact,
    TokenArtifact: (TokenArtifact as any) as Artifact,
    ExchangeArtifact: (ExchangeArtifact as any) as Artifact,
    EtherTokenArtifact: (EtherTokenArtifact as any) as Artifact,
    TokenRegistryArtifact: (TokenRegistryArtifact as any) as Artifact,
    MaliciousTokenArtifact: (MaliciousTokenArtifact as any) as Artifact,
    TokenTransferProxyArtifact: (TokenTransferProxyArtifact as any) as Artifact,
    MultiSigWalletWithTimeLockArtifact: (MultiSigWalletWithTimeLockArtifact as any) as Artifact,
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact: (MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact as any) as Artifact,
};
