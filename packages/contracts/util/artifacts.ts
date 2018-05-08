import { ContractArtifact } from '@0xproject/sol-compiler';

import * as AccountLevels from '../src/artifacts/AccountLevels.json';
import * as Arbitrage from '../src/artifacts/Arbitrage.json';
import * as DummyToken from '../src/artifacts/DummyToken.json';
import * as EtherDelta from '../src/artifacts/EtherDelta.json';
import * as Exchange from '../src/artifacts/Exchange.json';
import * as MaliciousToken from '../src/artifacts/MaliciousToken.json';
import * as MultiSigWalletWithTimeLock from '../src/artifacts/MultiSigWalletWithTimeLock.json';
import * as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress from '../src/artifacts/MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.json';
import * as Token from '../src/artifacts/Token.json';
import * as TokenRegistry from '../src/artifacts/TokenRegistry.json';
import * as TokenTransferProxy from '../src/artifacts/TokenTransferProxy.json';
import * as EtherToken from '../src/artifacts/WETH9.json';
import * as ZRX from '../src/artifacts/ZRXToken.json';

export const artifacts = {
    AccountLevels: (AccountLevels as any) as ContractArtifact,
    Arbitrage: (Arbitrage as any) as ContractArtifact,
    EtherDelta: (EtherDelta as any) as ContractArtifact,
    ZRX: (ZRX as any) as ContractArtifact,
    DummyToken: (DummyToken as any) as ContractArtifact,
    Token: (Token as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    EtherToken: (EtherToken as any) as ContractArtifact,
    TokenRegistry: (TokenRegistry as any) as ContractArtifact,
    MaliciousToken: (MaliciousToken as any) as ContractArtifact,
    TokenTransferProxy: (TokenTransferProxy as any) as ContractArtifact,
    MultiSigWalletWithTimeLock: (MultiSigWalletWithTimeLock as any) as ContractArtifact,
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress: (MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress as any) as ContractArtifact,
};
