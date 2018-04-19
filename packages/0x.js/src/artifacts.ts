import * as DummyTokenArtifact from './compact_artifacts/DummyToken.json';
import * as EtherTokenArtifact from './compact_artifacts/EtherToken.json';
import * as ExchangeArtifact from './compact_artifacts/Exchange.json';
import * as TokenArtifact from './compact_artifacts/Token.json';
import * as TokenRegistryArtifact from './compact_artifacts/TokenRegistry.json';
import * as TokenTransferProxyArtifact from './compact_artifacts/TokenTransferProxy.json';
import * as ZRXArtifact from './compact_artifacts/ZRX.json';
import { Artifact } from './types';

export const artifacts = {
    ZRXArtifact: (ZRXArtifact as any) as Artifact,
    DummyTokenArtifact: (DummyTokenArtifact as any) as Artifact,
    TokenArtifact: (TokenArtifact as any) as Artifact,
    ExchangeArtifact: (ExchangeArtifact as any) as Artifact,
    EtherTokenArtifact: (EtherTokenArtifact as any) as Artifact,
    TokenRegistryArtifact: (TokenRegistryArtifact as any) as Artifact,
    TokenTransferProxyArtifact: (TokenTransferProxyArtifact as any) as Artifact,
};
