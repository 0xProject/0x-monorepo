import { Artifact } from '@0xproject/types';

import * as Exchange from './artifacts/Exchange.json';
import * as ISigner from './artifacts/ISigner.json';
export const artifacts = {
    Exchange: (Exchange as any) as Artifact,
    ISigner: (ISigner as any) as Artifact,
};
