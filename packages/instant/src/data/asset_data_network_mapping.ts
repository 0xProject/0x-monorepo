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
    {
        [Network.Kovan]: '0xf47261b00000000000000000000000008cb3971b8eb709c14616bd556ff6683019e90d9c',
        [Network.Mainnet]: '0xf47261b0000000000000000000000000e94327d07fc17907b4db788e5adf2ed424addff6',
    },
];
