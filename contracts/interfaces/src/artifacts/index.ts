import { ContractArtifact } from 'ethereum-types';

import * as IAssetData from '../../generated-artifacts/IAssetData.json';
import * as IAssetProxy from '../../generated-artifacts/IAssetProxy.json';
import * as IAssetProxyDispatcher from '../../generated-artifacts/IAssetProxyDispatcher.json';
import * as IAuthorizable from '../../generated-artifacts/IAuthorizable.json';
import * as IExchange from '../../generated-artifacts/IExchange.json';
import * as IExchangeCore from '../../generated-artifacts/IExchangeCore.json';
import * as IMatchOrders from '../../generated-artifacts/IMatchOrders.json';
import * as ISignatureValidator from '../../generated-artifacts/ISignatureValidator.json';
import * as ITransactions from '../../generated-artifacts/ITransactions.json';
import * as IValidator from '../../generated-artifacts/IValidator.json';
import * as IWallet from '../../generated-artifacts/IWallet.json';
import * as IWrapperFunctions from '../../generated-artifacts/IWrapperFunctions.json';

export const artifacts = {
    IAssetProxyDispatcher: IAssetProxyDispatcher as ContractArtifact,
    IAuthorizable: IAuthorizable as ContractArtifact,
    IExchange: IExchange as ContractArtifact,
    IExchangeCore: IExchangeCore as ContractArtifact,
    IMatchOrders: IMatchOrders as ContractArtifact,
    ISignatureValidator: ISignatureValidator as ContractArtifact,
    ITransactions: ITransactions as ContractArtifact,
    IWrapperFunctions: IWrapperFunctions as ContractArtifact,
    IAssetData: IAssetData as ContractArtifact,
    IAssetProxy: IAssetProxy as ContractArtifact,
    IValidator: IValidator as ContractArtifact,
    IWallet: IWallet as ContractArtifact,
};
