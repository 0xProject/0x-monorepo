import { ContractArtifact } from 'ethereum-types';

import * as AssetProxyOwner from '../../artifacts/2.0.0-beta-testnet/AssetProxyOwner.json';
import * as DummyERC20Token from '../../artifacts/2.0.0-beta-testnet/DummyERC20Token.json';
import * as DummyERC721Token from '../../artifacts/2.0.0-beta-testnet/DummyERC721Token.json';
import * as ERC20Proxy from '../../artifacts/2.0.0-beta-testnet/ERC20Proxy.json';
import * as ERC721Proxy from '../../artifacts/2.0.0-beta-testnet/ERC721Proxy.json';
import * as Exchange from '../../artifacts/2.0.0-beta-testnet/Exchange.json';
import * as Forwarder from '../../artifacts/2.0.0-beta-testnet/Forwarder.json';
import * as OrderValidator from '../../artifacts/2.0.0-beta-testnet/OrderValidator.json';
import * as ZRXToken from '../../artifacts/2.0.0-beta-testnet/ZRXToken.json';

export const artifacts = {
    AssetProxyOwner: (AssetProxyOwner as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    ERC20Proxy: (ERC20Proxy as any) as ContractArtifact,
    ERC721Proxy: (ERC721Proxy as any) as ContractArtifact,
    DummyERC721Token: (DummyERC721Token as any) as ContractArtifact,
    DummyERC20Token: (DummyERC20Token as any) as ContractArtifact,
    Forwarder: (Forwarder as any) as ContractArtifact,
    OrderValidator: (OrderValidator as any) as ContractArtifact,
    ZRX: (ZRXToken as any) as ContractArtifact,
};
