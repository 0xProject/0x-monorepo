import { ContractArtifact } from 'ethereum-types';

import * as ERC20Token from './artifacts/ERC20Token.json';
import * as ERC721Token from './artifacts/ERC721Token.json';
import * as Exchange from './artifacts/Exchange.json';
import * as WETH9 from './artifacts/WETH9.json';

export const artifacts = {
    ERC20Token: (ERC20Token as any) as ContractArtifact,
    ERC721Token: (ERC721Token as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    EtherToken: (WETH9 as any) as ContractArtifact,
};
