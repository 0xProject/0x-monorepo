import { ContractArtifact } from 'ethereum-types';

import * as DummyERC20Token from './artifacts/DummyERC20Token.json';
import * as DummyERC721Token from './artifacts/DummyERC721Token.json';
import * as Exchange from './artifacts/Exchange.json';

export const artifacts = {
    DummyERC20Token: (DummyERC20Token as any) as ContractArtifact,
    DummyERC721Token: (DummyERC721Token as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
};
