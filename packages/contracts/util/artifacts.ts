import * as DummyToken from '../src/artifacts/DummyToken.json';
import * as Exchange from '../src/artifacts/Exchange.json';
import * as MaliciousToken from '../src/artifacts/MaliciousToken.json';
import * as MultiSigWalletWithTimeLock from '../src/artifacts/MultiSigWalletWithTimeLock.json';
import * as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress from '../src/artifacts/MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.json';
import * as Token from '../src/artifacts/Token.json';
import * as TokenRegistry from '../src/artifacts/TokenRegistry.json';
import * as TokenTransferProxy from '../src/artifacts/TokenTransferProxy.json';
import * as EtherToken from '../src/artifacts/WETH9.json';
import * as ZRX from '../src/artifacts/ZRXToken.json';

import { Artifact } from './types';

export const artifacts = {
    ZRX: (ZRX as any) as Artifact,
    DummyToken: (DummyToken as any) as Artifact,
    Token: (Token as any) as Artifact,
    Exchange: (Exchange as any) as Artifact,
    EtherToken: (EtherToken as any) as Artifact,
    TokenRegistry: (TokenRegistry as any) as Artifact,
    MaliciousToken: (MaliciousToken as any) as Artifact,
    TokenTransferProxy: (TokenTransferProxy as any) as Artifact,
    MultiSigWalletWithTimeLock: (MultiSigWalletWithTimeLock as any) as Artifact,
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress: (MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress as any) as Artifact,
};
