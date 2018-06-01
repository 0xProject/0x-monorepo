import { Artifact } from '@0xproject/types';

import * as Exchange from './artifacts/Exchange.json';
import * as IValidator from './artifacts/IValidator.json';
import * as IWallet from './artifacts/IWallet.json';
export const artifacts = {
    Exchange: (Exchange as any) as Artifact,
    IWallet: (IWallet as any) as Artifact,
    IValidator: (IValidator as any) as Artifact,
};
