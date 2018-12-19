import { ContractArtifact } from 'ethereum-types';

import * as BalanceThresholdFilter from '../../generated-artifacts/BalanceThresholdFilter.json';
import * as DutchAuction from '../../generated-artifacts/DutchAuction.json';
import * as Forwarder from '../../generated-artifacts/Forwarder.json';

export const artifacts = {
    BalanceThresholdFilter: BalanceThresholdFilter as ContractArtifact,
    DutchAuction: DutchAuction as ContractArtifact,
    Forwarder: Forwarder as ContractArtifact,
};
