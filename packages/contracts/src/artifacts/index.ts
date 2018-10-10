import { ContractArtifact } from 'ethereum-types';

import * as AssetProxyOwner from '../../generated-artifacts/AssetProxyOwner.json';
import * as DummyERC20Token from '../../generated-artifacts/DummyERC20Token.json';
import * as DummyERC721Receiver from '../../generated-artifacts/DummyERC721Receiver.json';
import * as DummyERC721Token from '../../generated-artifacts/DummyERC721Token.json';
import * as DummyMultipleReturnERC20Token from '../../generated-artifacts/DummyMultipleReturnERC20Token.json';
import * as DummyNoReturnERC20Token from '../../generated-artifacts/DummyNoReturnERC20Token.json';
import * as ERC20Proxy from '../../generated-artifacts/ERC20Proxy.json';
import * as ERC20Token from '../../generated-artifacts/ERC20Token.json';
import * as ERC721Proxy from '../../generated-artifacts/ERC721Proxy.json';
import * as ERC721Token from '../../generated-artifacts/ERC721Token.json';
import * as Exchange from '../../generated-artifacts/Exchange.json';
import * as ExchangeWrapper from '../../generated-artifacts/ExchangeWrapper.json';
import * as Forwarder from '../../generated-artifacts/Forwarder.json';
import * as IAssetData from '../../generated-artifacts/IAssetData.json';
import * as IAssetProxy from '../../generated-artifacts/IAssetProxy.json';
import * as InvalidERC721Receiver from '../../generated-artifacts/InvalidERC721Receiver.json';
import * as IValidator from '../../generated-artifacts/IValidator.json';
import * as IWallet from '../../generated-artifacts/IWallet.json';
import * as MixinAuthorizable from '../../generated-artifacts/MixinAuthorizable.json';
import * as MultiSigWallet from '../../generated-artifacts/MultiSigWallet.json';
import * as MultiSigWalletWithTimeLock from '../../generated-artifacts/MultiSigWalletWithTimeLock.json';
import * as OrderValidator from '../../generated-artifacts/OrderValidator.json';
import * as ReentrantERC20Token from '../../generated-artifacts/ReentrantERC20Token.json';
import * as TestAssetProxyDispatcher from '../../generated-artifacts/TestAssetProxyDispatcher.json';
import * as TestAssetProxyOwner from '../../generated-artifacts/TestAssetProxyOwner.json';
import * as TestConstants from '../../generated-artifacts/TestConstants.json';
import * as TestExchangeInternals from '../../generated-artifacts/TestExchangeInternals.json';
import * as TestLibBytes from '../../generated-artifacts/TestLibBytes.json';
import * as TestLibs from '../../generated-artifacts/TestLibs.json';
import * as TestSignatureValidator from '../../generated-artifacts/TestSignatureValidator.json';
import * as TestStaticCallReceiver from '../../generated-artifacts/TestStaticCallReceiver.json';
import * as Validator from '../../generated-artifacts/Validator.json';
import * as Wallet from '../../generated-artifacts/Wallet.json';
import * as WETH9 from '../../generated-artifacts/WETH9.json';
import * as Whitelist from '../../generated-artifacts/Whitelist.json';
import * as ZRXToken from '../../generated-artifacts/ZRXToken.json';

export const artifacts = {
    AssetProxyOwner: AssetProxyOwner as ContractArtifact,
    DummyERC20Token: DummyERC20Token as ContractArtifact,
    DummyERC721Receiver: DummyERC721Receiver as ContractArtifact,
    DummyERC721Token: DummyERC721Token as ContractArtifact,
    DummyMultipleReturnERC20Token: DummyMultipleReturnERC20Token as ContractArtifact,
    DummyNoReturnERC20Token: DummyNoReturnERC20Token as ContractArtifact,
    ERC20Proxy: ERC20Proxy as ContractArtifact,
    ERC20Token: ERC20Token as ContractArtifact,
    ERC721Proxy: ERC721Proxy as ContractArtifact,
    ERC721Token: ERC721Token as ContractArtifact,
    Exchange: Exchange as ContractArtifact,
    ExchangeWrapper: ExchangeWrapper as ContractArtifact,
    Forwarder: Forwarder as ContractArtifact,
    IAssetData: IAssetData as ContractArtifact,
    IAssetProxy: IAssetProxy as ContractArtifact,
    IValidator: IValidator as ContractArtifact,
    IWallet: IWallet as ContractArtifact,
    InvalidERC721Receiver: InvalidERC721Receiver as ContractArtifact,
    MixinAuthorizable: MixinAuthorizable as ContractArtifact,
    MultiSigWallet: MultiSigWallet as ContractArtifact,
    MultiSigWalletWithTimeLock: MultiSigWalletWithTimeLock as ContractArtifact,
    OrderValidator: OrderValidator as ContractArtifact,
    ReentrantERC20Token: ReentrantERC20Token as ContractArtifact,
    TestAssetProxyDispatcher: TestAssetProxyDispatcher as ContractArtifact,
    TestAssetProxyOwner: TestAssetProxyOwner as ContractArtifact,
    TestConstants: TestConstants as ContractArtifact,
    TestExchangeInternals: TestExchangeInternals as ContractArtifact,
    TestLibBytes: TestLibBytes as ContractArtifact,
    TestLibs: TestLibs as ContractArtifact,
    TestSignatureValidator: TestSignatureValidator as ContractArtifact,
    TestStaticCallReceiver: TestStaticCallReceiver as ContractArtifact,
    Validator: Validator as ContractArtifact,
    WETH9: WETH9 as ContractArtifact,
    Wallet: Wallet as ContractArtifact,
    Whitelist: Whitelist as ContractArtifact,
    // Note(albrow): "as any" hack still required here because ZRXToken does not
    // conform to the v2 artifact type.
    ZRXToken: (ZRXToken as any) as ContractArtifact,
};
