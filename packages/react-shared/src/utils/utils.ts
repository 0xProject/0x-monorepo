import isMobile = require('is-mobile');
import * as _ from 'lodash';
import { scroller } from 'react-scroll';

import { EtherscanLinkSuffixes, Networks } from '../types';

import { constants } from './constants';

export const utils = {
    setUrlHash(anchorId: string): void {
        window.location.hash = anchorId;
    },
    scrollToHash(hash: string, containerId: string): void {
        let finalHash = hash;
        if (_.isEmpty(hash)) {
            finalHash = constants.SCROLL_TOP_ID; // scroll to the top
        }

        scroller.scrollTo(finalHash, {
            duration: 0,
            offset: 0,
            containerId,
        });
    },
    isUserOnMobile(): boolean {
        const isUserOnMobile = isMobile();
        return isUserOnMobile;
    },
    getIdFromName(name: string): string {
        const id = name.replace(/ /g, '-');
        return id;
    },
    convertDashesToSpaces(text: string): string {
        return text.replace(/-/g, ' ');
    },
    getEtherScanLinkIfExists(
        addressOrTxHash: string,
        networkId: number,
        suffix: EtherscanLinkSuffixes,
    ): string | undefined {
        const networkName = constants.NETWORK_NAME_BY_ID[networkId];
        if (_.isUndefined(networkName)) {
            return undefined;
        }
        const etherScanPrefix = networkName === Networks.Mainnet ? '' : `${networkName.toLowerCase()}.`;
        return `https://${etherScanPrefix}etherscan.io/${suffix}/${addressOrTxHash}`;
    },
};
