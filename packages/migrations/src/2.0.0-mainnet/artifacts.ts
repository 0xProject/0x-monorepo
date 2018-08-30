import { ContractArtifact } from 'ethereum-types';

import * as AssetProxyOwner from '../../artifacts/2.0.0-mainnet/AssetProxyOwner.json';
import * as ERC20Proxy from '../../artifacts/2.0.0-mainnet/ERC20Proxy.json';
import * as ERC721Proxy from '../../artifacts/2.0.0-mainnet/ERC721Proxy.json';
import * as Exchange from '../../artifacts/2.0.0-mainnet/Exchange.json';
import * as Forwarder from '../../artifacts/2.0.0-mainnet/Forwarder.json';
import * as OrderValidator from '../../artifacts/2.0.0-mainnet/OrderValidator.json';

export const artifacts = {
    AssetProxyOwner: (AssetProxyOwner as any) as ContractArtifact,
    ERC20Proxy: (ERC20Proxy as any) as ContractArtifact,
    ERC721Proxy: (ERC721Proxy as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    Forwarder: (Forwarder as any) as ContractArtifact,
    OrderValidator: (OrderValidator as any) as ContractArtifact,
};
