import {Artifact} from './types';
import * as TokenArtifact from './artifacts/Token.json';
import * as ExchangeArtifact from './artifacts/Exchange.json';
import * as EtherTokenArtifact from './artifacts/EtherToken.json';
import * as TokenRegistryArtifact from './artifacts/TokenRegistry.json';
import * as TokenTransferProxyArtifact from './artifacts/TokenTransferProxy.json';

export const artifacts = {
    TokenArtifact: TokenArtifact as any as Artifact,
    ExchangeArtifact: ExchangeArtifact as any as Artifact,
    EtherTokenArtifact: EtherTokenArtifact as any as Artifact,
    TokenRegistryArtifact: TokenRegistryArtifact as any as Artifact,
    TokenTransferProxyArtifact: TokenTransferProxyArtifact as any as Artifact,
};
