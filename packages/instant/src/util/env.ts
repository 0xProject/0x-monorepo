import * as bowser from 'bowser';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { PROVIDER_TYPE_TO_NAME } from '../constants';
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
    getProviderType(provider: Provider): ProviderType | undefined {
        if (provider.constructor.name === 'EthereumProvider') {
            return ProviderType.Mist;
        } else if ((provider as any).isParity) {
            return ProviderType.Parity;
        } else if ((provider as any).isMetaMask) {
            return ProviderType.MetaMask;
        } else if (!_.isUndefined(_.get(window, 'SOFA'))) {
            return ProviderType.CoinbaseWallet;
        } else if (!_.isUndefined(_.get(window, '__CIPHER__'))) {
            return ProviderType.Cipher;
        }
        return;
    },
    getProviderName(provider: Provider): string {
        const providerTypeIfExists = envUtil.getProviderType(provider);
        if (_.isUndefined(providerTypeIfExists)) {
            return provider.constructor.name;
        }
        return PROVIDER_TYPE_TO_NAME[providerTypeIfExists];
    },
};
