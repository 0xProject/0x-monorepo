import { Artifact } from '@0xproject/types';

import * as DummyToken from './compact_artifacts/DummyToken.json';
import * as Exchange from './compact_artifacts/Exchange.json';
import * as Token from './compact_artifacts/Token.json';
import * as TokenTransferProxy from './compact_artifacts/TokenTransferProxy.json';

export const artifacts = {
    DummyToken: (DummyToken as any) as Artifact,
    Token: (Token as any) as Artifact,
    TokenTransferProxy: (TokenTransferProxy as any) as Artifact,
    Exchange: (Exchange as any) as Artifact,
};
