import { Networks } from '../types';

export const constants = {
    DOCS_SCROLL_DURATION_MS: 0,
    SCROLL_CONTAINER_ID: 'scroll_container',
    SCROLL_TOP_ID: 'pageScrollTop',
    NETWORK_NAME_BY_ID: {
        1: Networks.Mainnet,
        3: Networks.Ropsten,
        4: Networks.Rinkeby,
        42: Networks.Kovan,
    } as { [symbol: number]: string },
    NETWORK_ID_BY_NAME: {
        [Networks.Mainnet]: 1,
        [Networks.Ropsten]: 3,
        [Networks.Rinkeby]: 4,
        [Networks.Kovan]: 42,
    } as { [networkName: string]: number },
};
