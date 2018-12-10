import { ContractArtifact } from 'ethereum-types';

import * as DutchAuction from '../../generated-artifacts/DutchAuction.json';
import * as Forwarder from '../../generated-artifacts/Forwarder.json';
import * as OrderValidator from '../../generated-artifacts/OrderValidator.json';

export const artifacts = {
    DutchAuction: DutchAuction as ContractArtifact,
    Forwarder: Forwarder as ContractArtifact,
    OrderValidator: OrderValidator as ContractArtifact,
};
