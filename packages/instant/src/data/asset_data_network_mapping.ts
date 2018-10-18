import * as _ from 'lodash';

import { Network } from '../types';

interface AssetDataByNetwork {
    [Network.Kovan]?: string;
    [Network.Mainnet]?: string;
}

export const assetDataNetworkMapping: AssetDataByNetwork[] = [
    {
        [Network.Mainnet]: '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
        [Network.Kovan]: '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
    },
];
