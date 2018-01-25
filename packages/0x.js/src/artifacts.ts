import * as DummyTokenArtifact from './artifacts/DummyToken.json';
import * as EtherTokenArtifact from './artifacts/EtherToken.json';
import * as ExchangeArtifact from './artifacts/Exchange.json';
import * as TokenArtifact from './artifacts/Token.json';
import * as TokenRegistryArtifact from './artifacts/TokenRegistry.json';
import * as TokenTransferProxyArtifact from './artifacts/TokenTransferProxy.json';
import * as ZRXArtifact from './artifacts/ZRX.json';
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
