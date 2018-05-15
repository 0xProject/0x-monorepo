import { Artifact } from '@0xproject/types';

import * as DummyToken from './compact_artifacts/DummyToken.json';
import * as EtherToken from './compact_artifacts/EtherToken.json';
import * as Exchange from './compact_artifacts/Exchange.json';
import * as Token from './compact_artifacts/Token.json';
import * as TokenRegistry from './compact_artifacts/TokenRegistry.json';
import * as TokenTransferProxy from './compact_artifacts/TokenTransferProxy.json';
import * as ZRX from './compact_artifacts/ZRX.json';
export const artifacts = {
    ZRX: (ZRX as any) as Artifact,
    DummyToken: (DummyToken as any) as Artifact,
    Token: (Token as any) as Artifact,
    Exchange: (Exchange as any) as Artifact,
    EtherToken: (EtherToken as any) as Artifact,
    TokenRegistry: (TokenRegistry as any) as Artifact,
    TokenTransferProxy: (TokenTransferProxy as any) as Artifact,
};
