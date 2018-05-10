import { ContractArtifact } from '@0xproject/sol-compiler';

import * as AccountLevels from '../artifacts/1.0.0/AccountLevels.json';
import * as Arbitrage from '../artifacts/1.0.0/Arbitrage.json';
import * as DummyToken from '../artifacts/1.0.0/DummyToken.json';
import * as EtherDelta from '../artifacts/1.0.0/EtherDelta.json';
import * as Exchange from '../artifacts/1.0.0/Exchange.json';
import * as MaliciousToken from '../artifacts/1.0.0/MaliciousToken.json';
import * as MultiSigWalletWithTimeLock from '../artifacts/1.0.0/MultiSigWalletWithTimeLock.json';
import * as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress from '../artifacts/1.0.0/MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.json';
import * as Token from '../artifacts/1.0.0/Token.json';
import * as TokenRegistry from '../artifacts/1.0.0/TokenRegistry.json';
import * as TokenTransferProxy from '../artifacts/1.0.0/TokenTransferProxy.json';
import * as EtherToken from '../artifacts/1.0.0/WETH9.json';
import * as ZRX from '../artifacts/1.0.0/ZRXToken.json';

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
