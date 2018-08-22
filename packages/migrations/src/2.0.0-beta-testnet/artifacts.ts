import { ContractArtifact } from 'ethereum-types';

import * as AssetProxyOwner from '../../artifacts/2.0.0-beta-testnet/AssetProxyOwner.json';
import * as ERC20Proxy from '../../artifacts/2.0.0-beta-testnet/ERC20Proxy.json';
import * as ERC721Proxy from '../../artifacts/2.0.0-beta-testnet/ERC721Proxy.json';
import * as Exchange from '../../artifacts/2.0.0-beta-testnet/Exchange.json';
import * as OrderValidator from '../../artifacts/2.0.0-beta-testnet/OrderValidator.json';

export const artifacts = {
    AssetProxyOwner: (AssetProxyOwner as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    ERC20Proxy: (ERC20Proxy as any) as ContractArtifact,
    ERC721Proxy: (ERC721Proxy as any) as ContractArtifact,
    OrderValidator: (OrderValidator as any) as ContractArtifact,
};
