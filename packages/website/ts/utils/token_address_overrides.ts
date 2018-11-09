import { ObjectMap } from '@0x/types';
import { constants } from 'ts/utils/constants';

// Map of networkId -> tokenSymbol -> tokenAddress
export type TokenOverrides = ObjectMap<ObjectMap<string>>;

export const tokenAddressOverrides: TokenOverrides = {
    [constants.NETWORK_ID_KOVAN]: {
        ZRX: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa',
        REP: '0x8cb3971b8eb709c14616bd556ff6683019e90d9c',
        DGD: '0xa4f468c9c692eb6b4b8b06270dae7a2cfeedcde9',
        GNT: '0x31fb614e223706f15d0d3c5f4b08bdf0d5c78623',
        MKR: '0x7b6b10caa9e8e9552ba72638ea5b47c25afea1f3',
        MLN: '0x17e394d1df6ce29d042195ea38411a98ff3ead94',
    },
    [constants.NETWORK_ID_ROPSTEN]: {
        ZRX: '0xff67881f8d12f372d91baae9752eb3631ff0ed00',
        REP: '0xb0b443fe0e8a04c4c85e8fda9c5c1ccc057d6653',
        DGD: '0xc4895a5aafa2708d6bc1294e20ec839aad156b1d',
        GNT: '0x7f8acc55a359ca4517c30510566ac35b800f7cac',
        MKR: '0x06732516acd125b6e83c127752ed5f027e1b276e',
        MLN: '0x823ebe83d39115536274a8617e00a1ff3544fd63',
    },
};
