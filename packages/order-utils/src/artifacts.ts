import { ContractArtifact } from 'ethereum-types';

import * as DummyERC20Token from './artifacts/DummyERC20Token.json';
import * as ERC20Proxy from './artifacts/ERC20Proxy.json';
import * as Exchange from './artifacts/Exchange.json';
import * as IValidator from './artifacts/IValidator.json';
import * as IWallet from './artifacts/IWallet.json';
export const artifacts = {
    ERC20Proxy: (ERC20Proxy as any) as ContractArtifact,
    DummyERC20Token: (DummyERC20Token as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    IWallet: (IWallet as any) as ContractArtifact,
    IValidator: (IValidator as any) as ContractArtifact,
};
