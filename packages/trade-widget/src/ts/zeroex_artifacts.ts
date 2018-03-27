/* tslint:disable */
import { Artifact } from './types';

const ZRXArtifact = require('./artifacts/ZRXToken.json');
const EtherTokenArtifact = require('./artifacts/WETH9.json');
const TokenArtifact = require('./artifacts/Token.json');
const ExchangeArtifact = require('./artifacts/Exchange.json');
const TokenTransferProxyArtifact = require('./artifacts/TokenTransferProxy.json');

export const zeroExArtifacts = {
    ZRXArtifact: (ZRXArtifact as any) as Artifact,
    TokenArtifact: (TokenArtifact as any) as Artifact,
    ExchangeArtifact: (ExchangeArtifact as any) as Artifact,
    TokenTransferProxy: (TokenTransferProxyArtifact as any) as Artifact,
    EtherTokenArtifact: (EtherTokenArtifact as any) as Artifact,
};
