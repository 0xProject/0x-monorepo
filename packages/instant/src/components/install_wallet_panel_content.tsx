import * as React from 'react';

import {
    COINBASE_WALLET_ANDROID_APP_STORE_URL,
    COINBASE_WALLET_IOS_APP_STORE_URL,
    COINBASE_WALLET_SITE_URL,
    META_MASK_CHROME_STORE_URL,
    META_MASK_FIREFOX_STORE_URL,
    META_MASK_OPERA_STORE_URL,
    META_MASK_SITE_URL,
} from '../constants';
import { ColorOption } from '../style/theme';
import { Browser, OperatingSystem } from '../types';
import { envUtil } from '../util/env';

import { CoinbaseWalletLogo } from './coinbase_wallet_logo';
import { MetaMaskLogo } from './meta_mask_logo';
import { StandardPanelContent, StandardPanelContentProps } from './standard_panel_content';
import { Button } from './ui/button';

export interface InstallWalletPanelContentProps {}

export class InstallWalletPanelContent extends React.Component<InstallWalletPanelContentProps> {
    public render(): React.ReactNode {
        const panelProps = this._getStandardPanelContentProps();
        return <StandardPanelContent {...panelProps} />;
    }
    private readonly _getStandardPanelContentProps = (): StandardPanelContentProps => {
        const isMobileOS = envUtil.isMobileOperatingSystem();
        if (isMobileOS) {
            return this._getMobilePanelContentProps();
        } else {
            return this._getDesktopPanelContentProps();
        }
    };
    private readonly _getDesktopPanelContentProps = (): StandardPanelContentProps => {
        const browser = envUtil.getBrowser();
        let description = 'Please install the MetaMask wallet browser extension.';
        let actionText = 'Learn More';
        let actionUrl = META_MASK_SITE_URL;
        switch (browser) {
            case Browser.Chrome:
                description = 'Please install the MetaMask wallet browser extension from the Chrome Store.';
                actionText = 'Get Chrome Extension';
                actionUrl = META_MASK_CHROME_STORE_URL;
                break;
            case Browser.Firefox:
                description = 'Please install the MetaMask wallet browser extension from the Firefox Store.';
                actionText = 'Get Firefox Extension';
                actionUrl = META_MASK_FIREFOX_STORE_URL;
                break;
            case Browser.Opera:
                description = 'Please install the MetaMask wallet browser extension from the Opera Store.';
                actionText = 'Get Opera Add-on';
                actionUrl = META_MASK_OPERA_STORE_URL;
                break;
            default:
                break;
        }
        return {
            image: <MetaMaskLogo width={85} height={80} />,
            title: 'Install MetaMask',
            description,
            moreInfoSettings: {
                href: META_MASK_SITE_URL,
                text: 'What is MetaMask?',
            },
            action: (
                <Button
                    href={actionUrl}
                    width="100%"
                    fontColor={ColorOption.white}
                    backgroundColor={ColorOption.darkOrange}
                >
                    {actionText}
                </Button>
            ),
        };
    };
    private readonly _getMobilePanelContentProps = (): StandardPanelContentProps => {
        const operatingSystem = envUtil.getOperatingSystem();
        let description = 'Please install the Coinbase Wallet app.';
        let actionText = 'Learn More';
        let actionUrl = COINBASE_WALLET_SITE_URL;
        switch (operatingSystem) {
            case OperatingSystem.Android:
                description = 'Please install the Coinbase Wallet app from the Google Play Store.';
                actionText = 'Get Coinbase Wallet';
                actionUrl = COINBASE_WALLET_ANDROID_APP_STORE_URL;
                break;
            case OperatingSystem.iOS:
                description = 'Please install the Coinbase Wallet app from the iOS App Store.';
                actionText = 'Get Coinbase Wallet';
                actionUrl = COINBASE_WALLET_IOS_APP_STORE_URL;
                break;
            default:
                break;
        }
        return {
            image: <CoinbaseWalletLogo width={246} />,
            description,
            moreInfoSettings: {
                href: COINBASE_WALLET_SITE_URL,
                text: 'What is Coinbase Wallet?',
            },
            action: (
                <Button href={actionUrl} width="100%" fontColor={ColorOption.white} backgroundColor={ColorOption.blue}>
                    {actionText}
                </Button>
            ),
        };
    };
}
