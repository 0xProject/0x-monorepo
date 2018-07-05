import { ContractArtifact } from '@0xproject/sol-compiler';

import * as ERC20Token from './artifacts/ERC20Token.json';
import * as Exchange from './artifacts/Exchange.json';

export const artifacts = {
    ERC20Token: (ERC20Token as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
};
