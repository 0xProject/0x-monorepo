import * as bowser from 'bowser';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { Browser, OperatingSystem, ProviderType } from '../types';

export const envUtil = {
    getBrowser(): Browser {
        if (bowser.chrome) {
            return Browser.Chrome;
        } else if (bowser.firefox) {
            return Browser.Firefox;
        } else if (bowser.opera) {
            return Browser.Opera;
        } else if (bowser.msedge) {
            return Browser.Edge;
        } else if (bowser.safari) {
            return Browser.Safari;
        } else {
            return Browser.Other;
        }
    },
    isMobileOperatingSystem(): boolean {
        return bowser.mobile;
    },
    getOperatingSystem(): OperatingSystem {
        if (bowser.android) {
            return OperatingSystem.Android;
        } else if (bowser.ios) {
            return OperatingSystem.iOS;
        } else if (bowser.mac) {
            return OperatingSystem.Mac;
        } else if (bowser.windows) {
            return OperatingSystem.Windows;
        } else if (bowser.windowsphone) {
            return OperatingSystem.WindowsPhone;
        } else if (bowser.linux) {
            return OperatingSystem.Linux;
        } else {
            return OperatingSystem.Other;
        }
    },
    getProviderName(provider: Provider): ProviderType | string {
        const constructorName = provider.constructor.name;
        let parsedProviderName = constructorName;
        // https://ethereum.stackexchange.com/questions/24266/elegant-way-to-detect-current-provider-int-web3-js
        switch (constructorName) {
            case 'EthereumProvider':
                parsedProviderName = ProviderType.Mist;
                break;

            default:
                parsedProviderName = constructorName;
                break;
        }
        if ((provider as any).isParity) {
            parsedProviderName = ProviderType.Parity;
        } else if ((provider as any).isMetaMask) {
            parsedProviderName = ProviderType.MetaMask;
        } else if (!_.isUndefined(_.get(window, 'SOFA'))) {
            parsedProviderName = ProviderType.CoinbaseWallet;
        } else if (!_.isUndefined(_.get(window, '__CIPHER__'))) {
            parsedProviderName = ProviderType.Cipher;
        }
        return parsedProviderName;
    },
};
