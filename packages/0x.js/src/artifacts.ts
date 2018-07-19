import { ContractArtifact } from '@0xproject/sol-compiler';

import * as ZRXToken from './artifacts/ZRXToken.json';

export const artifacts = {
    ZRXToken: (ZRXToken as any) as ContractArtifact,
};
