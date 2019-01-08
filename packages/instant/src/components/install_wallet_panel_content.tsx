import * as React from 'react';

import {
    META_MASK_CHROME_STORE_URL,
    META_MASK_FIREFOX_STORE_URL,
    META_MASK_OPERA_STORE_URL,
    META_MASK_SITE_URL,
} from '../constants';
import { ColorOption } from '../style/theme';
import { Browser } from '../types';
import { analytics } from '../util/analytics';
import { envUtil } from '../util/env';
import { util } from '../util/util';

import { MetaMaskLogo } from './meta_mask_logo';
import { StandardPanelContent, StandardPanelContentProps } from './standard_panel_content';
import { Button } from './ui/button';

export interface InstallWalletPanelContentProps {}

export class InstallWalletPanelContent extends React.PureComponent<InstallWalletPanelContentProps> {
    public render(): React.ReactNode {
        const panelProps = this._getStandardPanelContentProps();
        return <StandardPanelContent {...panelProps} />;
    }
    private readonly _getStandardPanelContentProps = (): StandardPanelContentProps => {
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
        const onActionClick = () => {
            analytics.trackInstallWalletModalClickedGet();
            util.createOpenUrlInNewWindow(actionUrl)();
        };
        return {
            image: <MetaMaskLogo width={85} height={80} />,
            title: 'Install MetaMask',
            description,
            moreInfoSettings: {
                href: META_MASK_SITE_URL,
                text: 'What is MetaMask?',
                onClick: analytics.trackInstallWalletModalClickedExplanation,
            },
            action: (
                <Button
                    onClick={onActionClick}
                    width="100%"
                    fontColor={ColorOption.white}
                    backgroundColor={ColorOption.darkOrange}
                >
                    {actionText}
                </Button>
            ),
        };
    };
}
