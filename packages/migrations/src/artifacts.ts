import { ContractArtifact } from '@0xproject/sol-compiler';

import * as DummyERC20Token from '../artifacts/1.0.0/DummyERC20Token.json';
import * as Exchange from '../artifacts/1.0.0/Exchange_v1.json';
import * as MultiSigWalletWithTimeLock from '../artifacts/1.0.0/MultiSigWalletWithTimeLock.json';
import * as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress from '../artifacts/1.0.0/MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.json';
import * as TokenRegistry from '../artifacts/1.0.0/TokenRegistry.json';
import * as TokenTransferProxy from '../artifacts/1.0.0/TokenTransferProxy_v1.json';
import * as EtherToken from '../artifacts/1.0.0/WETH9.json';
import * as ZRX from '../artifacts/1.0.0/ZRXToken.json';

export const artifacts = {
    ZRX: (ZRX as any) as ContractArtifact,
    DummyERC20Token: (DummyERC20Token as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    EtherToken: (EtherToken as any) as ContractArtifact,
    TokenRegistry: (TokenRegistry as any) as ContractArtifact,
    TokenTransferProxy: (TokenTransferProxy as any) as ContractArtifact,
    MultiSigWalletWithTimeLock: (MultiSigWalletWithTimeLock as any) as ContractArtifact,
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress: (MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress as any) as ContractArtifact,
};
