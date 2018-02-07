import * as DummyTokenArtifact from '../src/artifacts/DummyToken.json';
import * as ExchangeArtifact from '../src/artifacts/Exchange.json';
import * as MaliciousTokenArtifact from '../src/artifacts/MaliciousToken.json';
import * as MultiSigWalletWithTimeLockArtifact from '../src/artifacts/MultiSigWalletWithTimeLock.json';
import * as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact from '../src/artifacts/MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.json';
import * as TokenArtifact from '../src/artifacts/Token.json';
import * as TokenRegistryArtifact from '../src/artifacts/TokenRegistry.json';
import * as TokenTransferProxyArtifact from '../src/artifacts/TokenTransferProxy.json';
import * as EtherTokenArtifact from '../src/artifacts/WETH9.json';
import * as ZRXArtifact from '../src/artifacts/ZRXToken.json';

import { Artifact } from './types';

export const artifacts = {
    ZRXArtifact: (ZRXArtifact as any) as Artifact,
    DummyTokenArtifact: (DummyTokenArtifact as any) as Artifact,
    TokenArtifact: (TokenArtifact as any) as Artifact,
    ExchangeArtifact: (ExchangeArtifact as any) as Artifact,
    EtherTokenArtifact: (EtherTokenArtifact as any) as Artifact,
    TokenRegistryArtifact: (TokenRegistryArtifact as any) as Artifact,
    MaliciousTokenArtifact: (MaliciousTokenArtifact as any) as Artifact,
    TokenTransferProxyArtifact: (TokenTransferProxyArtifact as any) as Artifact,
    MultiSigWalletWithTimeLockArtifact: (MultiSigWalletWithTimeLockArtifact as any) as Artifact,
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact: (MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact as any) as Artifact,
};
