import { ContractArtifact } from 'ethereum-types';

import * as Exchange from './artifacts/Exchange.json';

export const artifacts = {
    Exchange: (Exchange as any) as ContractArtifact,
};
