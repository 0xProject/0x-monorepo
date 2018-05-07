import { ContractArtifact } from '@0xproject/deployer';

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

export const artifacts = {
    ZRXArtifact: (ZRXArtifact as any) as ContractArtifact,
    DummyTokenArtifact: (DummyTokenArtifact as any) as ContractArtifact,
    TokenArtifact: (TokenArtifact as any) as ContractArtifact,
    ExchangeArtifact: (ExchangeArtifact as any) as ContractArtifact,
    EtherTokenArtifact: (EtherTokenArtifact as any) as ContractArtifact,
    TokenRegistryArtifact: (TokenRegistryArtifact as any) as ContractArtifact,
    MaliciousTokenArtifact: (MaliciousTokenArtifact as any) as ContractArtifact,
    TokenTransferProxyArtifact: (TokenTransferProxyArtifact as any) as ContractArtifact,
    MultiSigWalletWithTimeLockArtifact: (MultiSigWalletWithTimeLockArtifact as any) as ContractArtifact,
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact: (MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact as any) as ContractArtifact,
};
