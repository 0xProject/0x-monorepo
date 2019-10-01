import * as bowser from 'bowser';
import {ZeroExProvider} from 'ethereum-types';
import * as _ from 'lodash';

import {PROVIDER_TYPE_TO_NAME} from '../constants';
import {Browser, OperatingSystem, ProviderType} from '../types';

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
    getProviderType(provider: ZeroExProvider): ProviderType | undefined {
        const anyProvider = provider as any;
        if (provider.constructor.name === 'EthereumProvider') {
            return ProviderType.Mist;
        } else if (anyProvider.isTrust) {
            return ProviderType.TrustWallet;
        } else if (anyProvider.isParity) {
            return ProviderType.Parity;
        } else if (anyProvider.isMetaMask) {
            return ProviderType.MetaMask;
        } else if (_.get(window, 'SOFA') !== undefined) {
            return ProviderType.CoinbaseWallet;
        } else if (_.get(window, '__CIPHER__') !== undefined) {
            return ProviderType.Cipher;
        } else if (envUtil.getBrowser() === Browser.Opera && !anyProvider.isMetaMask) {
            return ProviderType.Opera;
        }
        // If the provider is not supported by 0x, use fortmatic
        return ProviderType.Fortmatic;
    },
    getProviderName(provider: ZeroExProvider): string {
        const providerTypeIfExists = envUtil.getProviderType(provider);
        if (providerTypeIfExists === undefined) {
            return provider.constructor.name;
        }
        return PROVIDER_TYPE_TO_NAME[providerTypeIfExists];
    },
    getProviderDisplayName(provider: ZeroExProvider): string {
        const providerTypeIfExists = envUtil.getProviderType(provider);
        if (providerTypeIfExists === undefined) {
            return 'Wallet';
        }
        return PROVIDER_TYPE_TO_NAME[providerTypeIfExists];
    },
};
