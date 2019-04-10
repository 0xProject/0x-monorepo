import * as _ from 'lodash';

import { Network } from '../types';

const etherscanPrefix = (networkId: number): string | undefined => {
    switch (networkId) {
        case Network.Kovan:
            return 'kovan.';
        case Network.Mainnet:
            return '';
    }
    return '';
};

export const etherscanUtil = {
    getEtherScanTxnAddressIfExists: (txHash: string, networkId: number) => {
        const prefix = etherscanPrefix(networkId);
        if (prefix === undefined) {
            return;
        }
        return `https://${prefix}etherscan.io/tx/${txHash}`;
    },
    getEtherScanEthAddressIfExists: (ethAddress: string, networkId: number) => {
        const prefix = etherscanPrefix(networkId);
        if (prefix === undefined) {
            return;
        }
        return `https://${prefix}etherscan.io/address/${ethAddress}`;
    },
};
