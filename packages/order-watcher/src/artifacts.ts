import { Artifact } from '@0xproject/types';

import * as ERC20Token from './compact_artifacts/ERC20Token.json';
import * as ERC721Token from './compact_artifacts/ERC721Token.json';
import * as Exchange from './compact_artifacts/Exchange.json';
import * as WETH9 from './compact_artifacts/WETH9.json';

export const artifacts = {
    ERC20Token: (ERC20Token as any) as Artifact,
    ERC721Token: (ERC721Token as any) as Artifact,
    Exchange: (Exchange as any) as Artifact,
    EtherToken: (WETH9 as any) as Artifact,
};
