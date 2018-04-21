import * as DummyERC20TokenArtifact from '../artifacts/DummyERC20Token.json';
import * as ExchangeArtifact from '../artifacts/Exchange.json';
import * as MultiSigWalletWithTimeLockArtifact from '../artifacts/MultiSigWalletWithTimeLock.json';
import * as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact from '../artifacts/MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.json';
import * as TokenRegistryArtifact from '../artifacts/TokenRegistry.json';
import * as EtherTokenArtifact from '../artifacts/WETH9.json';
import * as ZRXArtifact from '../artifacts/ZRXToken.json';

import { Artifact } from './types';

export const artifacts = {
    ZRXArtifact: (ZRXArtifact as any) as Artifact,
    DummyERC20TokenArtifact: (DummyERC20TokenArtifact as any) as Artifact,
    ExchangeArtifact: (ExchangeArtifact as any) as Artifact,
    EtherTokenArtifact: (EtherTokenArtifact as any) as Artifact,
    TokenRegistryArtifact: (TokenRegistryArtifact as any) as Artifact,
    MultiSigWalletWithTimeLockArtifact: (MultiSigWalletWithTimeLockArtifact as any) as Artifact,
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact: (MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressArtifact as any) as Artifact,
};
