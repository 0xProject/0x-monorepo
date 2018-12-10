import { ContractArtifact } from 'ethereum-types';

import * as AssetProxyOwner from '../../generated-artifacts/AssetProxyOwner.json';
import * as ERC20Proxy from '../../generated-artifacts/ERC20Proxy.json';
import * as ERC721Proxy from '../../generated-artifacts/ERC721Proxy.json';
import * as Exchange from '../../generated-artifacts/Exchange.json';
import * as MixinAuthorizable from '../../generated-artifacts/MixinAuthorizable.json';
import * as MultiAssetProxy from '../../generated-artifacts/MultiAssetProxy.json';
import * as TestAssetProxyDispatcher from '../../generated-artifacts/TestAssetProxyDispatcher.json';
import * as TestAssetProxyOwner from '../../generated-artifacts/TestAssetProxyOwner.json';
import * as TestExchangeInternals from '../../generated-artifacts/TestExchangeInternals.json';
import * as TestSignatureValidator from '../../generated-artifacts/TestSignatureValidator.json';
import * as TestStaticCallReceiver from '../../generated-artifacts/TestStaticCallReceiver.json';

export const artifacts = {
    AssetProxyOwner: AssetProxyOwner as ContractArtifact,
    ERC20Proxy: ERC20Proxy as ContractArtifact,
    ERC721Proxy: ERC721Proxy as ContractArtifact,
    Exchange: Exchange as ContractArtifact,
    MixinAuthorizable: MixinAuthorizable as ContractArtifact,
    MultiAssetProxy: MultiAssetProxy as ContractArtifact,
    TestAssetProxyDispatcher: TestAssetProxyDispatcher as ContractArtifact,
    TestAssetProxyOwner: TestAssetProxyOwner as ContractArtifact,
    TestExchangeInternals: TestExchangeInternals as ContractArtifact,
    TestSignatureValidator: TestSignatureValidator as ContractArtifact,
    TestStaticCallReceiver: TestStaticCallReceiver as ContractArtifact,
};
