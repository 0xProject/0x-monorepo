import { ContractArtifact } from '@0xproject/sol-compiler';

import * as DummyERC20Token from './artifacts/DummyERC20Token.json';
import * as DummyERC721Token from './artifacts/DummyERC721Token.json';
import * as ERC20Proxy from './artifacts/ERC20Proxy.json';
import * as ERC20Token from './artifacts/ERC20Token.json';
import * as ERC721Proxy from './artifacts/ERC721Proxy.json';
import * as ERC721Token from './artifacts/ERC721Token.json';
import * as Exchange from './artifacts/Exchange.json';
import * as Forwarder from './artifacts/Forwarder.json';
import * as EtherToken from './artifacts/WETH9.json';
import * as ZRXToken from './artifacts/ZRXToken.json';

export const artifacts = {
    ZRXToken: (ZRXToken as any) as ContractArtifact,
    DummyERC20Token: (DummyERC20Token as any) as ContractArtifact,
    DummyERC721Token: (DummyERC721Token as any) as ContractArtifact,
    ERC20Token: (ERC20Token as any) as ContractArtifact,
    ERC721Token: (ERC721Token as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    EtherToken: (EtherToken as any) as ContractArtifact,
    ERC20Proxy: (ERC20Proxy as any) as ContractArtifact,
    ERC721Proxy: (ERC721Proxy as any) as ContractArtifact,
    Forwarder: (Forwarder as any) as ContractArtifact,
};
