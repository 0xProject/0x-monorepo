import { ContractArtifact } from '@0xproject/sol-compiler';

import * as AssetProxyOwner from '../../artifacts/2.0.0-beta-kovan/AssetProxyOwner.json';
import * as ERC20Proxy from '../../artifacts/2.0.0-beta-kovan/ERC20Proxy.json';
import * as ERC721Proxy from '../../artifacts/2.0.0-beta-kovan/ERC721Proxy.json';
import * as Exchange from '../../artifacts/2.0.0-beta-kovan/Exchange.json';

export const artifacts = {
    AssetProxyOwner: (AssetProxyOwner as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    ERC20Proxy: (ERC20Proxy as any) as ContractArtifact,
    ERC721Proxy: (ERC721Proxy as any) as ContractArtifact,
};
