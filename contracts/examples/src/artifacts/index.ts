import { ContractArtifact } from 'ethereum-types';

import * as ExchangeWrapper from '../../generated-artifacts/ExchangeWrapper.json';
import * as Validator from '../../generated-artifacts/Validator.json';
import * as Wallet from '../../generated-artifacts/Wallet.json';
import * as Whitelist from '../../generated-artifacts/Whitelist.json';

export const artifacts = {
    ExchangeWrapper: ExchangeWrapper as ContractArtifact,
    Validator: Validator as ContractArtifact,
    Wallet: Wallet as ContractArtifact,
    Whitelist: Whitelist as ContractArtifact,
};
